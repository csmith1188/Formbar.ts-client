import { Button, Card, Collapse, Flex, Input, Switch, Tooltip, Typography, notification, InputNumber, Modal } from "antd";
const { Title, Text } = Typography;
import { useClassData, useMobileDetect, useUserData } from "@/main";
import { useEffect, useState } from "react";
import { currentUserHasScope } from "@utils/scopeUtils";
import { IonIcon } from "@ionic/react";
import PollEditorResponse from "@components/PollEditorResponse";
import * as IonIcons from "ionicons/icons";
import { millisecondsToSeconds, secondsToMilliseconds } from "@utils/GlobalFunctions";

type PollAnswer = {
    color: string;
    answer: string;
    isCorrect: boolean;
    weight: number;
};

type PollProperties = {
    prompt: string;
    answers: PollAnswer[];
    weight: number;
    blind: boolean;
    blindUntilEnded: boolean;
    allowVoteChanges: boolean;
    excludedRespondents: any[];
    indeterminate: any[];
    allowTextResponses: boolean;
    allowMultipleResponses: boolean;
    autoEndTimer: number | null;
    autoEndThreshold: number | null;
};

import { socket } from "@utils/socket";
import { createPoll, savePollTemplateToClass, savePollTemplateToUser } from "@api/classApi";

type EditorSeedPoll = {
    prompt: string;
    answers: PollAnswer[];
    allowVoteChanges: boolean;
    allowTextResponses: boolean;
    blind: boolean;
    blindUntilEnded: boolean;
    autoEndTimer: number | null;
    autoEndThreshold: number | null;
    allowMultipleResponses: boolean;
};

type PollSaveMode = "my" | "class";

function randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function HSLToHex(hue: number, saturation: number, lightness: number) {
    // Normalize lightness to range 0-1
    lightness /= 100;

    // Calculate chroma
    const chroma = (saturation * Math.min(lightness, 1 - lightness)) / 100;

    // Function to get color component
    function getColorComponent(colorIndex: number) {
        const colorPosition = (colorIndex + hue / 30) % 12;
        const colorValue = lightness - chroma * Math.max(Math.min(colorPosition - 3, 9 - colorPosition, 1), -1);

        // Return color component in hexadecimal format
        return Math.round(255 * colorValue)
            .toString(16)
            .padStart(2, "0");
    }

    // Return the hex color
    return `#${getColorComponent(0)}${getColorComponent(8)}${getColorComponent(4)}`;
}

function generateColors(amount: number) {
    // Initialize colors array
    let colors = [];

    // Initialize hue
    let hue = 0;

    // Generate colors
    for (let i = 0; i < amount; i++) {
        // Add color to the colors array
        colors.push(HSLToHex(hue, 100, 50));

        // Increment hue
        hue += 360 / amount;
    }

    // Return the colors array
    return colors;
}

export default function PollsEditorMenu({ initialPoll }: { initialPoll?: EditorSeedPoll | null }) {
    const isMobile = useMobileDetect();
    const { classData } = useClassData();
    const { userData } = useUserData();

	const [api, contextHolder] = notification.useNotification();

    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [pollSaveName, setPollSaveName] = useState("");
    const [saveMode, setSaveMode] = useState<PollSaveMode | null>(null);
    const [isSavingPoll, setIsSavingPoll] = useState(false);

    const canCreatePolls = currentUserHasScope(userData, "class.poll.create");
    const showSaveButtons = canCreatePolls;

	const showErrorNotification = (message: string) => {
		api["error"]({
			title: "Error",
			description: message,
			placement: "bottom",
		});
	};

    function openSaveModal(mode: PollSaveMode) {
        setSaveMode(mode);
        setPollSaveName(pollProperties.prompt);
        setSaveModalOpen(true);
    }

    async function confirmSavePoll() {
        const trimmedName = pollSaveName.trim();
        if (!trimmedName) {
            showErrorNotification("Please enter a poll name.");
            return;
        }

        if (!classData?.id) {
            showErrorNotification("No active class to save this poll.");
            return;
        }

        setIsSavingPoll(true);

        try {
            const payload = {
                name: trimmedName,
                prompt: pollProperties.prompt,
                answers: pollProperties.answers,
                allowTextResponses: pollProperties.allowTextResponses,
                blind: pollProperties.blind,
                allowVoteChanges: pollProperties.allowVoteChanges,
                allowMultipleResponses: pollProperties.allowMultipleResponses,
                weight: pollProperties.weight,
                public: false,
            };

            const saveResponse =
                saveMode === "class"
                    ? await savePollTemplateToClass(classData.id, payload)
                    : await savePollTemplateToUser(classData.id, payload);

            api.success({
                title: "Success",
                description: saveResponse?.data?.message ?? "Poll saved successfully!",
                placement: "bottom",
            });
            setSaveModalOpen(false);
        } catch (err) {
            showErrorNotification(err instanceof Error ? err.message : "Failed to save poll.");
        } finally {
            setIsSavingPoll(false);
        }
    }

    const [useAutoEndTimer, setUseAutoEndTimer] = useState(false);
    const [useAutoEndThreshold, setUseAutoEndThreshold] = useState(false);

    const [pollProperties, setPollProperties] = useState<PollProperties>({
        prompt: "Custom Poll",
        answers: [
            { color: randomColor(), answer: "Answer 1", isCorrect: false, weight: 1 },
            { color: randomColor(), answer: "Answer 2", isCorrect: false, weight: 1 },
            { color: randomColor(), answer: "Answer 3", isCorrect: false, weight: 1 },
        ],
        weight: 1,
        blind: false,
        blindUntilEnded: true,
        allowVoteChanges: true,
        excludedRespondents: [],
        indeterminate: [],
        allowTextResponses: false,
        allowMultipleResponses: false,
        autoEndTimer: 60,
        autoEndThreshold: 80,
    });

    useEffect(() => {
        if (!initialPoll) return;

        setPollProperties((current) => ({
            ...current,
            prompt: initialPoll.prompt,
            answers: initialPoll.answers.map((answer) => ({
                color: answer.color,
                answer: answer.answer,
                isCorrect: answer.isCorrect,
                weight: answer.weight,
            })),
            allowVoteChanges: initialPoll.allowVoteChanges,
            allowTextResponses: initialPoll.allowTextResponses,
            blind: initialPoll.blind,
            blindUntilEnded: initialPoll.blindUntilEnded,
            autoEndTimer: millisecondsToSeconds(initialPoll.autoEndTimer),
            autoEndThreshold: initialPoll.autoEndThreshold,
            allowMultipleResponses: initialPoll.allowMultipleResponses,
        }));
        setUseAutoEndTimer(initialPoll.autoEndTimer != null);
        setUseAutoEndThreshold(initialPoll.autoEndThreshold != null);
    }, [initialPoll]);

    function startCustomPoll() {
		if (!classData?.isActive) {
			showErrorNotification(
                "Class is not active.",
            );
			return;
		}

        //? Use fetch WHEN IT ACTUALLY WORKS.
        createPoll(classData.id, {
            ...pollProperties,
            blindUntilEnded: pollProperties.blind ? pollProperties.blindUntilEnded : false,
            autoEndTimer: useAutoEndTimer ? secondsToMilliseconds(pollProperties.autoEndTimer) : null,
            autoEndThreshold: useAutoEndThreshold ? pollProperties.autoEndThreshold : null,
        })
            .then(() => {
                socket?.emit("classUpdate", ""); // Refresh class data to show new poll
            })
            .catch((err) => {
                console.error("Error starting custom poll:", err);
            });

        // socket && socket.emit("startPoll", pollProperties);
    }

    const settingRowStyle = {
        minHeight: 36,
    } as const;

    const autoEndInputStyle = {
        width: 118,
    } as const;

    return (
        <>{contextHolder}
        <Flex vertical align="center" justify="start" style={{ height: "100%", flex: 1, padding: 20, paddingBottom: 0 }}>
            <Title level={isMobile ? 3 : 2}>Poll Editor</Title>
            
            <Flex gap={20} vertical={isMobile} style={isMobile ? {width: '100%'} : {}}>
                <Card title="Poll Properties" style={{ width: isMobile ? "100%" : "475px" }}>
                    <Flex vertical gap={15} style={{height: isMobile ? 'min-content' : '550px'}}>
                        <Input
                            placeholder="Poll Prompt"
                            style={{ marginBottom: isMobile ? undefined : '20px' }}
                            value={pollProperties.prompt}
                            onChange={(e) => setPollProperties({ ...pollProperties, prompt: e.target.value })}
                        />

                        <Collapse
                            style={{ width: "100%" }}
                            defaultActiveKey={["behavior"]}
							accordion
                            items={[{
                                    key: "behavior",
                                    label: "Response Behavior",
                                    children: (
                                        <Flex vertical gap={12}>
                                            <Flex align="center" justify="space-between" style={settingRowStyle}>
                                                Allow Vote Changes
                                                <Switch defaultChecked={pollProperties.allowVoteChanges} onChange={(e) => setPollProperties({...pollProperties, allowVoteChanges: e})} />
                                            </Flex>

                                            <Flex align="center" justify="space-between" style={settingRowStyle}>
                                                Allow Text Responses
                                                <Switch defaultChecked={pollProperties.allowTextResponses} onChange={(e) => setPollProperties({...pollProperties, allowTextResponses: e})} />
                                            </Flex>

                                            <Flex align="center" justify="space-between" style={settingRowStyle}>
                                                Multiple Answer Poll
                                                <Switch defaultChecked={pollProperties.allowMultipleResponses} onChange={(e) => setPollProperties({...pollProperties, allowMultipleResponses: e})} />
                                            </Flex>
                                        </Flex>
                                    ),
                                },
								{
									key: 'blind',
									label: 'Blind Options',
									children: (
										<Flex vertical gap={12}>
                                            <Flex align="center" justify="space-between" style={settingRowStyle}>
                                                Blind Poll
                                                <Switch checked={pollProperties.blind} onChange={(e) => setPollProperties({...pollProperties, blind: e})} />
                                            </Flex>

                                            <Tooltip title={!pollProperties.blind ? "Enable Blind Poll to use this option" : undefined} mouseEnterDelay={0.3}>
                                                <Flex align="center" justify="space-between" style={{ ...settingRowStyle, opacity: pollProperties.blind ? 1 : 0.4, transition: "opacity 0.2s" }}>
                                                    Blind Until Ended
                                                    <Switch checked={pollProperties.blindUntilEnded} disabled={!pollProperties.blind} onChange={(e) => setPollProperties({...pollProperties, blindUntilEnded: e})} />
                                                </Flex>
                                            </Tooltip>
										</Flex>
									),
								},
                                {
                                    key: "timing",
                                    label: "Timing",
                                    children: (
                                        <Flex vertical gap={12}>
                                            <Flex align="center" justify="space-between" gap={12} style={settingRowStyle}>
                                                <Text>Auto End Timer</Text>
                                                <Flex align="center" gap={8}>
                                                    <Switch checked={useAutoEndTimer} onChange={setUseAutoEndTimer} />
                                                    <InputNumber
                                                        min={1}
                                                        max={100000}
                                                        value={pollProperties.autoEndTimer ?? 60}
                                                        onChange={(value) => setPollProperties({...pollProperties, autoEndTimer: typeof value === "number" ? value : null})}
                                                        style={autoEndInputStyle}
                                                        suffix="s"
                                                        disabled={!useAutoEndTimer}
                                                    />
                                                </Flex>
                                            </Flex>

                                            <Flex align="center" justify="space-between" gap={12} style={settingRowStyle}>
                                                <Text>Auto End Threshold</Text>
                                                <Flex align="center" gap={8}>
                                                    <Switch checked={useAutoEndThreshold} onChange={setUseAutoEndThreshold} />
                                                    <InputNumber
                                                        min={1}
                                                        max={100}
                                                        value={pollProperties.autoEndThreshold ?? 80}
                                                        onChange={(value) => setPollProperties({...pollProperties, autoEndThreshold: typeof value === "number" ? value : null})}
                                                        style={autoEndInputStyle}
                                                        suffix="%"
                                                        disabled={!useAutoEndThreshold}
                                                    />
                                                </Flex>
                                            </Flex>
                                        </Flex>
                                    ),
                                }
                            ]}
                        />
						<Flex vertical gap={12} style={{marginTop: isMobile ? 0 : 'auto'}}>
							<Flex align="center" justify="space-between" gap={10}>
								<Tooltip title="Reset answers to 'Answer X'." mouseEnterDelay={0.5}>
									<Button
										type="primary"
										style={isMobile ? {width: '100%'} : {}}
										onClick={() => {
											setPollProperties({
												...pollProperties,
												answers: pollProperties.answers.map((answer, index) => ({
													...answer,
													answer: `Answer ${index + 1}`,
												})),
											});
										}}
									>
										{
											isMobile ? (
												<Flex align="center" justify="center" gap={5}>
													<IonIcon icon={IonIcons.refresh} />
													Reset
												</Flex>
											) : "Reset Answers"
										}
									</Button>
								</Tooltip>
								<Tooltip title="Assign each answer a unique color." mouseEnterDelay={0.5}>
									<Button
										type="primary"
										style={isMobile ? {width: '100%'} : {}}
										onClick={() => {
											let colors = generateColors(pollProperties.answers.length);

											setPollProperties({
												...pollProperties,
												answers: pollProperties.answers.map((answer, index) => ({
													...answer,
													color: colors[index],
												})),
											});
										}}
									>
										{
											isMobile ? (
												<Flex align="center" justify="center" gap={5}>
													<IonIcon icon={IonIcons.brush} />
													Colors
												</Flex>
											) : "Auto Color"
										}
									</Button>
								</Tooltip>
							</Flex>

							{showSaveButtons && (
								<Flex align="center" justify="space-between" gap={10}>
									{canCreatePolls && (
										<Tooltip title={isMobile && "Save in My Polls"} mouseEnterDelay={0.5}>
											<Button
												variant="solid"
												color="green"
												style={isMobile ? { width: "100%" } : {}}
												onClick={() => openSaveModal("my")}
											>
												{
													isMobile ? (
														<Flex align="center" justify="center" gap={5}>
															<IonIcon icon={IonIcons.save} />
															My Polls
														</Flex>
													) : "Save in My Polls"
												}
											</Button>
										</Tooltip>
									)}
									{canCreatePolls && (
										<Tooltip title={isMobile && "Save as Class Poll"} mouseEnterDelay={0.5}>
											<Button
												variant="solid"
												color="green"
												style={isMobile ? { width: "100%" } : {}}
												onClick={() => openSaveModal("class")}
											>
												{
													isMobile ? (
														<Flex align="center" justify="center" gap={5}>
															<IonIcon icon={IonIcons.save} />
															Class
														</Flex>
													) : "Save as Class Poll"
												}
											</Button>
										</Tooltip>
									)}
								</Flex>
							)}

							<Button
								type="primary"
								danger
								onClick={() => {
									startCustomPoll();
								}}
							>
								Start Without Saving
							</Button>
						</Flex>
                    </Flex>
                </Card>
                <Card title={
                    <Flex align="center" justify="space-between">
                        Answers
                        <Button type="primary" onClick={() => setPollProperties({ ...pollProperties, answers: [...pollProperties.answers, { color: randomColor(), answer: `Answer ${pollProperties.answers.length + 1}`, isCorrect: false, weight: 1 }] })}>
                            Add Answer
                        </Button>
                    </Flex>
                } style={{ width: isMobile ? '100%' : "500px", ...(isMobile ? {flex: '1 1 auto', height: 'unset'} : {})  }}>
                    <Flex vertical gap={10} style={{ maxHeight: "400px", overflowY: "auto", ...{height: isMobile ? '200px' : 'auto'} }}>
                        {
                            pollProperties.answers.map((answer, index) => (
                                <PollEditorResponse 
                                    key={index}
                                    answer={answer}
                                    setAnswer={(newAnswer) => {
                                        const newAnswers = [...pollProperties.answers];
                                        newAnswers[index] = newAnswer;
                                        setPollProperties({ ...pollProperties, answers: newAnswers });
                                    }}
                                    removeAnswer={() => {
                                        const newAnswers = pollProperties.answers.filter((_, i) => i !== index);
                                        setPollProperties({ ...pollProperties, answers: newAnswers });
                                    }}
                                 />
                            ))
                        }
                        {
                            pollProperties.answers.length === 0 && (
                                <Flex align="center" justify="center" style={{ height: "100%" }}>
                                    <Text type="secondary">No answers added yet</Text>
                                </Flex>
                            )
                        }
                    </Flex>
                </Card>
            </Flex>
        </Flex>
            <Modal
                title={saveMode === "class" ? "Save as Class Poll" : "Save in My Polls"}
                open={saveModalOpen}
                onOk={confirmSavePoll}
                onCancel={() => setSaveModalOpen(false)}
                okText="Save"
                confirmLoading={isSavingPoll}
                destroyOnHidden
            >
                <Flex vertical gap={8}>
                    <Text type="secondary">Enter a name for this saved poll.</Text>
                    <Input
                        placeholder="Poll name"
                        value={pollSaveName}
                        onChange={(event) => setPollSaveName(event.target.value)}
                        onPressEnter={confirmSavePoll}
                        maxLength={200}
                    />
                </Flex>
            </Modal>
        </>
    );
}
