import { sendMessage, type NativeConnectionResult } from "../../utils/messaging";

function setNativeStatus(result: NativeConnectionResult): void {
  const dot = document.getElementById("nativeStatusDot");
  const text = document.getElementById("nativeStatusText");

  if (!dot || !text) return;

  dot.classList.toggle("status-dot--connected", result.connected);
  dot.classList.toggle("status-dot--disconnected", !result.connected);
  text.textContent = result.connected
    ? "Native host: connected"
    : `Native host: disconnected${result.error ? ` (${result.error})` : ""}`;
}

async function refreshNativeStatus(): Promise<void> {
  try {
    setNativeStatus(await sendMessage("native:ping"));
  } catch (error) {
    setNativeStatus({
      connected: false,
      error: error instanceof Error ? error.message : "Unable to check status",
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void refreshNativeStatus();
});
