import { translateText } from "../lib/api-client";
import { buildPrompt } from "../lib/prompt-builder";
import { getActiveEndpoint, getSettings, saveSettings } from "../lib/storage";
import type { MessageType, TranslateRequest, TranslateResponse } from "../lib/types";

// コンテキストメニューを登録
chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "translate-page",
		title: "このページを翻訳",
		contexts: ["page"],
	});
});

// コンテキストメニュークリック
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "translate-page" && tab?.id) {
		startTranslation(tab.id).catch((error) => {
			console.error("Failed to start translation:", error);
		});
	}
});

// メッセージハンドラ
chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
	handleMessage(message).then(sendResponse);
	return true; // 非同期レスポンスを示す
});

async function handleMessage(message: MessageType): Promise<unknown> {
	switch (message.type) {
		case "START_TRANSLATION":
			return startTranslation(message.tabId);
		case "TRANSLATE_TEXT":
			return handleTranslateText(message.request);
		case "GET_SETTINGS":
			return getSettings();
		case "SAVE_SETTINGS":
			await saveSettings(message.settings);
			return { success: true };
		case "TRANSLATION_PROGRESS":
			// 進捗メッセージはポップアップに直接届くので、ここでは何もしない
			return { success: true };
		default:
			return { error: "Unknown message type" };
	}
}

async function startTranslation(tabId: number): Promise<void> {
	try {
		// 動的にcontent scriptを注入
		await chrome.scripting.executeScript({
			target: { tabId },
			files: ["content-script.js"],
		});
		// 注入後に翻訳開始メッセージを送信
		await chrome.tabs.sendMessage(tabId, { type: "START_EXTRACTION" });
	} catch (error) {
		console.error("Failed to inject content script:", error);
	}
}

async function handleTranslateText(request: TranslateRequest): Promise<TranslateResponse> {
	const endpoint = await getActiveEndpoint();
	if (!endpoint) {
		return { translatedText: "", success: false, error: "No active endpoint configured" };
	}

	const prompt = buildPrompt(endpoint.promptTemplate, {
		text: request.text,
		sourceLang: request.sourceLang,
		targetLang: request.targetLang,
	});

	return translateText(prompt, {
		url: endpoint.url,
		model: endpoint.model,
		apiType: endpoint.apiType,
		sourceLang: request.sourceLang ?? "en",
		targetLang: request.targetLang ?? "ja",
	});
}
