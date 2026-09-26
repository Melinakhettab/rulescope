import { describe, it, expect } from "vitest";
import { applyMarkup } from "./src/pricing.js";

describe("applyMarkup", () => {
  it("applies 10% markup to 100", () => {
    expect(applyMarkup(100)).toBeCloseTo(110, 5);
  });
});
