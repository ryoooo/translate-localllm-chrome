import type { ApiType, TranslateResponse } from "./types";

export interface ApiClientConfig {
	url: string;
	model: string;
	apiType: ApiType;
	sourceLang?: string;
	targetLang?: string;
	timeout?: number;
}

interface ChatCompletionResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

interface CompletionResponse {
	choices: Array<{
		text: string;
	}>;
}

// 言語コードから言語名へのマッピング（主要言語のみ）
const LANGUAGES: Record<string, string> = {
	en: "English",
	ja: "Japanese",
	zh: "Chinese",
	ko: "Korean",
	es: "Spanish",
	fr: "French",
	de: "German",
	it: "Italian",
	pt: "Portuguese",
	ru: "Russian",
	ar: "Arabic",
	hi: "Hindi",
	th: "Thai",
	vi: "Vietnamese",
};

// TranslateGemma用のプロンプトを生成
function buildTranslateGemmaPrompt(text: string, sourceLang: string, targetLang: string): string {
	const sourceLangName = LANGUAGES[sourceLang] ?? sourceLang;
	const targetLangName = LANGUAGES[targetLang] ?? targetLang;

	return `<bos><start_of_turn>user
You are a professional ${sourceLangName} (${sourceLang}) to ${targetLangName} (${targetLang}) translator. Your goal is to accurately convey the meaning and nuances of the original ${sourceLangName} text while adhering to ${targetLangName} grammar, vocabulary, and cultural sensitivities.
Produce only the ${targetLangName} translation, without any additional explanations or commentary. Please translate the following ${sourceLangName} text into ${targetLangName}:


${text.trim()}<end_of_turn>
<start_of_turn>model
`;
}

// PLaMo-2-Translate用のプロンプトを生成
function buildPlamoPrompt(text: string, sourceLang: string, targetLang: string): string {
	return `<|plamo:op|>dataset
translation
<|plamo:op|>input lang=${sourceLang}
${text.trim()}
<|plamo:op|>output lang=${targetLang}
`;
}

export async function translateText(
	prompt: string,
	config: ApiClientConfig,
): Promise<TranslateResponse> {
	const { url, model, apiType, sourceLang = "en", targetLang = "ja", timeout = 60000 } = config;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		let body: Record<string, unknown>;
		if (apiType === "translategemma") {
			// TranslateGemma専用形式（Completions APIで直接プロンプトを生成）
			const translateGemmaPrompt = buildTranslateGemmaPrompt(prompt, sourceLang, targetLang);
			body = {
				model,
				prompt: translateGemmaPrompt,
				temperature: 0.1,
				max_tokens: 4096,
			};
		} else if (apiType === "plamo") {
			// PLaMo-2-Translate専用形式（Completions APIで直接プロンプトを生成）
			const plamoPrompt = buildPlamoPrompt(prompt, sourceLang, targetLang);
			body = {
				model,
				prompt: plamoPrompt,
				temperature: 0.1,
				max_tokens: 4096,
			};
		} else if (apiType === "chat") {
			// Chat Completions形式
			body = {
				model,
				messages: [{ role: "user", content: prompt }],
				temperature: 0.1,
				max_tokens: 4096,
			};
		} else {
			// Completions形式（レガシー）
			body = {
				model,
				prompt,
				temperature: 0.1,
				max_tokens: 4096,
			};
		}

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		if (!response.ok) {
			return {
				translatedText: "",
				success: false,
				error: `API error: ${response.status} ${response.statusText}`,
			};
		}

		let translatedText: string;
		if (apiType === "chat") {
			// Chat Completions形式
			const data = (await response.json()) as ChatCompletionResponse;
			translatedText = data.choices[0]?.message?.content?.trim() ?? "";
		} else {
			// Completions形式（translategemmaもこちら）
			const data = (await response.json()) as CompletionResponse;
			translatedText = data.choices[0]?.text?.trim() ?? "";
		}

		return {
			translatedText,
			success: true,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return {
			translatedText: "",
			success: false,
			error: message,
		};
	} finally {
		clearTimeout(timeoutId);
	}
}
