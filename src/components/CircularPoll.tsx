import { Progress } from "antd";
import type { PollAnswer } from "../types";

type CircularPollProperties = {
	percentage: number;
	color?: string;
	offset?: number;
	size?: number;
};

type PollObjectProperties = {
	pollAnswers: Array<PollAnswer>;
	size?: number;
};

export default function FullCircularPoll({
	pollAnswers,
	size = 400,
}: PollObjectProperties) {
	const totalResponses = pollAnswers.reduce(
		(acc, curr) => acc + curr.responses,
		0,
	);

	return (
		<div
			style={{
				position: "relative",
				width: `${size}px`,
				height: `${size}px`,
			}}
		>
			<Progress
				style={{
					position: "absolute" as "absolute",
					pointerEvents: "none",
				}}
				type="circle"
				percent={100}
				strokeColor={{
					"0%": "rgba(255, 255, 255, 0.38)",
					"100%": "rgba(255, 255, 255, 0.1)",
				}}
				size={size}
				strokeWidth={23}
				railColor="transparent"
				showInfo={false}
				strokeLinecap="butt"
				styles={{
					root: {
						filter: "drop-shadow(0 0 5px #0004)",
					},
				}}
			/>
			{pollAnswers.map((answer, index) => (
				<CircularPoll
					key={index}
					percentage={
						answer.responses === 0
							? 0
							: (answer.responses / totalResponses) * 100
					}
					color={answer.color}
					offset={pollAnswers
						.slice(0, index)
						.reduce(
							(acc, curr) =>
								acc +
								(curr.responses === 0
									? 0
									: (curr.responses / totalResponses) * 100),
							0,
						)}
					size={size}
				/>
			))}
		</div>
	);
}

export function CircularPoll({
	percentage,
	color,
	offset = 0,
	size = 400,
}: CircularPollProperties) {
	// Default border size is -4px when the size is 400px
	// So for 200px, it would be -2px, etc.
	let borderSize = -4 * (size / 400);

	const offsetDeg = (offset / 100) * 360;

	let borderColor = "rgba(0, 0, 0, 0.5)";

	const colorDarkenFactor = 0.5;

	if (color?.length === 7) {
		let r = parseInt(color.slice(1, 3), 16);
		let g = parseInt(color.slice(3, 5), 16);
		let b = parseInt(color.slice(5, 7), 16);
		borderColor = `rgba(${r * colorDarkenFactor}, ${g * colorDarkenFactor}, ${b * colorDarkenFactor})`;
	} else if (color?.length === 4) {
		let r = parseInt(color.slice(1, 2).repeat(2), 16);
		let g = parseInt(color.slice(2, 3).repeat(2), 16);
		let b = parseInt(color.slice(3, 4).repeat(2), 16);
		borderColor = `rgba(${r * colorDarkenFactor}, ${g * colorDarkenFactor}, ${b * colorDarkenFactor})`;
	}

	return (
		<>
			<Progress
				style={{
					position: "absolute" as "absolute",
					transform: `rotate(${offsetDeg}deg)`,
					transition:
						"transform var(--ant-motion-duration-slow) ease",
					pointerEvents: "none",
				}}
				type="circle"
				percent={percentage}
				strokeColor={color || "#1890ff"}
				size={size}
				strokeWidth={23}
				railColor="transparent"
				showInfo={false}
				strokeLinecap="butt"
				className="border"
				styles={{
					root: {
						"--borderWidth": `${borderSize}px`,
						"--borderColor": borderColor,
					} as React.CSSProperties,
				}}
			/>
		</>
	);
}
