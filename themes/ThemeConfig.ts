import { theme } from "antd";

export const themeColors = {
	dark: {
		body: {
			background:
				"linear-gradient(rgba(54, 94, 146, 1) 0%, rgba(13, 40, 77, 1) 100%)",
			color: "#ffffffd9",
		},
		header: {
			background: "linear-gradient(90deg, #1CB5E0 0%, #000851 100%)",
		},
		text: {
			primary: "#ffffff",
			secondary: "#ffffffaa",
		},
		information: {
			background: "#fff3",
		},
	},
	light: {
		body: {
			background:
				"linear-gradient(rgb(194, 242, 255) 0%, rgb(170, 211, 232) 100%)",
			color: "#000000d9",
		},
		header: {
			background:
				"linear-gradient(90deg, rgb(164, 225, 242) 0%, rgb(89, 151, 247) 100%)",
		},
		text: {
			primary: "#0000009f",
			secondary: "#00000065",
		},
		information: {
			background: "#0002",
		},
	},
};

export const darkMode = {
	algorithm: theme.darkAlgorithm,
	token: {
		fontFamily: "Outfit, sans-serif",
		fontSize: 20,
		fontSizeLG: 24,
	},
	components: {
		Card: {
			colorBorderSecondary: "#070a2786",
			colorBgContainer: "#020b24ab",
		},
		Segmented: {
			trackBg: "#000a",
			itemSelectedBg: "#1769dc",
			controlHeight: 48,
			controlPaddingHorizontal: 16,
		},
		Input: {
			controlHeight: 42,
			colorBgContainer: "#01091fab",
			colorBorder: "#02031186",
		},
		Select: {
			controlHeight: 42,
			colorBgContainer: "#01091fab",
			colorBorder: "#02031186",
		},
		SelectProps: {
			colorBorder: "#ff0000",
		},
	},
};

export const lightMode = {
	algorithm: theme.defaultAlgorithm,
	token: {
		fontFamily: "Outfit, sans-serif",
		fontSize: 20,
		fontSizeLG: 24,
	},
	components: {
		Menu: {
			colorBgContainer: "rgba(255, 255, 255, 0.47)",
			itemSelectedBg: "#1677ff22",
		},
		Card: {
			colorBorderSecondary: "#00000020",
			colorBgContainer: "#fffa",
		},
		Segmented: {
			trackBg: "#fffa",
			itemSelectedBg: "#1c67cf49",
			controlHeight: 48,
			controlPaddingHorizontal: 16,
		},
		Input: {
			controlHeight: 42,
			colorBgContainer: "#fffa",
			colorBorder: "#00000020",
		},
	},
};

export const version = "3";

export const showMobileIfVertical = true;
