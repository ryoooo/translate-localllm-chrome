import { describe, expect, it } from "bun:test";
import { buildPrompt } from "./prompt-builder";

describe("buildPrompt", () => {
	it("should replace {{text}} placeholder", () => {
		const template = "Translate: {{text}}";
		const result = buildPrompt(template, { text: "Hello world" });
		expect(result).toBe("Translate: Hello world");
	});

	it("should replace {{sourceLang}} and {{targetLang}} placeholders", () => {
		const template = "Translate from {{sourceLang}} to {{targetLang}}: {{text}}";
		const result = buildPrompt(template, {
			text: "Hello",
			sourceLang: "English",
			targetLang: "Japanese",
		});
		expect(result).toBe("Translate from English to Japanese: Hello");
	});

	it("should use default languages when not provided", () => {
		const template = "{{sourceLang}} -> {{targetLang}}: {{text}}";
		const result = buildPrompt(template, { text: "Test" });
		expect(result).toBe("en -> ja: Test");
	});

	it("should handle complex templates", () => {
		const template = `<|plamo:op|>dataset
translation
<|plamo:op|>input lang={{sourceLang}}
{{text}}
<|plamo:op|>output lang={{targetLang}}`;
		const result = buildPrompt(template, {
			text: "Hello world",
			sourceLang: "English",
			targetLang: "Japanese",
		});
		expect(result).toContain("input lang=English");
		expect(result).toContain("Hello world");
		expect(result).toContain("output lang=Japanese");
	});
});
