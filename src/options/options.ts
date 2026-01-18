import type { ApiType, Endpoint, Settings } from "../lib/types";

// プリセットテンプレート
const PRESETS: Record<string, string> = {
	translategemma: "{{text}}",
	plamo: `<|plamo:op|>dataset
translation
<|plamo:op|>input lang={{sourceLang}}
{{text}}
<|plamo:op|>output lang={{targetLang}}`,
};

// DOM要素
const endpointsList = document.getElementById("endpoints-list") as HTMLDivElement;
const endpointForm = document.getElementById("endpoint-form") as HTMLDivElement;
const formTitle = document.getElementById("form-title") as HTMLHeadingElement;
const addEndpointBtn = document.getElementById("add-endpoint-btn") as HTMLButtonElement;
const saveEndpointBtn = document.getElementById("save-endpoint-btn") as HTMLButtonElement;
const cancelEndpointBtn = document.getElementById("cancel-endpoint-btn") as HTMLButtonElement;
const nameInput = document.getElementById("endpoint-name") as HTMLInputElement;
const urlInput = document.getElementById("endpoint-url") as HTMLInputElement;
const apiTypeSelect = document.getElementById("endpoint-api-type") as HTMLSelectElement;
const modelInput = document.getElementById("endpoint-model") as HTMLInputElement;
const templateInput = document.getElementById("endpoint-template") as HTMLTextAreaElement;
const toast = document.getElementById("toast") as HTMLDivElement;

let settings: Settings;
let editingEndpointId: string | null = null;

// 設定を読み込む
async function loadSettings(): Promise<void> {
	try {
		settings = (await chrome.runtime.sendMessage({ type: "GET_SETTINGS" })) as Settings;
		renderEndpoints();
	} catch (error) {
		console.error("Failed to load settings:", error);
		showToast("設定の読み込みに失敗しました", "error");
	}
}

// エンドポイント一覧を描画
function renderEndpoints(): void {
	endpointsList.innerHTML = "";

	for (const endpoint of settings.endpoints) {
		const isActive = endpoint.id === settings.activeEndpointId;
		const item = document.createElement("div");
		item.className = `endpoint-item ${isActive ? "active" : ""}`;
		item.innerHTML = `
			<input type="radio" name="active-endpoint" value="${endpoint.id}" ${isActive ? "checked" : ""}>
			<div class="endpoint-info">
				<div class="name">${escapeHtml(endpoint.name)}</div>
				<div class="url">${escapeHtml(endpoint.url)}</div>
			</div>
			<div class="endpoint-actions">
				<button class="btn secondary small edit-btn" data-id="${endpoint.id}">編集</button>
				<button class="btn danger small delete-btn" data-id="${endpoint.id}">削除</button>
			</div>
		`;
		endpointsList.appendChild(item);
	}
}

// アクティブエンドポイントを設定
async function setActiveEndpoint(endpointId: string): Promise<void> {
	settings.activeEndpointId = endpointId;
	await saveSettings();
	renderEndpoints();
	showToast("アクティブエンドポイントを変更しました", "success");
}

// 新規エンドポイント追加フォームを表示
function showAddForm(): void {
	editingEndpointId = null;
	formTitle.textContent = "エンドポイント追加";
	nameInput.value = "";
	urlInput.value = "";
	apiTypeSelect.value = "translategemma";
	modelInput.value = "";
	templateInput.value = "";
	endpointForm.hidden = false;
}

// エンドポイント編集フォームを表示
function editEndpoint(id: string): void {
	const endpoint = settings.endpoints.find((e) => e.id === id);
	if (!endpoint) return;

	editingEndpointId = id;
	formTitle.textContent = "エンドポイント編集";
	nameInput.value = endpoint.name;
	urlInput.value = endpoint.url;
	apiTypeSelect.value = endpoint.apiType ?? "completions";
	modelInput.value = endpoint.model;
	templateInput.value = endpoint.promptTemplate;
	endpointForm.hidden = false;
}

// エンドポイントを保存
async function saveEndpoint(): Promise<void> {
	const name = nameInput.value.trim();
	const url = urlInput.value.trim();
	const apiType = apiTypeSelect.value as ApiType;
	const model = modelInput.value.trim();
	const promptTemplate = templateInput.value.trim();

	if (!name || !url || !model || !promptTemplate) {
		showToast("すべての項目を入力してください", "error");
		return;
	}

	if (editingEndpointId) {
		// 更新
		const index = settings.endpoints.findIndex((e) => e.id === editingEndpointId);
		if (index !== -1) {
			settings.endpoints[index] = {
				...settings.endpoints[index],
				name,
				url,
				apiType,
				model,
				promptTemplate,
			};
		}
	} else {
		// 新規作成
		const newEndpoint: Endpoint = {
			id: crypto.randomUUID(),
			name,
			url,
			apiType,
			model,
			promptTemplate,
			isDefault: settings.endpoints.length === 0,
		};
		settings.endpoints.push(newEndpoint);

		// 最初のエンドポイントの場合はアクティブに設定
		if (!settings.activeEndpointId) {
			settings.activeEndpointId = newEndpoint.id;
		}
	}

	await saveSettings();
	hideForm();
	renderEndpoints();
	showToast("保存しました", "success");
}

// エンドポイントを削除
async function deleteEndpoint(id: string): Promise<void> {
	if (!confirm("このエンドポイントを削除しますか？")) return;

	settings.endpoints = settings.endpoints.filter((e) => e.id !== id);

	// 削除されたのがアクティブだった場合、別のエンドポイントをアクティブに
	if (settings.activeEndpointId === id) {
		settings.activeEndpointId = settings.endpoints[0]?.id ?? null;
	}

	await saveSettings();
	renderEndpoints();
	showToast("削除しました", "success");
}

// フォームを非表示
function hideForm(): void {
	endpointForm.hidden = true;
	editingEndpointId = null;
}

// 設定を保存
async function saveSettings(): Promise<void> {
	try {
		await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings });
	} catch (error) {
		console.error("Failed to save settings:", error);
		showToast("設定の保存に失敗しました", "error");
	}
}

// プリセットを適用
function applyPreset(presetName: string): void {
	const template = PRESETS[presetName];
	if (template) {
		templateInput.value = template;
	}
}

// トーストを表示
function showToast(message: string, type: "success" | "error" = "success"): void {
	toast.textContent = message;
	toast.className = `toast ${type}`;
	toast.hidden = false;

	setTimeout(() => {
		toast.hidden = true;
	}, 3000);
}

// HTMLエスケープ
function escapeHtml(text: string): string {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

// イベントリスナー
addEndpointBtn.addEventListener("click", showAddForm);
saveEndpointBtn.addEventListener("click", saveEndpoint);
cancelEndpointBtn.addEventListener("click", hideForm);

for (const btn of document.querySelectorAll<HTMLButtonElement>(".preset-btn")) {
	const preset = btn.dataset.preset;
	if (preset) btn.addEventListener("click", () => applyPreset(preset));
}

// イベント委譲でエンドポイントリストのイベントを処理
endpointsList.addEventListener("change", (event) => {
	const target = event.target as HTMLInputElement;
	if (target.name === "active-endpoint") {
		setActiveEndpoint(target.value);
	}
});

endpointsList.addEventListener("click", (event) => {
	const target = event.target as HTMLElement;
	const id = target.dataset.id;
	if (!id) return;

	if (target.classList.contains("edit-btn")) {
		editEndpoint(id);
	} else if (target.classList.contains("delete-btn")) {
		deleteEndpoint(id);
	}
});

// 初期化
loadSettings();
