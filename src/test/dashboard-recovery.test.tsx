import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardState, dashboardPage } from "@/components/dashboard-state";

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

  it("prevents duplicate retries until the current retry finishes", async () => {
    let finish: (() => void) | undefined;
    const onRetry = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    render(<DashboardState kind="error" title="Unavailable" message="Sample page unavailable" onRetry={onRetry} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(onRetry).toHaveBeenCalledTimes(1);
    finish?.();
    await waitFor(() => expect(button).toBeEnabled());
  });

  it("allows another retry after an asynchronous retry rejects", async () => {
    const onRetry = vi.fn().mockRejectedValueOnce(new Error("Network unavailable")).mockResolvedValueOnce(undefined);
    render(<DashboardState kind="error" title="Unavailable" message="Sample page unavailable" onRetry={onRetry} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(button).toBeEnabled());
  });
});