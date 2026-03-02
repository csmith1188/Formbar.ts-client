import { Button, Card, Flex, Input, Switch, Tooltip, Typography, notification } from "antd";
const { Title, Text } = Typography;
import { useClassData, useTheme } from "../../main";
import PollEditorResponse from "../PollEditorResponse";
import { useState } from "react";

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
    allowVoteChanges: boolean;
    excludedRespondents: any[];
    indeterminate: any[];
    allowTextResponses: boolean;
    allowMultipleResponses: boolean;
};

import { accessToken, formbarUrl, socket } from "../../socket";

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
    const { isDark } = useTheme();
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
        allowVoteChanges: true,
        excludedRespondents: [],
        indeterminate: [],
        allowTextResponses: false,
        allowMultipleResponses: false,
    });

    function startCustomPoll() {
        //? Use fetch WHEN IT ACTUALLY WORKS.
        // fetch(`${formbarUrl}/api/v1/class/${classData?.id}/polls/create`, {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //         "Authorization": `Bearer ${accessToken}`,
        //     },
        //     body: JSON.stringify(pollProperties),
        // })
        // .then((res) => res.json())
        // .then((data) => {
        //     console.log("Custom poll started:", data);
        //     socket?.emit("classUpdate", ""); // Refresh class data to show new poll
        // })
        // .catch((err) => {
        //     console.error("Error starting custom poll:", err);
        // });

		if (!classData?.isActive) {
			showErrorNotification(
                "Class is not active.",
            );
			return;
		}

        socket && socket.emit("startPoll", pollProperties);
    }

    return (
        <>{contextHolder}
        <Flex vertical align="center" justify="start" style={{ height: "100%", padding: "20px", flex: 1 }}>
            <Title>Poll Editor</Title>
            
            <Flex gap={20}>
                <Card title="Poll Properties">

                    <Flex vertical gap={15} style={{height: 400}}>
                        <Input placeholder="Poll Prompt" style={{ marginBottom: "20px" }}
                            value={pollProperties.prompt} onChange={(e) => setPollProperties({ ...pollProperties, prompt: e.target.value })}
                        />

                        <Flex align="center" justify="space-between">
                            Allow Vote Changes
                            <Switch onChange={(e) => setPollProperties({...pollProperties, allowVoteChanges: e})} />
                        </Flex>

                        <Flex align="center" justify="space-between">
                            Allow Text Responses
                            <Switch onChange={(e) => setPollProperties({...pollProperties, allowTextResponses: e})} />
                        </Flex>

                        <Flex align="center" justify="space-between">
                            Blind Poll
                            <Switch onChange={(e) => setPollProperties({...pollProperties, blind: e})} />
                        </Flex>

                        <Flex align="center" justify="space-between" style={{cursor:'not-allowed', opacity: 0.5}}>
                            Multiple Answer Poll
                            <Switch onChange={(e) => setPollProperties({...pollProperties, allowMultipleResponses: e})} />
                        </Flex>

                        <Flex align="center" justify="space-between" gap={10} style={{marginTop: '10px'}}>
                            <Tooltip title="Reset answers to 'Answer X'.">
                                <Button type="primary"
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
                                    Reset Answers
                                </Button>
                            </Tooltip>
                            <Tooltip title="Assign each answer a unique color.">
                                <Button type="primary"
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
                                    Auto Color
                                </Button>
                            </Tooltip>
                        </Flex>

                        <Flex align="center" justify="space-between" gap={10} style={{cursor:'not-allowed', opacity: 0.5}}>
                            <Button variant="solid" color="green">
                                Save in My Polls
                            </Button>
                            <Button variant="solid" color="green">
                                Save as Class poll
                            </Button>
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
                } style={{ width: "500px" }}>
                    <Flex vertical gap={10} style={{ height: "400px", overflowY: "auto" }}>
                        {
                            pollProperties.answers.map((answer, index) => (
                                <PollEditorResponse 
                                    key={index}
                                    answer={answer}
                                    setAnswer={(newAnswer) => {
                                        const newAnswers = [...pollProperties.answers];
                                        newAnswers[index] = newAnswer;
                                        setPollProperties({ ...pollProperties, answers: newAnswers });
                                        console.log(newAnswers);
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