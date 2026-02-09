module.exports = {
	apps: [
		{
			name: "Formbar-V3",
			script: "serve",
			env: {
				PM2_SERVE_PATH: "./dist", // Path to your built Vite output
				PM2_SERVE_PORT: 5173, // Port to serve on
				PM2_SERVE_SPA: "true", // Enable SPA mode for client-side routing
			},
		},
	],
};
