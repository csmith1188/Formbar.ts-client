import { theme } from "antd";

export const themeColors = {
	dark: {
		body: {
			background:
				"linear-gradient(135deg, #0d1b2a 0%, #0a2540 40%, #0d1b2a 100%)",
			color: "#e8edf5",
		},
		header: {
			background: "rgba(8, 20, 40, 0.75)",
			border: "rgba(255, 255, 255, 0.08)",
		},
		text: {
			primary: "#e8edf5",
			secondary: "#a0aec0",
		},
		information: {
			background: "rgba(255,255,255,0.05)",
		},
		card: {
			background: "rgba(255, 255, 255, 0.04)",
			border: "rgba(255, 255, 255, 0.1)",
		},
		accent: {
			primary: "#3b82f6",
			secondary: "#6366f1",
			glow: "rgba(59, 130, 246, 0.35)",
		},
	},
	light: {
		body: {
			background:
				"linear-gradient(135deg, #e8f0fe 0%, #f0f7ff 50%, #dbeafe 100%)",
			color: "#1a202c",
		},
		header: {
			background: "rgba(255, 255, 255, 0.65)",
			border: "rgba(0, 0, 0, 0.08)",
		},
		text: {
			primary: "#1a202c",
			secondary: "#4a5568",
		},
		information: {
			background: "rgba(0,0,0,0.04)",
		},
		card: {
			background: "rgba(255, 255, 255, 0.7)",
			border: "rgba(0, 0, 0, 0.08)",
		},
		accent: {
			primary: "#2563eb",
			secondary: "#4f46e5",
			glow: "rgba(37, 99, 235, 0.2)",
		},
	},
};

export const darkMode = {
	algorithm: theme.darkAlgorithm,
	token: {
		fontFamily: "Outfit, sans-serif",
		fontSize: 16,
		fontSizeLG: 20,
		colorPrimary: "#3b82f6",
		colorBgBase: "#0d1b2a",
		borderRadius: 12,
		borderRadiusLG: 16,
		colorBgContainer: "rgba(255,255,255,0.04)",
		colorBorder: "rgba(255,255,255,0.1)",
		boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
		colorTextBase: "#e8edf5",
	},
	components: {
		Card: {
			colorBorderSecondary: "rgba(255,255,255,0.1)",
			colorBgContainer: "rgba(255,255,255,0.05)",
			borderRadiusLG: 16,
			paddingLG: 24,
		},
		Button: {
			borderRadius: 10,
			controlHeight: 42,
			controlHeightLG: 48,
			paddingInline: 20,
		},
		Segmented: {
			trackBg: "rgba(0,0,0,0.35)",
			itemSelectedBg: "#2563eb",
			controlHeight: 44,
			controlPaddingHorizontal: 20,
			borderRadius: 10,
		},
		Input: {
			controlHeight: 44,
			colorBgContainer: "rgba(255,255,255,0.06)",
			colorBorder: "rgba(255,255,255,0.12)",
			borderRadius: 10,
			hoverBorderColor: "#3b82f6",
			activeBorderColor: "#3b82f6",
		},
		Select: {
			controlHeight: 44,
			colorBgContainer: "rgba(255,255,255,0.06)",
			colorBorder: "rgba(255,255,255,0.12)",
			borderRadius: 10,
		},
		Modal: {
			colorBgElevated: "#0d2040",
			borderRadiusLG: 16,
		},
		Tooltip: {
			borderRadius: 8,
		},
		FloatButton: {
			colorBgElevated: "#1e3a5f",
			borderRadiusLG: 999,
		},
	},
};

export const lightMode = {
	algorithm: theme.defaultAlgorithm,
	token: {
		fontFamily: "Outfit, sans-serif",
		fontSize: 16,
		fontSizeLG: 20,
		colorPrimary: "#2563eb",
		borderRadius: 12,
		borderRadiusLG: 16,
		colorBgContainer: "rgba(255,255,255,0.75)",
		colorBorder: "rgba(0,0,0,0.1)",
		boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
		colorTextBase: "#1a202c",
	},
	components: {
		Menu: {
			colorBgContainer: "rgba(255, 255, 255, 0.7)",
			itemSelectedBg: "#2563eb22",
			borderRadius: 10,
		},
		Card: {
			colorBorderSecondary: "rgba(0,0,0,0.08)",
			colorBgContainer: "rgba(255,255,255,0.72)",
			borderRadiusLG: 16,
			paddingLG: 24,
		},
		Button: {
			borderRadius: 10,
			controlHeight: 42,
			controlHeightLG: 48,
			paddingInline: 20,
		},
		Segmented: {
			trackBg: "rgba(255,255,255,0.7)",
			itemSelectedBg: "#2563eb30",
			controlHeight: 44,
			controlPaddingHorizontal: 20,
			borderRadius: 10,
		},
		Input: {
			controlHeight: 44,
			colorBgContainer: "rgba(255,255,255,0.85)",
			colorBorder: "rgba(0,0,0,0.12)",
			borderRadius: 10,
			hoverBorderColor: "#2563eb",
			activeBorderColor: "#2563eb",
		},
		Select: {
			controlHeight: 44,
			colorBgContainer: "rgba(255,255,255,0.85)",
			colorBorder: "rgba(0,0,0,0.12)",
			borderRadius: 10,
		},
		Modal: {
			colorBgElevated: "rgba(255,255,255,0.97)",
			borderRadiusLG: 16,
		},
		Tooltip: {
			borderRadius: 8,
		},
		FloatButton: {
			borderRadiusLG: 999,
		},
	},
};

export const version = "3";

export const showMobileIfVertical = true;
