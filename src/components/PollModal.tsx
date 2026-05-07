import { Button, Flex, Input, InputNumber, Modal, Switch, Typography, ColorPicker, Divider } from "antd";
const { Text } = Typography;
import { textColorForBackground } from "@utils/GlobalFunctions";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";

export interface Answer {
	answer: string;
	weight: number;
	color: string;
	responses?: number; // For display in read-only mode
}

export interface PollModalProps {
	open: boolean;
	onCancel: () => void;
	prompt: string;
	onPromptChange?: (value: string) => void;
	answers: Answer[];
	onAnswersChange?: (answers: Answer[]) => void;
	allowVoteChanges: boolean;
	onAllowVoteChangesChange?: (checked: boolean) => void;
	allowTextResponses: boolean;
	onAllowTextResponsesChange?: (checked: boolean) => void;
	blind: boolean;
	onBlindChange?: (checked: boolean) => void;
	blindUntilEnded: boolean;
	onBlindUntilEndedChange?: (checked: boolean) => void;
	autoEndTimer?: number | null;
	onAutoEndTimerChange?: (value: number | null) => void;
	autoEndThreshold?: number | null;
	onAutoEndThresholdChange?: (value: number | null) => void;
	allowMultipleResponses: boolean;
	onAllowMultipleResponsesChange?: (checked: boolean) => void;
	footerButton?: {
		label: string;
		onClick: () => void;
	};
	secondaryFooterButton?: {
		label: string;
		onClick: () => void;
	};
	readOnly?: boolean;
}

export default function PollModal({
	open,
	onCancel,
	prompt,
	onPromptChange,
	answers,
	onAnswersChange,
	allowVoteChanges,
	onAllowVoteChangesChange,
	allowTextResponses,
	onAllowTextResponsesChange,
	blind,
	onBlindChange,
	blindUntilEnded,
	onBlindUntilEndedChange,
	autoEndTimer,
	onAutoEndTimerChange,
	autoEndThreshold,
	onAutoEndThresholdChange,
	allowMultipleResponses,
	onAllowMultipleResponsesChange,
	footerButton,
	secondaryFooterButton,
	readOnly = false,
}: PollModalProps) {
	const handleAnswerChange = (index: number, field: keyof Answer, value: any) => {
		if (readOnly || !onAnswersChange) return;
		const newAnswers = answers.map((a, i) =>
			i === index ? { ...a, [field]: value } : a
		);
		onAnswersChange(newAnswers);
	};

	const handleAddAnswer = () => {
		if (readOnly || !onAnswersChange) return;
		const newAnswer: Answer = {
			answer: "",
			weight: 1,
			color: "#000000",
		};
		onAnswersChange([...answers, newAnswer]);
	};

	const handleRemoveAnswer = (index: number) => {
		if (readOnly || !onAnswersChange) return;
		const newAnswers = answers.filter((_, i) => i !== index);
		onAnswersChange(newAnswers);
	};

	return (
		<Modal
			centered
			title={
				<Input
					value={prompt}
					placeholder="Prompt"
					disabled={readOnly}
					onChange={(e) => onPromptChange?.(e.target.value)}
					style={{ width: "calc(100% - 35px)" }}
				/>
			}
			open={open}
			onCancel={onCancel}
			destroyOnHidden
			footer={
				footerButton ? (
					<div style={{ display: "flex", justifyContent: "center", gap: 8, width: "100%" }}>
						{secondaryFooterButton && (
							<Button onClick={secondaryFooterButton.onClick} color="gold" type="default" variant="solid">
								{secondaryFooterButton.label}
							</Button>
						)}
						<Button type="primary" onClick={footerButton.onClick} disabled={answers.length === 0 || answers.some(a => a.answer.trim() === "") || prompt.trim() === ""}>
							{footerButton.label}
						</Button>
					</div>
				) : null
			}
		>
			{answers.map((answer, index) => (
				<Flex key={index} gap={8} align="center" style={{ marginTop: "5px" }}>
					<Button
						style={{
							backgroundColor: answer.color,
							color: textColorForBackground(answer.color),
							flex: 1,
						}}
					>
						{readOnly ? (
							<Text strong style={{ color: textColorForBackground(answer.color)}}>
								{answer.answer}
								{answer.responses !== undefined &&
									` - ${answer.responses} vote${answer.responses !== 1 ? "s" : ""}`}
							</Text>
						) : (
							<Input
								key={`${index}-${answer.color}`}
								value={answer.answer}
								variant="borderless"
								placeholder="Answer"
								onChange={(e) => handleAnswerChange(index, "answer", e.target.value)}
								style={{
									color: textColorForBackground(answer.color),
								}}
							/>
						)}
					</Button>
					{!readOnly && (
						<>
							<ColorPicker disabledAlpha value={answer.color} styles={{
								root: {
									height: '100%',  
									minWidth: 'unset',
									width: 'unset',
									aspectRatio: 1,
								},
								
							}} 
							onChange={(color) =>
								handleAnswerChange(index, "color", color.toHexString())
							}
							/>

							<Button
								type="text"
								danger
								icon={<IonIcon icon={IonIcons.trash} />}
								onClick={() => handleRemoveAnswer(index)}
							/>
						</>
					)}
				</Flex>
			))}
			{!readOnly && (
				<Button
					type="dashed"
					block
					icon={<IonIcon icon={IonIcons.add} />}
					onClick={handleAddAnswer}
					style={{ marginTop: "10px" }}
				>
					Add Answer
				</Button>
			)}

			<Flex vertical gap={10} style={{ marginTop: "20px" }}>
				<Flex align="center" justify="space-between">
					Allow Vote Changes
					<Switch
						disabled={readOnly}
						checked={allowVoteChanges}
						onChange={(checked) => onAllowVoteChangesChange?.(checked)}
					/>
				</Flex>

				<Flex align="center" justify="space-between">
					Allow Text Responses
					<Switch
						disabled={readOnly}
						checked={allowTextResponses}
						onChange={(checked) => onAllowTextResponsesChange?.(checked)}
					/>
				</Flex>

				<Flex align="center" justify="space-between">
					Multiple Answer Poll
					<Switch
						disabled={readOnly}
						checked={allowMultipleResponses}
						onChange={(checked) => onAllowMultipleResponsesChange?.(checked)}
					/>
				</Flex>

				<Divider titlePlacement="center" style={{fontSize: 16}}>Blind Options</Divider>

				<Flex align="center" justify="space-between">
					Blind Poll
					<Switch
						disabled={readOnly}
						checked={blind}
						onChange={(checked) => onBlindChange?.(checked)}
					/>
				</Flex>

				<Flex align="center" justify="space-between">
					Blind Until Ended
					<Switch
						disabled={readOnly}
						checked={blindUntilEnded}
						onChange={(checked) => onBlindUntilEndedChange?.(checked)}
					/>
				</Flex>

				<Divider titlePlacement="center" style={{fontSize: 16}}>Timing</Divider>

				<Flex align="center" justify="space-between">
					Auto End Timer
					<InputNumber
						disabled={readOnly}
						min={0}
						max={100000}
						value={autoEndTimer ?? 0}
						onChange={(value) => onAutoEndTimerChange?.(typeof value === "number" ? value : null)}
						suffix="s"
					/>
				</Flex>

				<Flex align="center" justify="space-between">
					Auto End Threshold
					<InputNumber
						disabled={readOnly}
						min={0}
						max={100}
						value={autoEndThreshold ?? 0}
						onChange={(value) => onAutoEndThresholdChange?.(typeof value === "number" ? value : null)}
						suffix="%"
					/>
				</Flex>
			</Flex>
		</Modal>
	);
}
