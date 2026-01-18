import type { TranslateResponse, TranslationProgress } from "../lib/types";

// 翻訳対象の要素セレクタ
const TRANSLATABLE_SELECTORS = [
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"li",
	"td",
	"th",
	"span",
	"a",
	"blockquote",
	"figcaption",
].join(",");

// 除外セレクタ
const EXCLUDED_SELECTORS = ["script", "style", "noscript", "code", "pre", "textarea", "input"];

// 最小テキスト長（翻訳対象とする最小文字数）
const MIN_TEXT_LENGTH = 3;

// 翻訳中を示すクラス名
const TRANSLATING_CLASS = "llm-translator-translating";
const TRANSLATED_CLASS = "llm-translator-translated";

// 進捗表示用のスタイルを注入
function injectStyles(): void {
	if (document.getElementById("llm-translator-styles")) return;
	const style = document.createElement("style");
	style.id = "llm-translator-styles";
	style.textContent = `
		.${TRANSLATING_CLASS} {
			opacity: 0.6;
			position: relative;
		}
		.${TRANSLATING_CLASS}::after {
			content: "...";
			animation: llm-translator-pulse 1s infinite;
		}
		@keyframes llm-translator-pulse {
			0%, 100% { opacity: 0.3; }
			50% { opacity: 1; }
		}
		.${TRANSLATED_CLASS} {
			background-color: rgba(200, 230, 255, 0.2);
		}
	`;
	document.head.appendChild(style);
}

// 要素がテキストノードのみを含むかチェック（子要素を含まない）
function hasOnlyTextContent(element: HTMLElement): boolean {
	for (const child of element.childNodes) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			return false;
		}
	}
	return true;
}

// テキストを抽出する要素を取得
function getTranslatableElements(): HTMLElement[] {
	const elements = document.querySelectorAll<HTMLElement>(TRANSLATABLE_SELECTORS);
	const result: HTMLElement[] = [];

	const excludedSelector = EXCLUDED_SELECTORS.join(",");

	for (const el of elements) {
		// Skip elements inside excluded containers
		if (el.closest(excludedSelector)) {
			continue;
		}

		// Skip elements that contain child elements (to preserve links, etc.)
		if (!hasOnlyTextContent(el)) {
			continue;
		}

		const text = el.textContent?.trim() ?? "";
		if (text.length >= MIN_TEXT_LENGTH && /[a-zA-Z]/.test(text)) {
			result.push(el);
		}
	}

	return result;
}

// 翻訳を実行
async function translateElement(element: HTMLElement): Promise<void> {
	const originalText = element.textContent?.trim() ?? "";
	if (!originalText) return;

	element.classList.add(TRANSLATING_CLASS);
	element.dataset.originalText = originalText;

	try {
		const response = (await chrome.runtime.sendMessage({
			type: "TRANSLATE_TEXT",
			request: { text: originalText },
		})) as TranslateResponse;

		if (response.success && response.translatedText) {
			element.textContent = response.translatedText;
			element.classList.add(TRANSLATED_CLASS);
		} else {
			console.warn("Translation failed:", response.error);
		}
	} catch (error) {
		console.error("Translation error:", error);
	} finally {
		element.classList.remove(TRANSLATING_CLASS);
	}
}

// 翻訳を開始
async function startTranslation(): Promise<void> {
	injectStyles();

	const elements = getTranslatableElements();
	const progress: TranslationProgress = {
		total: elements.length,
		completed: 0,
		failed: 0,
	};

	// 進捗を報告
	chrome.runtime
		.sendMessage({
			type: "TRANSLATION_PROGRESS",
			progress,
		})
		.catch(() => {});

	// 逐次翻訳（並列だとAPIに負荷がかかりすぎる）
	for (const element of elements) {
		await translateElement(element);
		progress.completed++;

		chrome.runtime
			.sendMessage({
				type: "TRANSLATION_PROGRESS",
				progress,
			})
			.catch(() => {});
	}
}

// メッセージを受信
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === "START_EXTRACTION") {
		startTranslation()
			.then(() => sendResponse({ success: true }))
			.catch((error) => {
				console.error("Translation failed:", error);
				sendResponse({ success: false, error: String(error) });
			});
		return true;
	}
});
