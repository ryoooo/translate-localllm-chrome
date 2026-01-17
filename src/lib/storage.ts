import { DEFAULT_SETTINGS, type Endpoint, type Settings } from "./types";

export async function getSettings(): Promise<Settings> {
	const result = await chrome.storage.local.get(["settings"]);
	return result.settings ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
	await chrome.storage.local.set({ settings });
}

export async function getActiveEndpoint(): Promise<Endpoint | undefined> {
	const settings = await getSettings();
	return settings.endpoints.find((e) => e.id === settings.activeEndpointId);
}

export async function setActiveEndpoint(endpointId: string): Promise<void> {
	const settings = await getSettings();
	settings.activeEndpointId = endpointId;
	await saveSettings(settings);
}
