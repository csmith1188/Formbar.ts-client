import { Button, Card, Flex, Input, Switch, Tooltip, Typography, notification, InputNumber } from "antd";
const { Title, Text } = Typography;
import { useClassData, useMobileDetect } from "@/main";
import { useState } from "react";
import { IonIcon } from "@ionic/react";
import PollEditorResponse from "@components/PollEditorResponse";
import * as IonIcons from "ionicons/icons";

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
import { createPoll } from "@api/classApi";

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

export default function PollsEditorMenu() {
    const isMobile = useMobileDetect();
    const { classData } = useClassData();

	const [api, contextHolder] = notification.useNotification();

	const showErrorNotification = (message: string) => {
		api["error"]({
			title: "Error",
			description: message,
			placement: "bottom",
		});
	};

    const [pollProperties, setPollProperties] = useState<PollProperties>({
        prompt: "Custom Poll",
        answers: [
            { color: randomColor(), answer: "Answer 1", isCorrect: false, weight: 1 },
            { color: randomColor(), answer: "Answer 2", isCorrect: false, weight: 1 },
            { color: randomColor(), answer: "Answer 3", isCorrect: false, weight: 1 },
        ],
        weight: 1,
        blind: false,
        blindUntilEnded: false,
        allowVoteChanges: true,
        excludedRespondents: [],
        indeterminate: [],
        allowTextResponses: false,
        allowMultipleResponses: false,
        autoEndTimer: null,
        autoEndThreshold: null,
    });

    function startCustomPoll() {
		if (!classData?.isActive) {
			showErrorNotification(
                "Class is not active.",
            );
			return;
		}

        //? Use fetch WHEN IT ACTUALLY WORKS.
        createPoll(classData.id, pollProperties)
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

    const autoEndSectionStyle = {
        padding: 12,
        border: "1px solid rgba(5, 5, 5, 0.08)",
        borderRadius: 8,
        background: "rgba(5, 5, 5, 0.02)",
    } as const;

    const autoEndInputStyle = {
        width: 118,
    } as const;

    return (
        <>{contextHolder}
        <Flex vertical align="center" justify="start" style={{ height: "100%", flex: 1, padding: 20, paddingBottom: 0 }}>
            <Title level={isMobile ? 3 : 2}>Poll Editor</Title>
            
            <Flex gap={20} vertical={isMobile} style={isMobile ? {width: '100%'} : {}}>
                <Card title="Poll Properties">

                    <Flex vertical gap={15} style={{height: isMobile ? 'min-content' : '550px'}}>
                        <Input placeholder="Poll Prompt" style={{ marginBottom: isMobile ? undefined : '20px' }}
                            value={pollProperties.prompt} onChange={(e) => setPollProperties({ ...pollProperties, prompt: e.target.value })}
                        />
                        {
                            isMobile ? (
                                null
                            ) : (
                                <>

                                <Flex align="center" justify="space-between" style={settingRowStyle}>
                                    Allow Vote Changes
                                    <Switch defaultChecked={pollProperties.allowVoteChanges} onChange={(e) => setPollProperties({...pollProperties, allowVoteChanges: e})} />
                                </Flex>

                                <Flex align="center" justify="space-between" style={settingRowStyle}>
                                    Allow Text Responses
                                    <Switch defaultChecked={pollProperties.allowTextResponses} onChange={(e) => setPollProperties({...pollProperties, allowTextResponses: e})} />
                                </Flex>

                                <Flex align="center" justify="space-between" style={settingRowStyle}>
                                    Blind Poll
                                    <Switch defaultChecked={pollProperties.blind} onChange={(e) => setPollProperties({...pollProperties, blind: e})} />
                                </Flex>

                                <Flex align="center" justify="space-between" style={settingRowStyle}>
                                    Blind Until Ended
                                    <Switch defaultChecked={pollProperties.blindUntilEnded} onChange={(e) => setPollProperties({...pollProperties, blindUntilEnded: e})} />
                                </Flex>

                                <Flex align="center" justify="space-between" style={settingRowStyle}>
                                    Multiple Answer Poll
                                    <Switch defaultChecked={pollProperties.allowMultipleResponses} onChange={(e) => setPollProperties({...pollProperties, allowMultipleResponses: e})} />
                                </Flex>
                                    <Flex align="center" justify="space-between" style={settingRowStyle}>
                                        <Text>Auto End Timer</Text>
                                        <InputNumber
                                            min={0}
                                            max={100000}
                                            value={pollProperties.autoEndTimer ?? 0}
                                            onChange={(value) => setPollProperties({...pollProperties, autoEndTimer: Number(value ?? 0)})}
                                            style={autoEndInputStyle}
                                            suffix="s"
                                        />
                                    </Flex>

                                    <Flex align="center" justify="space-between" style={settingRowStyle}>
                                        <Text>Auto End Threshold</Text>
                                        <InputNumber
                                            min={0}
                                            max={100}
                                            value={pollProperties.autoEndThreshold ?? 0}
                                            onChange={(value) => setPollProperties({...pollProperties, autoEndThreshold: Number(value ?? 0)})}
                                            style={autoEndInputStyle}
                                            suffix="%"
                                        />
                                    </Flex>
                                </>
                            )
                        }

                        <Flex align="center" justify="space-between" gap={10} style={{marginTop: '10px'}}>
                            <Tooltip title="Reset answers to 'Answer X'." mouseEnterDelay={0.5}>
                                <Button type="primary"
                                    style={isMobile ? {width: '100%'} : {}}
                                    onClick={() => {
                                        // Change all answers to "Answer {index}"
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
                                <Button type="primary"
                                    style={isMobile ? {width: '100%'} : {}}
                                    onClick={() => {
                                        let colors = generateColors(pollProperties.answers.length);

                                        // Change all answers to a color from the generated colors array
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

                        <Flex align="center" justify="space-between" gap={10} style={{cursor:'not-allowed', opacity: 0.5}}>
                            <Tooltip title={isMobile && "Save in My Polls"} mouseEnterDelay={0.5}>
                                <Button variant="solid" color="green" style={isMobile ? {width: '100%'} : {}}>
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
                            <Tooltip title={isMobile && "Save as Class Poll"} mouseEnterDelay={0.5}>
                                <Button variant="solid" color="green" style={isMobile ? {width: '100%'} : {}}>
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
                        </Flex>

                        <Button type="primary" danger 
                            onClick={() => {
                                startCustomPoll()
                            }}
                        >
                            Start Without Saving
                        </Button>
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
        </>
    );
}
