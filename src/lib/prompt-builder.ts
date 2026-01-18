export interface PromptVariables {
	text: string;
	sourceLang?: string;
	targetLang?: string;
}

export function buildPrompt(template: string, variables: PromptVariables): string {
	const { text, sourceLang = "en", targetLang = "ja" } = variables;

	return template
		.replace(/\{\{text\}\}/g, text)
		.replace(/\{\{sourceLang\}\}/g, sourceLang)
		.replace(/\{\{targetLang\}\}/g, targetLang);
}

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

export function buildTranslateGemmaPrompt(
	text: string,
	sourceLang: string,
	targetLang: string,
): string {
	const sourceLangName = LANGUAGES[sourceLang] ?? sourceLang;
	const targetLangName = LANGUAGES[targetLang] ?? targetLang;

	return `<bos><start_of_turn>user
You are a professional ${sourceLangName} (${sourceLang}) to ${targetLangName} (${targetLang}) translator. Your goal is to accurately convey the meaning and nuances of the original ${sourceLangName} text while adhering to ${targetLangName} grammar, vocabulary, and cultural sensitivities.
Produce only the ${targetLangName} translation, without any additional explanations or commentary. Please translate the following ${sourceLangName} text into ${targetLangName}:


${text.trim()}<end_of_turn>
<start_of_turn>model
`;
}

export function buildPlamoPrompt(text: string, sourceLang: string, targetLang: string): string {
	return `<|plamo:op|>dataset
translation
<|plamo:op|>input lang=${sourceLang}
${text.trim()}
<|plamo:op|>output lang=${targetLang}
`;
}

export const PROMPT_PRESETS: Record<string, string> = {
	translategemma: "{{text}}",
	plamo: "{{text}}",
};
