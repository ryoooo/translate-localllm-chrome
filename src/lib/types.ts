// API種類
export type ApiType = "chat" | "completions" | "translategemma" | "plamo";

// エンドポイント設定
export interface Endpoint {
	id: string;
	name: string;
	url: string;
	model: string;
	promptTemplate: string;
	apiType: ApiType;
	isDefault: boolean;
}

// ストレージに保存する設定
export interface Settings {
	endpoints: Endpoint[];
	activeEndpointId: string | null;
}

// 翻訳リクエスト
export interface TranslateRequest {
	text: string;
	sourceLang?: string;
	targetLang?: string;
}

// 翻訳レスポンス
export interface TranslateResponse {
	translatedText: string;
	success: boolean;
	error?: string;
}

// 翻訳進捗
export interface TranslationProgress {
	total: number;
	completed: number;
	failed: number;
}

// メッセージタイプ
export type MessageType =
	| { type: "START_TRANSLATION"; tabId: number }
	| { type: "TRANSLATE_TEXT"; request: TranslateRequest }
	| { type: "TRANSLATION_RESULT"; result: TranslateResponse; elementId: string }
	| { type: "TRANSLATION_PROGRESS"; progress: TranslationProgress }
	| { type: "GET_SETTINGS" }
	| { type: "SAVE_SETTINGS"; settings: Settings };

// デフォルト設定
export const DEFAULT_SETTINGS: Settings = {
	endpoints: [
		{
			id: "default-translategemma",
			name: "TranslateGemma",
			url: "http://localhost:1234/v1/completions",
			model: "translategemma-12b-it",
			promptTemplate: "{{text}}",
			apiType: "translategemma",
			isDefault: true,
		},
		{
			id: "default-plamo",
			name: "PLaMo-2-Translate",
			url: "http://localhost:1234/v1/completions",
			model: "plamo-2-translate",
			promptTemplate: "{{text}}",
			apiType: "plamo",
			isDefault: false,
		},
	],
	activeEndpointId: "default-translategemma",
};
