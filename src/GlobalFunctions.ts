export function toEpochMs(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value < 1_000_000_000_000 ? value * 1000 : value;
	}

	if (typeof value === "string") {
		const asNumber = Number(value);
		if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
			return asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
		}

		const parsedDate = Date.parse(value);
		if (!Number.isNaN(parsedDate)) {
			return parsedDate;
		}
	}

	return null;
}

export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if(mins > 0) {
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}`;
}

export function textColorForBackground(bgColor: string) {
	if (bgColor?.length === 7) {
		let r = parseInt(bgColor.slice(1, 3), 16);
		let g = parseInt(bgColor.slice(3, 5), 16);
		let b = parseInt(bgColor.slice(5, 7), 16);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness > 125 ? "#000000" : "#FFFFFF";
	} else if (bgColor?.length === 4) {
		let r = parseInt(bgColor.slice(1, 2).repeat(2), 16);
		let g = parseInt(bgColor.slice(2, 3).repeat(2), 16);
		let b = parseInt(bgColor.slice(3, 4).repeat(2), 16);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness > 125 ? "#000000" : "#FFFFFF";
	}
	return "#000000";
}

export function darkenButtonColor(color: string, amount: number) {
	if (color?.length === 7) {
		let r = Math.max(
			0,
			Math.min(255, parseInt(color.slice(1, 3), 16) - amount),
		);
		let g = Math.max(
			0,
			Math.min(255, parseInt(color.slice(3, 5), 16) - amount),
		);
		let b = Math.max(
			0,
			Math.min(255, parseInt(color.slice(5, 7), 16) - amount),
		);
		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
	} else if (color?.length === 4) {
		let r = Math.max(
			0,
			Math.min(255, parseInt(color.slice(1, 2).repeat(2), 16) - amount),
		);
		let g = Math.max(
			0,
			Math.min(255, parseInt(color.slice(2, 3).repeat(2), 16) - amount),
		);
		let b = Math.max(
			0,
			Math.min(255, parseInt(color.slice(3, 4).repeat(2), 16) - amount),
		);
		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
	}
	return color;
}

export function calculateFontSize(
	containerWidth: number,
	text: string,
	fontFamily: string = "Outfit",
	maxFontSize: number = 32,
	minFontSize: number = 8,
): number {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	if (!context) return minFontSize; // Fallback font size
	let fontSize = maxFontSize;

	while (fontSize > minFontSize) {
		context.font = `${fontSize}px ${fontFamily}`;
		const textMetrics = context.measureText(text);
		const textHeight =
			textMetrics.actualBoundingBoxAscent +
			textMetrics.actualBoundingBoxDescent;
		if (textHeight <= containerWidth * 0.25) {
			break;
		}
		fontSize -= 1;
	}
	return fontSize;
}
