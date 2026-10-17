import { afterEach, describe, expect, it, vi } from "vitest";
import { startVisibleInterval } from "@/lib/sim";

const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
};

afterEach(() => { setHidden(false); vi.useRealTimers(); });

describe("startVisibleInterval", () => {
  it("ticks while visible", () => {
    vi.useFakeTimers(); const tick = vi.fn();
    const stop = startVisibleInterval(tick, 1000);
    vi.advanceTimersByTime(3000);
    expect(tick).toHaveBeenCalledTimes(3); stop();
  });
  it("does no work while the tab is hidden and resumes when visible", () => {
    vi.useFakeTimers(); const tick = vi.fn();
    const stop = startVisibleInterval(tick, 1000);
    setHidden(true); vi.advanceTimersByTime(5000);
    expect(tick).toHaveBeenCalledTimes(0);
    setHidden(false); vi.advanceTimersByTime(2000);
    expect(tick).toHaveBeenCalledTimes(2); stop();
  });
  it("stops completely after cleanup", () => {
    vi.useFakeTimers(); const tick = vi.fn();
    startVisibleInterval(tick, 1000)();
    setHidden(true); setHidden(false); vi.advanceTimersByTime(5000);
    expect(tick).toHaveBeenCalledTimes(0);
  });
});
