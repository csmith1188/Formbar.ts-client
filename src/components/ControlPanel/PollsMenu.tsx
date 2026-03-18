import { Button, Divider, Flex, Input, Modal, Switch, Typography } from "antd";
const { Text, Title } = Typography;
import { textColorForBackground } from "../../GlobalFunctions";
import { socket } from "../../socket";
import { isMobile, useClassData, useMobileDetect } from "../../main";

const defaultPolls = [
	{
		id: 1,
		prompt: "Thumbs?",
		answers: [
			{ answer: "Up", weight: 0.9, color: "#00FF00" },
			{ answer: "Wiggle", weight: 1, color: "#00FFFF" },
			{ answer: "Down", weight: 1.1, color: "#FF0000" },
		],
		weight: 1,

		blind: false,
		allowVoteChanges: true,
		excludedRespondents: [],
		indeterminate: [],
		allowTextResponses: false,
		allowMultipleResponses: false,
	},
	{
		id: 2,
		prompt: "True or False",
		answers: [
			{ answer: "True", weight: 1, color: "#00FF00" },
			{ answer: "False", weight: 1, color: "#FF0000" },
		],
		weight: 1,

		blind: false,
		allowVoteChanges: true,
		excludedRespondents: [],
		indeterminate: [],
		allowTextResponses: false,
		allowMultipleResponses: false,
	},
	{
		id: 3,
		prompt: "Done/Ready?",
		answers: [{ answer: "Yes", weight: 1, color: "#00FF00" }],

		blind: false,
		allowVoteChanges: true,
		excludedRespondents: [],
		indeterminate: [],
		allowTextResponses: false,
		allowMultipleResponses: false,
	},
	{
		id: 4,
		prompt: "Multiple Choice",
		answers: [
			{ answer: "A", weight: 1, color: "#FF0000" },
			{ answer: "B", weight: 1, color: "#0000FF" },
			{ answer: "C", weight: 1, color: "#FFFF00" },
			{ answer: "D", weight: 1, color: "#00FF00" },
		],

		blind: false,
		allowVoteChanges: true,
		excludedRespondents: [],
		indeterminate: [],
		allowTextResponses: false,
		allowMultipleResponses: false,
        divider: true,
	},
	{
		id: 5,
		prompt: "Describe a...",
		answers: [
			{ answer: "Submit", weight: 1, color: "#00FF00" },
		],

		blind: false,
		allowVoteChanges: false,
		excludedRespondents: [],
		indeterminate: [],
		allowTextResponses: true,
		allowMultipleResponses: false,
	},
];

import { useTheme } from "../../main";
import { useState } from "react";

import { notification } from "antd";

export default function PollsMenu({
	openModalId,
	setOpenModalId,
}: {
	openModalId: number | null;
	setOpenModalId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
	const { classData } = useClassData();
	const { isDark } = useTheme();
    const isMobile = useMobileDetect();

    const [allowVoteChanges, setAllowVoteChanges] = useState<boolean>(false);
    const [allowTextResponses, setAllowTextResponses] = useState<boolean>(false);
    const [blind, setBlind] = useState<boolean>(false);
    const [allowMultipleResponses, setAllowMultipleResponses] = useState<boolean>(false);
    const [pollPrompt, setPollPrompt] = useState<string>("");
    const [pollAnswers, setPollAnswers] = useState<{answer: string, weight: number, color: string}[]>([]);

	const [api, contextHolder] = notification.useNotification();

	const showErrorNotification = (message: string) => {
		api["error"]({
			title: "Error",
			description: message,
			placement: "bottom",
		});
	};

	function startPoll(id: number) {

        const poll = { ...defaultPolls.filter((e) => e.id == id)[0] };
        poll.allowVoteChanges = allowVoteChanges;
        poll.allowTextResponses = allowTextResponses;
        poll.blind = blind;
        poll.allowMultipleResponses = allowMultipleResponses;
        poll.prompt = pollPrompt;
        poll.answers = pollAnswers;

		if (!classData?.isActive) {
			showErrorNotification(
                "Class is not active.",
            );
			return;
		}

		socket?.emit("startPoll", poll);
		setOpenModalId(null);
	}

	return (
        <>{contextHolder}
		<Flex align="center" justify="space-between" gap={40} style={{ height: "100%" }} vertical={isMobile}>
			<Flex vertical align="center" justify="start" style={{ height: isMobile ? "min-content" : "100%" }}>
				<Title level={isMobile ? 3 : 2}>Default Polls</Title>
				{defaultPolls.map((poll) => {
					return (
                        <>
                            <div
                                key={poll.id}
                                style={{ marginTop: "10px", width: "300px" }}
                            >
                                <Button
                                    type="primary"
                                    style={{ padding: "10px", width: "100%" }}
                                    onClick={() => {
                                        setOpenModalId(poll.id);
                                        setAllowVoteChanges(poll.allowVoteChanges);
                                        setAllowTextResponses(poll.allowTextResponses);
                                        setBlind(poll.blind);
                                        setAllowMultipleResponses(poll.allowMultipleResponses);
                                        setPollPrompt(poll.prompt);
                                        setPollAnswers(poll.answers.map(a => ({...a})));
                                    }}
                                >
                                    <Text strong>{poll.prompt}</Text>
                                </Button>
                                <Modal
                                    centered
                                    title={
                                        <Input value={pollPrompt} placeholder="Prompt" onChange={(e) => setPollPrompt(e.target.value)} style={{width:'calc(100% - 35px)'}}/>
                                    }
                                    open={openModalId === poll.id}
                                    onCancel={() => {
                                        setOpenModalId(null);
                                    }}
                                    destroyOnHidden
                                    footer={null}
                                >
                                    {pollAnswers.map((answer, index) => (
                                        <Button
                                            key={index}
                                            style={{
                                                backgroundColor: answer.color,
                                                color: textColorForBackground(
                                                    answer.color,
                                                ),
                                                marginTop: "5px",
                                                width: "100%",
                                            }}
                                        >
                                            <Input value={answer.answer} 
                                            variant='borderless' placeholder="Answer" onChange={(e) => {
                                                setPollAnswers(pollAnswers.map((a, i) => 
                                                    i === index ? {...a, answer: e.target.value} : a
                                                ));
                                            }} 
                                            style={{
                                                color: textColorForBackground(answer.color),
                                            }}
                                            />
                                        </Button>
                                    ))}

                                    <Flex vertical gap={10} style={{ marginTop: "20px" }}>
                                        <Flex align="center" justify="space-between">
                                            Allow Vote Changes
                                            <Switch defaultChecked={poll.allowVoteChanges} onChange={(checked) => setAllowVoteChanges(checked)} />
                                        </Flex>

                                        <Flex align="center" justify="space-between">
                                            Allow Text Responses
                                            <Switch defaultChecked={poll.allowTextResponses} onChange={(checked) => setAllowTextResponses(checked)} />
                                        </Flex>

                                        <Flex align="center" justify="space-between">
                                            Blind Poll
                                            <Switch defaultChecked={poll.blind} onChange={(checked) => setBlind(checked)} />
                                        </Flex>

                                        <Flex align="center" justify="space-between">
                                            Multiple Answer Poll
                                            <Switch defaultChecked={poll.allowMultipleResponses} onChange={(checked) => setAllowMultipleResponses(checked)} />
                                        </Flex>
                                    </Flex>

                                    {/* <Flex vertical gap={10} style={{ marginTop: "20px" }}>
                                        <Text type="secondary">Last ran: Never</Text>
                                    </Flex> */}

                                    <div
                                        style={{
                                            marginTop: "20px",
                                            textAlign: "center",
                                            width: "100%",
                                        }}
                                    >
                                        <Button
                                            type="primary"
                                            onClick={() => startPoll(poll.id)}
                                        >
                                            Start Poll
                                        </Button>
                                    </div>
                                </Modal>
                            </div>
                            {poll.divider && <Divider style={{marginTop: '15px', marginBottom: '5px'}}/>}
                        </>
					);
				})}
			</Flex>
			<Flex vertical align="center" justify="start" style={{ height: "100%", flex: 1, ...(isMobile ? {
                borderTop: `2px solid ${isDark ? '#0002' : '#fff2'}`, paddingTop: "20px",} : {borderLeft: `2px solid ${isDark ? '#0002' : '#fff2'}`, paddingLeft: "20px", paddingRight: "20px"}) }}>
				<Title level={isMobile ? 3 : 2}>Previous Polls</Title>
				<p>no endpoint</p>
			</Flex>
		</Flex></>
	);
}
