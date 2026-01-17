export {};

const isWatch = process.argv.includes("--watch");

interface BuildEntry {
	entrypoint: string;
	outdir: string;
}

const BUILD_ENTRIES: BuildEntry[] = [
	{ entrypoint: "src/background/service-worker.ts", outdir: "dist" },
	{ entrypoint: "src/content/content-script.ts", outdir: "dist" },
	{ entrypoint: "src/popup/popup.ts", outdir: "dist/popup" },
	{ entrypoint: "src/options/options.ts", outdir: "dist/options" },
];

async function build(): Promise<void> {
	for (const { entrypoint, outdir } of BUILD_ENTRIES) {
		const result = await Bun.build({
			entrypoints: [entrypoint],
			outdir,
			target: "browser",
			format: "esm",
			minify: !isWatch,
			sourcemap: isWatch ? "inline" : "none",
		});

		if (!result.success) {
			console.error(`Build failed for ${entrypoint}:`, result.logs);
			process.exit(1);
		}
	}

	// Copy static files
	await Bun.write("dist/manifest.json", Bun.file("manifest.json"));
	await Bun.write("dist/popup/popup.html", Bun.file("src/popup/popup.html"));
	await Bun.write("dist/popup/popup.css", Bun.file("src/popup/popup.css"));
	await Bun.write("dist/options/options.html", Bun.file("src/options/options.html"));
	await Bun.write("dist/options/options.css", Bun.file("src/options/options.css"));

	// Copy icons
	const iconSizes = ["16", "32", "48", "128"];
	for (const size of iconSizes) {
		await Bun.write(`dist/icons/icon${size}.png`, Bun.file(`icons/icon${size}.png`));
	}

	console.log("Build complete!");
}

await build();

if (isWatch) {
	const { watch } = await import("node:fs");
	console.log("Watching for changes...");
	watch("src", { recursive: true }, async () => {
		console.log("Rebuilding...");
		await build();
	});
}
