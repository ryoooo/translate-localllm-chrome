import type { Settings, TranslationProgress } from "../lib/types";

const translateBtn = document.getElementById("translate-btn") as HTMLButtonElement;
const optionsBtn = document.getElementById("options-btn") as HTMLButtonElement;
const statusDiv = document.getElementById("status") as HTMLDivElement;
const statusText = document.getElementById("status-text") as HTMLSpanElement;
const endpointName = document.getElementById("endpoint-name") as HTMLSpanElement;
const progressContainer = document.getElementById("progress-container") as HTMLDivElement;
const progressFill = document.getElementById("progress-fill") as HTMLDivElement;
const progressText = document.getElementById("progress-text") as HTMLDivElement;

// 設定を読み込んでエンドポイント名を表示
async function loadSettings(): Promise<void> {
	try {
		const settings = (await chrome.runtime.sendMessage({ type: "GET_SETTINGS" })) as Settings;
		const activeEndpoint = settings.endpoints.find((e) => e.id === settings.activeEndpointId);
		endpointName.textContent = activeEndpoint?.name ?? "未設定";

		if (!activeEndpoint) {
			setStatus("エンドポイントを設定してください", "error");
			translateBtn.disabled = true;
		}
	} catch (error) {
		console.error("Failed to load settings:", error);
		setStatus("設定の読み込みに失敗しました", "error");
		translateBtn.disabled = true;
	}
}

// ステータスを設定
function setStatus(message: string, type: "ready" | "error" | "translating" = "ready"): void {
	statusText.textContent = message;
	statusDiv.className = `status ${type}`;
}

// 進捗を更新
function updateProgress(progress: TranslationProgress): void {
	progressContainer.hidden = false;
	const percent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
	progressFill.style.width = `${percent}%`;
	progressText.textContent = `${progress.completed} / ${progress.total}`;

	if (progress.completed === progress.total) {
		setStatus("翻訳完了", "ready");
		translateBtn.disabled = false;
	}
}

// 翻訳開始
translateBtn.addEventListener("click", async () => {
	translateBtn.disabled = true;
	setStatus("翻訳中...", "translating");
	progressContainer.hidden = false;
	progressFill.style.width = "0%";
	progressText.textContent = "0 / 0";

	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab?.id) {
			await chrome.runtime.sendMessage({ type: "START_TRANSLATION", tabId: tab.id });
		}
	} catch (error) {
		console.error("Failed to start translation:", error);
		setStatus("翻訳の開始に失敗しました", "error");
		translateBtn.disabled = false;
	}
});

// 設定ページを開く
optionsBtn.addEventListener("click", () => {
	chrome.runtime.openOptionsPage();
});

// 進捗メッセージを受信
chrome.runtime.onMessage.addListener((message) => {
	if (message.type === "TRANSLATION_PROGRESS") {
		updateProgress(message.progress as TranslationProgress);
	}
});

// 初期化
loadSettings();
