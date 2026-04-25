import type { OpenCanvasMessage } from "../../../packages/shared/src/protocol.js";

const CANVAS_ID = `pi-${chrome.runtime.id}-canvas`;

chrome.runtime.onMessage.addListener((message: OpenCanvasMessage) => {
  if (message?.type === "OPEN_CANVAS") {
    showCanvas();
    chrome.runtime.sendMessage({ type: "CANVAS_READY", url: location.href, requestId: message.requestId });
  }
});

function showCanvas(): void {
  const existingCanvas = document.getElementById(CANVAS_ID) as HTMLDialogElement | null;
  if (existingCanvas) {
    if (!existingCanvas.open) existingCanvas.showModal();
    existingCanvas.focus();
    return;
  }

  const canvas = document.createElement("dialog");
  canvas.id = CANVAS_ID;
  canvas.innerHTML = `
    <form method="dialog">
      <p>Pi, native host, and browser extension are connected.</p>
      <p>Build your UI in apps/extension/src/content.ts.</p>
      <button>Close</button>
    </form>
  `;

  document.documentElement.appendChild(canvas);
  canvas.showModal();
}
