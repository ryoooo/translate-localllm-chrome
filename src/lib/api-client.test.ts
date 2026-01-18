import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { type ApiClientConfig, translateText } from "./api-client";

describe("translateText", () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	describe("chat completions API", () => {
		beforeEach(() => {
			globalThis.fetch = mock(
				() =>
					Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								choices: [{ message: { content: "こんにちは世界" } }],
							}),
					} as Response),
				// biome-ignore lint/suspicious/noExplicitAny: Mock fetch for testing
			) as any;
		});

		it("should return translated text on success", async () => {
			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/chat/completions",
				model: "test-model",
				apiType: "chat",
			};

			const result = await translateText("Hello world", config);

			expect(result.success).toBe(true);
			expect(result.translatedText).toBe("こんにちは世界");
		});

		it("should call API with correct parameters", async () => {
			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/chat/completions",
				model: "my-model",
				apiType: "chat",
			};

			await translateText("Test prompt", config);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:1234/v1/chat/completions",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
				}),
			);

			// Verify body contains messages format
			const call = (fetch as unknown as ReturnType<typeof mock>).mock.calls[0];
			const body = JSON.parse(call[1].body as string);
			expect(body.messages).toBeDefined();
			expect(body.messages[0].role).toBe("user");
			expect(body.messages[0].content).toBe("Test prompt");
		});
	});

	describe("translategemma API", () => {
		beforeEach(() => {
			globalThis.fetch = mock(
				() =>
					Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								choices: [{ text: "こんにちは世界" }],
							}),
					} as Response),
				// biome-ignore lint/suspicious/noExplicitAny: Mock fetch for testing
			) as any;
		});

		it("should return translated text on success", async () => {
			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/completions",
				model: "translategemma-12b-it",
				apiType: "translategemma",
			};

			const result = await translateText("Hello world", config);

			expect(result.success).toBe(true);
			expect(result.translatedText).toBe("こんにちは世界");
		});

		it("should call API with completions format and TranslateGemma prompt", async () => {
			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/completions",
				model: "translategemma-12b-it",
				apiType: "translategemma",
				sourceLang: "en",
				targetLang: "ja",
			};

			await translateText("Test text", config);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:1234/v1/completions",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
				}),
			);

			// Verify body contains completions format with TranslateGemma prompt
			const call = (fetch as unknown as ReturnType<typeof mock>).mock.calls[0];
			const body = JSON.parse(call[1].body as string);
			expect(body.prompt).toBeDefined();
			expect(body.prompt).toContain("<start_of_turn>user");
			expect(body.prompt).toContain("English (en) to Japanese (ja)");
			expect(body.prompt).toContain("Test text");
			expect(body.messages).toBeUndefined();
		});
	});

	describe("plamo API", () => {
		beforeEach(() => {
			globalThis.fetch = mock(
				() =>
					Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								choices: [{ text: "こんにちは世界" }],
							}),
					} as Response),
				// biome-ignore lint/suspicious/noExplicitAny: Mock fetch for testing
			) as any;
		});

		it("should return translated text on success", async () => {
			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/completions",
				model: "plamo-2-translate",
				apiType: "plamo",
			};

			const result = await translateText("Hello world", config);

			expect(result.success).toBe(true);
			expect(result.translatedText).toBe("こんにちは世界");
		});

		it("should call API with PLaMo prompt format", async () => {
			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/completions",
				model: "plamo-2-translate",
				apiType: "plamo",
				sourceLang: "en",
				targetLang: "ja",
			};

			await translateText("Test text", config);

			const call = (fetch as unknown as ReturnType<typeof mock>).mock.calls[0];
			const body = JSON.parse(call[1].body as string);
			expect(body.prompt).toBeDefined();
			expect(body.prompt).toContain("<|plamo:op|>dataset");
			expect(body.prompt).toContain("lang=en");
			expect(body.prompt).toContain("lang=ja");
			expect(body.prompt).toContain("Test text");
			expect(body.messages).toBeUndefined();
		});
	});

	describe("completions API", () => {
		beforeEach(() => {
			globalThis.fetch = mock(
				() =>
					Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								choices: [{ text: "こんにちは世界" }],
							}),
					} as Response),
				// biome-ignore lint/suspicious/noExplicitAny: Mock fetch for testing
			) as any;
		});

		it("should return translated text on success", async () => {
			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/completions",
				model: "test-model",
				apiType: "completions",
			};

			const result = await translateText("Hello world", config);

			expect(result.success).toBe(true);
			expect(result.translatedText).toBe("こんにちは世界");
		});

		it("should call API with prompt format", async () => {
			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/completions",
				model: "my-model",
				apiType: "completions",
			};

			await translateText("Test prompt", config);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:1234/v1/completions",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
				}),
			);

			// Verify body contains prompt format (not messages)
			const call = (fetch as unknown as ReturnType<typeof mock>).mock.calls[0];
			const body = JSON.parse(call[1].body as string);
			expect(body.prompt).toBe("Test prompt");
			expect(body.messages).toBeUndefined();
		});
	});

	describe("error handling", () => {
		it("should return error on API failure", async () => {
			globalThis.fetch = mock(
				() =>
					Promise.resolve({
						ok: false,
						status: 500,
						statusText: "Internal Server Error",
					} as Response),
				// biome-ignore lint/suspicious/noExplicitAny: Mock fetch for testing
			) as any;

			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/completions",
				model: "test",
				apiType: "completions",
			};

			const result = await translateText("Test", config);

			expect(result.success).toBe(false);
			expect(result.error).toContain("500");
		});

		it("should handle network errors", async () => {
			globalThis.fetch = mock(
				() => Promise.reject(new Error("Network error")),
				// biome-ignore lint/suspicious/noExplicitAny: Mock fetch for testing
			) as any;

			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/completions",
				model: "test",
				apiType: "completions",
			};

			const result = await translateText("Test", config);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Network error");
		});

		it("should handle timeout", async () => {
			globalThis.fetch = mock(
				(_url: string, options: RequestInit) =>
					new Promise((resolve, reject) => {
						const timeoutId = setTimeout(
							() => resolve({ ok: true, json: () => Promise.resolve({ choices: [] }) } as Response),
							1000,
						);
						// Listen to abort signal like real fetch does
						options.signal?.addEventListener("abort", () => {
							clearTimeout(timeoutId);
							reject(new DOMException("The operation was aborted.", "AbortError"));
						});
					}),
				// biome-ignore lint/suspicious/noExplicitAny: Mock fetch for testing
			) as any;

			const config: ApiClientConfig = {
				url: "http://localhost:1234/v1/completions",
				model: "test",
				apiType: "completions",
				timeout: 50, // Very short timeout
			};

			const result = await translateText("Test", config);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});
});
