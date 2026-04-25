import type { ConnectionResult } from "../../../packages/shared/src/protocol.js";

const extensionName = chrome.runtime.getManifest().name;
const extensionId = chrome.runtime.id;
const installCommand = `apps/native-host/install/install.sh ${extensionId}`;

const extensionNameHeading = mustGetElement<HTMLElement>("extension-name");
const installCommandInput = mustGetElement<HTMLTextAreaElement>("install-cmd");
const statusDot = mustGetElement<HTMLElement>("status-dot");
const statusText = mustGetElement<HTMLElement>("status-text");
const setupSection = mustGetElement<HTMLElement>("setup-section");
const readySection = mustGetElement<HTMLElement>("ready-section");
const troubleSection = mustGetElement<HTMLElement>("trouble-section");
const troubleDetail = mustGetElement<HTMLElement>("trouble-detail");
const quitTip = mustGetElement<HTMLElement>("quit-tip");

extensionNameHeading.textContent = extensionName;
installCommandInput.value = installCommand;

const isMac = isMacPlatform();
quitTip.textContent = isMac
  ? "Fully quit the supported browser (⌘Q) and reopen"
  : "Fully quit the supported browser (menu → Exit) and reopen";

mustGetElement("copy-cmd").addEventListener("click", () => copyToClipboard(installCommand));
mustGetElement("start-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OPEN_CANVAS" });
  window.close();
});
mustGetElement("retry-btn").addEventListener("click", checkConnection);

function mustGetElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element as T;
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}

function isMacPlatform(): boolean {
  const navigatorWithUserAgentData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = navigatorWithUserAgentData.userAgentData?.platform || navigator.userAgent;
  return platform.toUpperCase().includes("MAC");
}

async function checkConnection(): Promise<void> {
  showChecking();

  try {
    const result = await chrome.runtime.sendMessage({ type: "CHECK_CONNECTION" }) as ConnectionResult | undefined;
    if (result?.connected) return showConnected();

    const error = result?.error || "Native host disconnected";
    if (error.includes("not found")) return showNotInstalled("Native host not found");
    if (error.includes("forbidden")) return showNotInstalled("Extension ID mismatch - reinstall native host");
    showTrouble(error);
  } catch (err) {
    showTrouble(err instanceof Error ? err.message : String(err));
  }
}

function showConnected(): void {
  statusDot.style.color = "green";
  statusText.textContent = "Connected";
  setupSection.hidden = true;
  readySection.hidden = false;
  troubleSection.hidden = true;
}

function showNotInstalled(detail: string): void {
  statusDot.style.color = "red";
  statusText.textContent = detail;
  setupSection.hidden = false;
  readySection.hidden = true;
  troubleSection.hidden = true;
}

function showTrouble(error: string): void {
  statusDot.style.color = "orange";
  statusText.textContent = "Connection issue";
  setupSection.hidden = false;
  readySection.hidden = true;
  troubleSection.hidden = false;
  troubleDetail.textContent = error;
}

function showChecking(): void {
  statusDot.style.color = "gray";
  statusText.textContent = "Checking...";
  setupSection.hidden = false;
  readySection.hidden = true;
  troubleSection.hidden = true;
}

checkConnection();
