import { buildPlamoPrompt, buildTranslateGemmaPrompt } from "./prompt-builder";
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

export async function translateText(
	prompt: string,
	config: ApiClientConfig,
): Promise<TranslateResponse> {
	const { url, model, apiType, sourceLang = "en", targetLang = "ja", timeout = 60000 } = config;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const baseParams = { model, temperature: 0.1, max_tokens: 4096 };

		let body: Record<string, unknown>;
		switch (apiType) {
			case "translategemma": {
				// TranslateGemma専用形式（Completions APIで直接プロンプトを生成）
				const translateGemmaPrompt = buildTranslateGemmaPrompt(prompt, sourceLang, targetLang);
				body = { ...baseParams, prompt: translateGemmaPrompt };
				break;
			}
			case "plamo": {
				// PLaMo-2-Translate専用形式（Completions APIで直接プロンプトを生成）
				const plamoPrompt = buildPlamoPrompt(prompt, sourceLang, targetLang);
				body = { ...baseParams, prompt: plamoPrompt };
				break;
			}
			case "chat":
				// Chat Completions形式
				body = { ...baseParams, messages: [{ role: "user", content: prompt }] };
				break;
			default:
				// Completions形式（レガシー）
				body = { ...baseParams, prompt };
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

		const json = await response.json();
		const translatedText =
			apiType === "chat"
				? ((json as ChatCompletionResponse).choices[0]?.message?.content?.trim() ?? "")
				: ((json as CompletionResponse).choices[0]?.text?.trim() ?? "");

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
