import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardPage } from "@/components/dashboard-state";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Dashboard recovery", () => {
  it("remounts failed page content when retry is requested", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let unavailable = true;
    const renderPage = vi.fn(() => {
      if (unavailable) throw new Error("Unavailable sample data");
      return <input aria-label="Recovered page" defaultValue="available" />;
    });
    const { component: Page } = dashboardPage(renderPage, "Test dashboard", "Sample data");
    render(<Page />);
    await screen.findByRole("alert");
    const failedCalls = renderPage.mock.calls.length;
    unavailable = false;
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue("available"));
    expect(renderPage.mock.calls.length).toBeGreaterThan(failedCalls);
  });
});