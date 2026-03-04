import { Button } from "antd";
import { useState, useEffect } from "react";

import {
	darkenButtonColor,
	textColorForBackground,
} from "../CustomStyleFunctions";

type answer = {
	answer: string;
	color: string;
};

export default function PollButton({
	answerData,
	Respond,
}: {
	answerData: answer;
	Respond: (response: string) => void;
}) {
	const [answerStyleState, setAnswerStyleState] = useState<any>({});

	useEffect(() => {
		setAnswerStyleState(createButtonStyles(answerData.color));
	}, [answerData.color]);

	return (
		<Button
			variant="solid"
			style={{ marginTop: "5px", width: "auto" }}
			onClick={() => Respond(answerData.answer)}
			styles={answerStyleState[answerStyleState.current]}
			onMouseEnter={() => {
				setAnswerStyleState((prevState: any) => {
					let newStyleState = { ...prevState };
					newStyleState.current = "hover";
					return newStyleState;
				});
			}}
			onMouseLeave={() => {
				setAnswerStyleState((prevState: any) => {
					let newStyleState = { ...prevState };
					newStyleState.current = "default";
					return newStyleState;
				});
			}}
			onMouseDown={() => {
				setAnswerStyleState((prevState: any) => {
					let newStyleState = { ...prevState };
					newStyleState.current = "active";
					return newStyleState;
				});
			}}
			onMouseUp={() => {
				setAnswerStyleState((prevState: any) => {
					let newStyleState = { ...prevState };
					newStyleState.current = "hover";
					return newStyleState;
				});
			}}
		>
			{answerData.answer == "remove" ? "Remove Vote" : answerData.answer}
		</Button>
	);
}

function createButtonStyles(buttonColor: string) {
	return {
		default: {
			root: {
				backgroundColor: darkenButtonColor(buttonColor, 50),
				color: textColorForBackground(buttonColor),
				border: "2px solid " + darkenButtonColor(buttonColor, 70),
				padding: "8px 28px",
				fontSize: "26px",
				height: "auto",
				borderRadius: "14px",
				fontWeight: 600,
				letterSpacing: "0.01em",
				boxShadow: `0 4px 14px ${darkenButtonColor(buttonColor, 50)}55`,
				transition: "all 0.15s ease",
			},
		},
		hover: {
			root: {
				backgroundColor: darkenButtonColor(buttonColor, 90),
				color: textColorForBackground(buttonColor),
				border: "2px solid " + darkenButtonColor(buttonColor, 110),
				padding: "8px 28px",
				fontSize: "26px",
				height: "auto",
				borderRadius: "14px",
				fontWeight: 600,
				letterSpacing: "0.01em",
				boxShadow: `0 6px 20px ${darkenButtonColor(buttonColor, 90)}66`,
				transform: "translateY(-2px)",
				transition: "all 0.15s ease",
			},
		},
		active: {
			root: {
				backgroundColor: darkenButtonColor(buttonColor, 130),
				color: textColorForBackground(buttonColor),
				border: "2px solid " + darkenButtonColor(buttonColor, 150),
				padding: "8px 28px",
				fontSize: "26px",
				height: "auto",
				borderRadius: "14px",
				fontWeight: 600,
				letterSpacing: "0.01em",
				boxShadow: `0 2px 8px ${darkenButtonColor(buttonColor, 130)}44`,
				transform: "translateY(0px)",
				transition: "all 0.1s ease",
			},
		},
		current: "default",
	};
}

/*
 *   AnswerState: ["up","down","wiggle","remove"]
 *   AnswerStyleState: [{"default":{...},"hover":{...},"active":{...}}]
 *
 *   Use the state of the button to determine which style to apply
 *
 *   If button is in hover state, apply hover styles from AnswerStyleState
 *   If button is in active state, apply active styles from AnswerStyleState
 *   If button is in default state, apply default styles from AnswerStyleState
 */
