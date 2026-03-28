// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

// Mock "server-only" to allow importing in test environment
vi.mock("server-only", () => ({}));

// Mock next/headers cookies
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock NextRequest for verifySession
function createMockRequest(cookieValue?: string) {
  return {
    cookies: {
      get: vi.fn((name: string) =>
        cookieValue ? { name, value: cookieValue } : undefined
      ),
    },
  } as any;
}

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets an httpOnly cookie with JWT", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, token, options] = mockCookieStore.set.mock.calls[0];

  expect(name).toBe("auth-token");
  expect(typeof token).toBe("string");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");

  // Verify the token contains correct payload
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("createSession sets cookie expiry to 7 days", async () => {
  const { createSession } = await import("@/lib/auth");

  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const expires = new Date(options.expires).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  expect(expires).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(expires).toBeLessThanOrEqual(after + sevenDays + 1000);
});

test("getSession returns payload from valid token", async () => {
  const { getSession } = await import("@/lib/auth");

  const token = await new SignJWT({
    userId: "user-456",
    email: "user@test.com",
    expiresAt: new Date(Date.now() + 86400000),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-456");
  expect(session!.email).toBe("user@test.com");
});

test("getSession returns null when no cookie exists", async () => {
  const { getSession } = await import("@/lib/auth");

  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for invalid token", async () => {
  const { getSession } = await import("@/lib/auth");

  mockCookieStore.get.mockReturnValue({ value: "invalid-token" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for token signed with wrong secret", async () => {
  const { getSession } = await import("@/lib/auth");

  const wrongSecret = new TextEncoder().encode("wrong-secret");
  const token = await new SignJWT({ userId: "user-1", email: "a@b.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(wrongSecret);

  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});

test("deleteSession removes the auth cookie", async () => {
  const { deleteSession } = await import("@/lib/auth");

  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

test("verifySession returns payload from valid token on request", async () => {
  const { verifySession } = await import("@/lib/auth");

  const token = await new SignJWT({
    userId: "user-789",
    email: "req@test.com",
    expiresAt: new Date(Date.now() + 86400000),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const request = createMockRequest(token);
  const session = await verifySession(request);

  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-789");
  expect(session!.email).toBe("req@test.com");
});

test("verifySession returns null when no cookie on request", async () => {
  const { verifySession } = await import("@/lib/auth");

  const request = createMockRequest();
  const session = await verifySession(request);

  expect(session).toBeNull();
});

test("verifySession returns null for invalid token on request", async () => {
  const { verifySession } = await import("@/lib/auth");

  const request = createMockRequest("garbage-token");
  const session = await verifySession(request);

  expect(session).toBeNull();
});
