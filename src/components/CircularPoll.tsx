import { Progress } from "antd";
import type { Poll } from "../types";
import { useTheme } from "../main";
import { useState } from "react";
import { formatTime, textColorForBackground } from "../GlobalFunctions";

type CircularPollProperties = {
	percentage: number;
	color?: string;
	offset?: number;
	size?: number;
};

type PollObjectProperties = {
	poll: Poll;
	size?: number;
    timer?: {
        active: boolean;
        current: number;
        duration: number;
        remainingSeconds: number;
    };
    onlyTimer?: boolean;
};

export default function FullCircularPoll({
	poll,
	size = 400,
    timer = { active: false, current: 0, duration: 0, remainingSeconds: 0 },
    onlyTimer = false,
}: PollObjectProperties) {
    const { isDark } = useTheme();
	const ringStrokeWidth = 23;
	const [hoveredSegment, setHoveredSegment] = useState<{
		answer: string;
		color?: string;
	} | null>(null);
	const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

	const responderBase =
		typeof poll.totalResponders === "number" &&
		Number.isFinite(poll.totalResponders) &&
		poll.totalResponders > 0
			? poll.totalResponders
			: poll.responses.reduce(
				(acc, response) =>
					acc +
					(typeof response.responses === "number" &&
					Number.isFinite(response.responses)
						? response.responses
						: 0),
				0,
			);

	const getHoveredAnswerFromEvent = (
		event: React.MouseEvent<HTMLDivElement>,
	) => {
		if (poll.blind || responderBase <= 0) {
			return null;
		}

		const rect = event.currentTarget.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const dx = event.clientX - centerX;
		const dy = event.clientY - centerY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const outerRadius = rect.width / 2;
		const ringThickness = (rect.width * ringStrokeWidth) / 100;
		const innerRadius = Math.max(0, outerRadius - ringThickness);

		if (distance > outerRadius || distance < innerRadius) {
			return null;
		}

		const angleFromTopClockwise =
			((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
		const percentageFromAngle = (angleFromTopClockwise / 360) * 100;

		let cumulativePercentage = 0;
		for (const response of poll.responses) {
			const responseCount =
				typeof response.responses === "number" &&
				Number.isFinite(response.responses)
					? response.responses
					: 0;
			const responsePercentage =
				responseCount === 0
					? 0
					: (responseCount / responderBase) * 100;
			if (responsePercentage <= 0) {
				continue;
			}

			cumulativePercentage += responsePercentage;
			if (percentageFromAngle <= cumulativePercentage) {
				return {
					answer: response.answer,
					color: response.color,
				};
			}
		}

		return null;
	};
    
	return (
		<div
			style={{
				position: "relative",
				width: onlyTimer ? `${size / 2}px` : `${size}px`,
				height: onlyTimer ? `${size / 2}px` : `${size}px`,
			}}
		>
				<div
					style={{
						position: "absolute",
						inset: 0,
						zIndex: 5,
						cursor: "default",
					}}
					onMouseMove={(event) => {
						const segment = getHoveredAnswerFromEvent(event);
						setHoveredSegment(segment);
						const rect = event.currentTarget.getBoundingClientRect();
						setHoverPosition({
							x: event.clientX - rect.left,
							y: event.clientY - rect.top,
						});
					}}
					onMouseLeave={() => {
						setHoveredSegment(null);
						setHoverPosition(null);
					}}
				/>
            {/* Timer */}
            {
                timer.duration > 0 && (
                    <Progress
                        style={{
                            position: 'absolute',
                            pointerEvents: 'none',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                        type="dashboard"
                        percent={Math.round(timer.current)}
                        
                        format={() => `${formatTime(timer.remainingSeconds)}`}
                        strokeColor={{
                            '0%': 'rgb(94, 158, 230)',
                            '100%': 'rgba(41, 96, 167, 0.9)',
                        }}
                        strokeWidth={15}
                        gapDegree={50}
                        size={size / 2}
                    />
                )
            }
            {
                !onlyTimer && (
                    <>
                        <Progress
                            style={{
                                position: "absolute" as "absolute",
                                pointerEvents: "none",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                            }}
                            type="circle"
                            percent={100}
                            strokeColor={isDark ? {
                                "0%": "rgba(255, 255, 255, 0.38)",
                                "100%": "rgba(255, 255, 255, 0.1)",
                            } : {
                                "0%": "#e6e6e6",
                                "100%": "#bfbfbf",
                            }}
                            size={size}
                            strokeWidth={ringStrokeWidth}
                            railColor="transparent"
                            showInfo={false}
                            strokeLinecap="butt"
                            styles={{
                                root: {
                                    filter: "drop-shadow(0 0 5px #0004)",
                                },
                            }}
                        />
                        {
                            poll.blind ? (
                                <CircularPoll
                                    percentage={
                                        poll.totalResponses / poll.totalResponders * 100
                                    }
                                    color={"#ff9f22"}
                                    offset={0}
                                    size={size}
                                />
                            ) : (
                                poll.responses.map((answer, index) => (
                                <CircularPoll
                                    key={index}
                                    percentage={
                                        answer.responses === 0
                                            ? 0
                                            : (answer.responses / poll.totalResponders) * 100
                                    }
                                    color={answer.color}
                                    offset={poll.responses
                                        .slice(0, index)
                                        .reduce(
                                            (acc, curr) =>
                                                acc +
                                                (curr.responses === 0
                                                    ? 0
                                                    : (curr.responses / poll.totalResponders) * 100),
                                            0,
                                        )}
                                    size={size}
                                />
                            ))
                            )
                        }
                        {!poll.blind && hoveredSegment && hoverPosition ? (
                            <div
                                style={{
                                    position: "absolute",
                                    left: hoverPosition.x,
                                    top: hoverPosition.y - 20,
                                    transform: "translate(-50%, -50%)",
                                    zIndex: 10,
                                    pointerEvents: "none",
                                    backgroundColor: hoveredSegment.color || "rgba(0, 0, 0, 0.78)",
                                    border: `1px solid #000`,
                                    color: textColorForBackground(hoveredSegment.color || "rgba(0, 0, 0, 0.78)"),
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {hoveredSegment.answer}
                            </div>
                        ) : null}
                    </>
                )
            }
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
                    left: "50%",
                    top: "50%",
					transform: `translate(-50%, -50%) rotate(${offsetDeg}deg)`,
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
