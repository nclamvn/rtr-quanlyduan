import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermission } from "./usePermission";

// Mock AuthContext
vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../contexts/AuthContext";

function setupRole(role, extras = {}) {
  useAuth.mockReturnValue({
    user: { id: "u1", name: "Test User", role, ...extras },
  });
}

describe("usePermission", () => {
  describe("admin role", () => {
    beforeEach(() => setupRole("admin"));

    it("can create issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canCreateIssue()).toBe(true);
    });

    it("can review issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canReviewIssue()).toBe(true);
    });

    it("can edit any issue", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canEditIssue({ owner: "Other" })).toBe(true);
    });

    it("can delete any issue", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canDeleteIssue({ status: "OPEN" })).toBe(true);
    });

    it("can close any issue", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canCloseIssue({ owner: "Other" })).toBe(true);
    });

    it("can import", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canImport()).toBe(true);
    });

    it("can toggle gate", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canToggleGate()).toBe(true);
    });

    it("can transition phase", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canTransitionPhase()).toBe(true);
    });

    it("is admin", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.isAdmin()).toBe(true);
    });

    it("is not read-only", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.isReadOnly()).toBe(false);
    });

    it("new issue status is OPEN", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.getNewIssueStatus()).toBe("OPEN");
    });
  });

  describe("pm role", () => {
    beforeEach(() => setupRole("pm"));

    it("can create issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canCreateIssue()).toBe(true);
    });

    it("can review issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canReviewIssue()).toBe(true);
    });

    it("can delete DRAFT issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canDeleteIssue({ status: "DRAFT" })).toBe(true);
    });

    it("cannot delete non-DRAFT issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canDeleteIssue({ status: "OPEN" })).toBe(false);
    });

    it("can import", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canImport()).toBe(true);
    });

    it("new issue status is OPEN", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.getNewIssueStatus()).toBe("OPEN");
    });
  });

  describe("engineer role", () => {
    beforeEach(() => setupRole("engineer"));

    it("can create issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canCreateIssue()).toBe(true);
    });

    it("cannot review issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canReviewIssue()).toBe(false);
    });

    it("can edit own issue (by owner name)", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canEditIssue({ owner: "Test User" })).toBe(true);
    });

    it("can edit own issue (by owner_id)", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canEditIssue({ owner_id: "u1" })).toBe(true);
    });

    it("cannot edit others issue", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canEditIssue({ owner: "Other", owner_id: "u2", created_by: "u2" })).toBe(false);
    });

    it("cannot delete issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canDeleteIssue({ status: "DRAFT" })).toBe(false);
    });

    it("cannot import", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canImport()).toBe(false);
    });

    it("new issue status is DRAFT", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.getNewIssueStatus()).toBe("DRAFT");
    });
  });

  describe("viewer role", () => {
    beforeEach(() => setupRole("viewer"));

    it("can create issues (authenticated viewer)", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canCreateIssue()).toBe(true);
    });

    it("cannot edit issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canEditIssue({ owner: "Test User" })).toBe(false);
    });

    it("cannot review issues", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canReviewIssue()).toBe(false);
    });

    it("is read-only", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.isReadOnly()).toBe(true);
    });

    it("is not admin", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.isAdmin()).toBe(false);
    });
  });

  describe("guest role", () => {
    beforeEach(() => setupRole("guest"));

    it("is read-only", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.isReadOnly()).toBe(true);
    });

    it("is guest", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.isGuest()).toBe(true);
    });

    it("cannot import", () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.canImport()).toBe(false);
    });
  });
});
