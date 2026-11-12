import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	if (!env.VITE_ENCRYPTION_KEY) {
		throw new Error(
			"VITE_ENCRYPTION_KEY is required. Set it before starting or building the client.",
		);
	}

	return {
		plugins: [react()],
		server: {
			cors: {
				origin: "*",
				methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
				allowedHeaders: ["Content-Type", "Authorization"],
			},
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
				"@api": path.resolve(__dirname, "./src/api"),
				"@utils": path.resolve(__dirname, "./src/utils"),
				"@pages": path.resolve(__dirname, "./src/pages"),
				"@assets": path.resolve(__dirname, "./src/assets"),
				"@components": path.resolve(__dirname, "./src/components"),
			},
		},
	};
});
