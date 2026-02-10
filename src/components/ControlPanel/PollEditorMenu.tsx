import { Button, Card, Flex, Input, Switch, Typography } from "antd";
const { Title } = Typography;
import { useTheme } from "../../main";
import PollEditorResponse from "../PollEditorResponse";
import { useState } from "react";

export default function PollsEditorMenu() {
    const { isDark } = useTheme();

    const [answers, setAnswers] = useState([
        { text: "Answer 1", isCorrect: false, weight: 1 },
        { text: "Answer 2", isCorrect: false, weight: 1 },
        { text: "Answer 3", isCorrect: false, weight: 1 },
    ]);

    return (
        <Flex vertical align="center" justify="start" style={{ height: "100%", padding: "20px", flex: 1 }}>
            <Title>Poll Editor</Title>
            
            <Flex gap={20}>
                <Card title="Poll Properties">

                    <Flex vertical gap={15} style={{height: 400}}>
                        <Input placeholder="Poll Prompt" style={{ marginBottom: "20px" }} />

                        <Flex align="center" justify="space-between">
                            Allow Vote Changes
                            <Switch />
                        </Flex>

                        <Flex align="center" justify="space-between">
                            Allow Text Responses
                            <Switch />
                        </Flex>

                        <Flex align="center" justify="space-between">
                            Blind Poll
                            <Switch />
                        </Flex>

                        <Flex align="center" justify="space-between">
                            Multiple Answer Poll
                            <Switch />
                        </Flex>

                        <Flex align="center" justify="space-between" gap={10} style={{marginTop: '10px'}}>
                            <Button type="primary">
                                Reset Answers
                            </Button>
                            <Button type="primary">
                                Reset Colors
                            </Button>
                        </Flex>

                        <Flex align="center" justify="space-between" gap={10}>
                            <Button variant="solid" color="green">
                                Save in My Polls
                            </Button>
                            <Button variant="solid" color="green">
                                Save as Class poll
                            </Button>
                        </Flex>

                        <Button type="primary" danger>
                            Start Without Saving
                        </Button>
                    </Flex>
                </Card>
                <Card title={
                    <Flex align="center" justify="space-between">
                        Answers
                        <Button type="primary" onClick={() => setAnswers([...answers, { text: `Answer ${answers.length + 1}`, isCorrect: false, weight: 1 }])}>
                            Add Answer
                        </Button>
                    </Flex>
                } style={{ width: "100%" }}>
                    <Flex vertical gap={10} style={{ height: "400px", overflowY: "auto" }}>
                        {
                            answers.map((answer, index) => (
                                <PollEditorResponse 
                                    key={index}
                                    answer={answer}
                                    setAnswer={(newAnswer) => {
                                        const newAnswers = [...answers];
                                        newAnswers[index] = newAnswer;
                                        setAnswers(newAnswers);
                                        console.log(newAnswers);
                                    }}
                                 />
                            ))
                        }
                    </Flex>
                </Card>
            </Flex>
        </Flex>
    );
}