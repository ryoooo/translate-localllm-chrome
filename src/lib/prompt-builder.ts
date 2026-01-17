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
