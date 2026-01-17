import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Settings } from "./types";

// Chrome Storage APIのモック
const mockStorage: Record<string, unknown> = {};

globalThis.chrome = {
	storage: {
		local: {
			get: mock((keys: string[]) => {
				const result: Record<string, unknown> = {};
				for (const key of keys) {
					if (key in mockStorage) {
						result[key] = mockStorage[key];
					}
				}
				return Promise.resolve(result);
			}),
			set: mock((items: Record<string, unknown>) => {
				Object.assign(mockStorage, items);
				return Promise.resolve();
			}),
		},
	},
} as unknown as typeof chrome;

// テスト対象をインポート（モック設定後）
const { getSettings, saveSettings, getActiveEndpoint, setActiveEndpoint } = await import(
	"./storage"
);

describe("storage", () => {
	beforeEach(() => {
		// ストレージをクリア
		for (const key of Object.keys(mockStorage)) {
			delete mockStorage[key];
		}
	});

	describe("getSettings", () => {
		it("should return default settings when storage is empty", async () => {
			const settings = await getSettings();
			expect(settings.endpoints).toHaveLength(1);
			expect(settings.endpoints[0].name).toBe("TranslateGemma (Default)");
		});

		it("should return saved settings", async () => {
			const customSettings = {
				endpoints: [
					{
						id: "test",
						name: "Test",
						url: "http://test",
						model: "test",
						promptTemplate: "{{text}}",
						apiType: "completions",
						isDefault: true,
					},
				],
				activeEndpointId: "test",
			};
			mockStorage.settings = customSettings;

			const settings = await getSettings();
			expect(settings.endpoints[0].id).toBe("test");
		});
	});

	describe("saveSettings", () => {
		it("should save settings to storage", async () => {
			const settings: Settings = {
				endpoints: [
					{
						id: "new",
						name: "New",
						url: "http://new",
						model: "new",
						promptTemplate: "{{text}}",
						apiType: "completions",
						isDefault: true,
					},
				],
				activeEndpointId: "new",
			};

			await saveSettings(settings);
			expect(mockStorage.settings).toEqual(settings);
		});
	});

	describe("getActiveEndpoint", () => {
		it("should return the active endpoint", async () => {
			const settings = {
				endpoints: [
					{
						id: "a",
						name: "A",
						url: "http://a",
						model: "a",
						promptTemplate: "{{text}}",
						apiType: "completions",
						isDefault: false,
					},
					{
						id: "b",
						name: "B",
						url: "http://b",
						model: "b",
						promptTemplate: "{{text}}",
						apiType: "completions",
						isDefault: true,
					},
				],
				activeEndpointId: "b",
			};
			mockStorage.settings = settings;

			const endpoint = await getActiveEndpoint();
			expect(endpoint?.id).toBe("b");
		});

		it("should return undefined when no active endpoint", async () => {
			mockStorage.settings = { endpoints: [], activeEndpointId: null };
			const endpoint = await getActiveEndpoint();
			expect(endpoint).toBeUndefined();
		});
	});

	describe("setActiveEndpoint", () => {
		it("should set the active endpoint", async () => {
			const settings = {
				endpoints: [
					{
						id: "a",
						name: "A",
						url: "http://a",
						model: "a",
						promptTemplate: "{{text}}",
						apiType: "completions",
						isDefault: false,
					},
					{
						id: "b",
						name: "B",
						url: "http://b",
						model: "b",
						promptTemplate: "{{text}}",
						apiType: "completions",
						isDefault: true,
					},
				],
				activeEndpointId: "a",
			};
			mockStorage.settings = settings;

			await setActiveEndpoint("b");

			const updated = mockStorage.settings as { activeEndpointId: string };
			expect(updated.activeEndpointId).toBe("b");
		});
	});
});
