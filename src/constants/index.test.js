import { describe, it, expect } from "vitest";
import {
  PHASES,
  PHASE_COLORS,
  STATUS_LIST,
  STATUS_COLORS,
  SEV_LIST,
  SEV_COLORS,
  SRC_LIST,
  SRC_COLORS,
  mono,
  sans,
} from "./index";

describe("PHASES", () => {
  it("has exactly 5 phases in correct order", () => {
    expect(PHASES).toEqual(["CONCEPT", "EVT", "DVT", "PVT", "MP"]);
  });

  it("every phase has a color", () => {
    PHASES.forEach((p) => {
      expect(PHASE_COLORS[p]).toBeTruthy();
    });
  });
});

describe("STATUS_LIST", () => {
  it("has all 5 statuses", () => {
    expect(STATUS_LIST).toEqual(["DRAFT", "OPEN", "IN_PROGRESS", "BLOCKED", "CLOSED"]);
  });

  it("every status has a color", () => {
    STATUS_LIST.forEach((s) => {
      expect(STATUS_COLORS[s]).toBeTruthy();
    });
  });
});

describe("SEV_LIST", () => {
  it("has 4 severity levels from highest to lowest", () => {
    expect(SEV_LIST).toEqual(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
  });

  it("every severity has a color", () => {
    SEV_LIST.forEach((s) => {
      expect(SEV_COLORS[s]).toBeTruthy();
    });
  });
});

describe("SRC_LIST", () => {
  it("has all source types", () => {
    expect(SRC_LIST).toEqual(["INTERNAL", "EXTERNAL", "CROSS_TEAM"]);
  });

  it("every source has a color", () => {
    SRC_LIST.forEach((s) => {
      expect(SRC_COLORS[s]).toBeTruthy();
    });
  });
});

describe("Fonts", () => {
  it("mono font includes JetBrains Mono", () => {
    expect(mono).toContain("JetBrains Mono");
  });

  it("sans font includes Outfit", () => {
    expect(sans).toContain("Outfit");
  });
});
