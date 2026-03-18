import { Button } from "antd";
import { useState, useEffect } from "react";

import {
	darkenButtonColor,
	textColorForBackground,
} from "../GlobalFunctions";

type answer = {
	answer: string;
	color: string;
};

export default function PollButton({
	answerData,
	Respond,
	allowMultipleResponses = false,
	selected,
	onSelectToggle,
}: {
	answerData: answer;
	Respond: (response: string) => void;
	allowMultipleResponses?: boolean;
	selected?: boolean;
	onSelectToggle?: (answer: string, nextSelected: boolean) => void;
}) {
	const [answerStyleState, setAnswerStyleState] = useState<any>({});
	const [localSelected, setLocalSelected] = useState(false);
	const isSelected = selected ?? localSelected;

	useEffect(() => {
		setAnswerStyleState(createButtonStyles(answerData.color));
	}, [answerData.color]);

	return (
		<Button
			variant="solid"
			style={answerData.answer !== "remove" && answerData.answer !== "Submit" && allowMultipleResponses ? {
                opacity: isSelected ? 1 : 0.5,
                transform: isSelected ? "scale(1)" : "scale(0.95)",
                transition: "all 0.3s ease-in-out",
            } : {}}
			onClick={() => {
				if (
					allowMultipleResponses &&
					answerData.answer !== "remove" &&
					answerData.answer !== "Submit"
				) {
					const nextSelected = !isSelected;
					if (onSelectToggle) {
						onSelectToggle(answerData.answer, nextSelected);
					} else {
						setLocalSelected(nextSelected);
					}
					return;
				}
				Respond(answerData.answer);
			}}
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
				padding: "5px 20px",
				fontSize: "28px",
				height: "auto",
			},
		},
		hover: {
			root: {
				backgroundColor: darkenButtonColor(buttonColor, 90),
				color: textColorForBackground(buttonColor),
				border: "2px solid " + darkenButtonColor(buttonColor, 110),
				padding: "5px 20px",
				fontSize: "28px",
				height: "auto",
			},
		},
		active: {
			root: {
				backgroundColor: darkenButtonColor(buttonColor, 130),
				color: textColorForBackground(buttonColor),
				border: "2px solid " + darkenButtonColor(buttonColor, 150),
				padding: "5px 20px",
				fontSize: "28px",
				height: "auto",
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
