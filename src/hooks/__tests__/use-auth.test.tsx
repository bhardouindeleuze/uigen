import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

// Mock dependencies
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
vi.mock("@/actions", () => ({
  signIn: (...args: any[]) => mockSignIn(...args),
  signUp: (...args: any[]) => mockSignUp(...args),
}));

const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: (...args: any[]) => mockGetAnonWorkData(...args),
  clearAnonWork: (...args: any[]) => mockClearAnonWork(...args),
}));

const mockGetProjects = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: (...args: any[]) => mockGetProjects(...args),
}));

const mockCreateProject = vi.fn();
vi.mock("@/actions/create-project", () => ({
  createProject: (...args: any[]) => mockCreateProject(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAuth", () => {
  describe("signIn", () => {
    test("returns result from signIn action", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn("test@example.com", "password");
      });

      expect(signInResult).toEqual({ success: false, error: "Invalid credentials" });
      expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password");
    });

    test("sets isLoading during sign in and resets after", async () => {
      let resolveSignIn: (value: any) => void;
      mockSignIn.mockReturnValue(
        new Promise((resolve) => { resolveSignIn = resolve; })
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn!({ success: false, error: "fail" });
        await signInPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading even when signIn action throws", async () => {
      mockSignIn.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signIn("a@b.com", "pass")).rejects.toThrow("Network error");
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("does not navigate when signIn fails", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("navigates to anon work project after successful signIn", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "hello" }],
        fileSystemData: { "/": {} },
      });
      mockCreateProject.mockResolvedValue({ id: "proj-anon-123" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: "user", content: "hello" }],
          data: { "/": {} },
        })
      );
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-anon-123");
    });

    test("navigates to most recent project when no anon work", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([
        { id: "proj-1", name: "Latest" },
        { id: "proj-2", name: "Older" },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-1");
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    test("creates new project when no anon work and no existing projects", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "proj-new-456" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [],
          data: {},
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/proj-new-456");
    });
  });

  describe("signUp", () => {
    test("returns result from signUp action", async () => {
      mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });

      const { result } = renderHook(() => useAuth());

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp("test@example.com", "password123");
      });

      expect(signUpResult).toEqual({ success: false, error: "Email already registered" });
      expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123");
    });

    test("sets isLoading during sign up and resets after", async () => {
      let resolveSignUp: (value: any) => void;
      mockSignUp.mockReturnValue(
        new Promise((resolve) => { resolveSignUp = resolve; })
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp!({ success: false, error: "fail" });
        await signUpPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading even when signUp action throws", async () => {
      mockSignUp.mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signUp("a@b.com", "pass1234")).rejects.toThrow("Server error");
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("does not navigate when signUp fails", async () => {
      mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("test@example.com", "password123");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("navigates to anon work project after successful signUp", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "build me a form" }],
        fileSystemData: { "/": {}, "/App.tsx": { content: "..." } },
      });
      mockCreateProject.mockResolvedValue({ id: "proj-anon-789" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: "user", content: "build me a form" }],
          data: { "/": {}, "/App.tsx": { content: "..." } },
        })
      );
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-anon-789");
    });

    test("navigates to most recent project when no anon work", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "proj-existing" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-existing");
    });

    test("creates new project when no anon work and no existing projects", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "proj-brand-new" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [],
          data: {},
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/proj-brand-new");
    });
  });

  describe("handlePostSignIn edge cases", () => {
    test("skips anon work when messages array is empty", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({
        messages: [],
        fileSystemData: { "/": {} },
      });
      mockGetProjects.mockResolvedValue([{ id: "proj-fallback" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      // Should not create project from anon work since messages is empty
      expect(mockClearAnonWork).not.toHaveBeenCalled();
      // Should fall through to getProjects
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-fallback");
    });

    test("skips anon work when getAnonWorkData returns null", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "new-proj" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockCreateProject).toHaveBeenCalled();
    });
  });
});
