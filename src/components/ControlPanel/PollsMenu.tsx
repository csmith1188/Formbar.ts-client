import { Button, Col, Divider, Flex, Pagination, Row, Spin, Typography } from "antd";
const { Text, Title } = Typography;
import { socket } from "@utils/socket";
import { useClassData, useMobileDetect, useUserData } from "@/main";
import PollModal from "@components/PollModal";

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
		blindUntilEnded: false,
		autoEndTimer: null,
		autoEndThreshold: null,
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
		blindUntilEnded: false,
		autoEndTimer: null,
		autoEndThreshold: null,
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
		blindUntilEnded: false,
		autoEndTimer: null,
		autoEndThreshold: null,
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
		blindUntilEnded: false,
		autoEndTimer: null,
		autoEndThreshold: null,
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
		blindUntilEnded: false,
		autoEndTimer: null,
		autoEndThreshold: null,
	},
];

import { useTheme } from "@/main";
import { useEffect, useState } from "react";

import { notification } from "antd";
import { getPolls } from "@api/classApi";
import { currentUserHasScope } from "@utils/scopeUtils";

export default function PollsMenu({
	openModalId,
	setOpenModalId,
	onLoadPollIntoEditor,
}: {
	openModalId: number | null;
	setOpenModalId: React.Dispatch<React.SetStateAction<number | null>>;
	onLoadPollIntoEditor: (poll: {
		prompt: string;
		answers: { answer: string; weight: number; color: string; isCorrect?: boolean }[];
		allowVoteChanges: boolean;
		allowTextResponses: boolean;
		blind: boolean;
		blindUntilEnded: boolean;
		autoEndTimer: number | null;
		autoEndThreshold: number | null;
		allowMultipleResponses: boolean;
	}) => void;
}) {
	const { userData } = useUserData();
	const { classData } = useClassData();
	const { isDark } = useTheme();
    const isMobile = useMobileDetect();

    const [allowVoteChanges, setAllowVoteChanges] = useState<boolean>(false);
    const [allowTextResponses, setAllowTextResponses] = useState<boolean>(false);
    const [blind, setBlind] = useState<boolean>(false);
	const [blindUntilEnded, setBlindUntilEnded] = useState<boolean>(false);
    const [allowMultipleResponses, setAllowMultipleResponses] = useState<boolean>(false);
	const [autoEndTimer, setAutoEndTimer] = useState<number | null>(null);
	const [autoEndThreshold, setAutoEndThreshold] = useState<number | null>(null);
    const [pollPrompt, setPollPrompt] = useState<string>("");
    const [pollAnswers, setPollAnswers] = useState<{answer: string, weight: number, color: string}[]>([]);

	// Previous polls pagination state
	const [previousPolls, setPreviousPolls] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [totalPreviousPolls, setTotalPreviousPolls] = useState(0);
	const [isPreviousPollsLoading, setIsPreviousPollsLoading] = useState(false);
	const [openPreviousPollId, setOpenPreviousPollId] = useState<number | null>(null);
	const [previousPollPrompt, setPreviousPollPrompt] = useState<string>("");
	const [previousPollAnswers, setPreviousPollAnswers] = useState<{answer: string, weight: number, color: string}[]>([]);

	const [api, contextHolder] = notification.useNotification();

	const canSeePolls = currentUserHasScope(userData, "class.poll.read");
	const canCreatePolls = currentUserHasScope(userData, "class.poll.create");

	const showErrorNotification = (message: string) => {
		api["error"]({
			title: "Error",
			description: message,
			placement: "bottom",
		});
	};

	function seedPollEditor(poll: {
		prompt: string;
		answers: { answer: string; weight: number; color: string; isCorrect?: boolean }[];
		allowVoteChanges: boolean;
		allowTextResponses: boolean;
		blind: boolean;
		blindUntilEnded: boolean;
		autoEndTimer: number | null;
		autoEndThreshold: number | null;
		allowMultipleResponses: boolean;
	}) {
		onLoadPollIntoEditor({
			prompt: poll.prompt,
			answers: poll.answers.map((answer) => ({
				answer: answer.answer,
				weight: answer.weight ?? 1,
				color: answer.color,
				isCorrect: Boolean(answer.isCorrect),
			})),
			allowVoteChanges: poll.allowVoteChanges,
			allowTextResponses: poll.allowTextResponses,
			blind: poll.blind,
			blindUntilEnded: poll.blindUntilEnded,
			autoEndTimer: poll.autoEndTimer,
			autoEndThreshold: poll.autoEndThreshold,
			allowMultipleResponses: poll.allowMultipleResponses,
		});
	}

	function startPoll(id: number) {

        const poll = { ...defaultPolls.filter((e) => e.id == id)[0] };
        poll.allowVoteChanges = allowVoteChanges;
        poll.allowTextResponses = allowTextResponses;
        poll.blind = blind;
		poll.blindUntilEnded = blindUntilEnded;
		poll.autoEndTimer = autoEndTimer;
		poll.autoEndThreshold = autoEndThreshold;
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

	useEffect(() => {
		if(!classData || !canSeePolls) return;

		setIsPreviousPollsLoading(true);
		const offset = (currentPage - 1) * pageSize;

		getPolls(classData.id, pageSize, offset)
			.then((data) => {
				if (data.success) {
					const pollsData = Array.isArray(data.data?.polls) ? data.data.polls : Array.isArray(data.data) ? data.data : [];
					const total = typeof data.data?.pagination?.total === "number" ? data.data.pagination.total : pollsData.length;
					setPreviousPolls(pollsData);
					setTotalPreviousPolls(total);
				}
			})
			.catch((err) => {
				showErrorNotification(
					JSON.parse(err.message).message || "Failed to fetch previous polls.",
				);
				setPreviousPolls([]);
			})
			.finally(() => {
				setIsPreviousPollsLoading(false);
			});
	}, [classData, currentPage, pageSize])

	return (
        <>{contextHolder}
		<Flex align="center" justify="space-between" gap={30} style={{ height: "100%", padding: 20, paddingBottom: 0 }} vertical={isMobile}>
			<Flex vertical align="center" justify="start" style={{ height: isMobile ? "min-content" : "100%", width: isMobile ? '100%' : '300px' }}>
				<Title level={isMobile ? 3 : 2}>Default Polls</Title>
				{defaultPolls.map((poll) => {
					return (
                        <>
                            <div
                                key={poll.id}
                                style={{ marginTop: "10px", width: "100%" }}
                            >
                                <Button
                                    type="primary"
                                    style={{ width: "100%", fontSize: "clamp(12px, 1.5vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}
                                    onClick={() => {
                                        setOpenModalId(poll.id);
                                        setAllowVoteChanges(poll.allowVoteChanges);
                                        setAllowTextResponses(poll.allowTextResponses);
                                        setBlind(poll.blind);
										setBlindUntilEnded(Boolean((poll as any).blindUntilEnded ?? false));
										setAutoEndTimer((poll as any).autoEndTimer ?? null);
										setAutoEndThreshold((poll as any).autoEndThreshold ?? null);
                                        setAllowMultipleResponses(poll.allowMultipleResponses);
                                        setPollPrompt(poll.prompt);
                                        setPollAnswers(poll.answers.map(a => ({...a})));
                                    }}
                                >
                                    <Text strong>{poll.prompt}</Text>
                                </Button>
                                <PollModal
                                    open={openModalId === poll.id}
                                    onCancel={() => setOpenModalId(null)}
                                    prompt={pollPrompt}
                                    onPromptChange={setPollPrompt}
                                    answers={pollAnswers}
                                    onAnswersChange={setPollAnswers}
                                    allowVoteChanges={allowVoteChanges}
                                    onAllowVoteChangesChange={setAllowVoteChanges}
                                    allowTextResponses={allowTextResponses}
                                    onAllowTextResponsesChange={setAllowTextResponses}
                                    blind={blind}
                                    onBlindChange={setBlind}
									blindUntilEnded={blindUntilEnded}
									onBlindUntilEndedChange={setBlindUntilEnded}
									autoEndTimer={autoEndTimer}
									onAutoEndTimerChange={setAutoEndTimer}
									autoEndThreshold={autoEndThreshold}
									onAutoEndThresholdChange={setAutoEndThreshold}
                                    allowMultipleResponses={allowMultipleResponses}
                                    onAllowMultipleResponsesChange={setAllowMultipleResponses}
                                    footerButton={{
                                        label: "Start Poll",
                                        onClick: () => startPoll(poll.id),
                                    }}
                                    secondaryFooterButton={canCreatePolls ? {
                                        label: "Load into Editor",
                                        onClick: () => {
                                            seedPollEditor({
                                                prompt: pollPrompt,
                                                answers: pollAnswers,
                                                allowVoteChanges,
                                                allowTextResponses,
                                                blind,
												blindUntilEnded,
												autoEndTimer,
												autoEndThreshold,
                                                allowMultipleResponses,
                                            });
                                            setOpenModalId(null);
                                        },
                                    } : undefined}
                                />
                            </div>
                            {poll.divider && <Divider style={{marginTop: '15px', marginBottom: '5px'}}/>}
                        </>
					);
				})}
			</Flex>
			<Flex vertical align="center" justify="start" style={{ height: "100%", flex: 1, width: '100%', paddingBottom: 20, ...(isMobile ? {
                borderTop: `2px solid ${isDark ? '#0002' : '#fff2'}`, paddingTop: "20px", overflowY:'scroll'} : {borderLeft: `2px solid ${isDark ? '#0002' : '#fff2'}`, paddingLeft: "20px", paddingRight: "20px",overflowY:'scroll'}) }}>
				<Title level={isMobile ? 3 : 2}>Previous Polls</Title>
			{isPreviousPollsLoading ? (
				<Spin style={{ marginTop: "20px" }} />
			) : previousPolls.length === 0 || !canSeePolls ? (
				<Text type="secondary">No previous polls available</Text>
			) : (
				<>
					<Row gutter={[16, 4]} style={{ width: "100%" }}>
						{previousPolls.map((poll) => {
							return (
								<Col key={poll.globalPollId} xs={24} sm={12} lg={8}>
									<div
										style={{ marginTop: "10px", width: "100%" }}
									>
										<Button
											type="primary"
										style={{ width: "100%", fontSize: "clamp(12px, 1.5vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}
											onClick={() => {
												setOpenPreviousPollId(poll.globalPollId);
												setPreviousPollPrompt(poll.prompt);
												setPreviousPollAnswers(poll.responses ? poll.responses.map((a: any) => ({
													answer: a.answer || "",
													weight: a.weight || 1,
													color: a.color || "#000000"
												})) : []);
											}}
										>
											<Text strong>{poll.prompt}</Text>
										</Button>
										<PollModal
											open={openPreviousPollId === poll.globalPollId}
											onCancel={() => setOpenPreviousPollId(null)}
											prompt={previousPollPrompt}
											onPromptChange={setPreviousPollPrompt}
											answers={previousPollAnswers}
											onAnswersChange={setPreviousPollAnswers}
											allowVoteChanges={allowVoteChanges}
											onAllowVoteChangesChange={setAllowVoteChanges}
											allowTextResponses={allowTextResponses}
											onAllowTextResponsesChange={setAllowTextResponses}
											blind={blind}
											onBlindChange={setBlind}
											blindUntilEnded={blindUntilEnded}
											onBlindUntilEndedChange={setBlindUntilEnded}
											autoEndTimer={autoEndTimer}
											onAutoEndTimerChange={setAutoEndTimer}
											autoEndThreshold={autoEndThreshold}
											onAutoEndThresholdChange={setAutoEndThreshold}
											allowMultipleResponses={allowMultipleResponses}
											onAllowMultipleResponsesChange={setAllowMultipleResponses}
											footerButton={{
												label: "Start Poll",
												onClick: () => {
													const editedPoll = {
														...poll,
														prompt: previousPollPrompt,
														answers: previousPollAnswers,
														allowVoteChanges: allowVoteChanges,
														allowTextResponses: allowTextResponses,
														blind: blind,
														allowMultipleResponses: allowMultipleResponses
													};
													socket?.emit("startPoll", editedPoll);
													setOpenPreviousPollId(null);
												},
											}}
											secondaryFooterButton={canCreatePolls ? {
												label: "Load into Editor",
												onClick: () => {
													seedPollEditor({
														prompt: previousPollPrompt,
														answers: previousPollAnswers,
														allowVoteChanges,
														allowTextResponses,
														blind,
														blindUntilEnded,
														autoEndTimer,
														autoEndThreshold,
														allowMultipleResponses,
													});
													setOpenPreviousPollId(null);
												},
											} : undefined}
										/>
									</div>
								</Col>
							);
						})}
					</Row>
					{totalPreviousPolls > 0 && (
						<Pagination
							current={currentPage}
							pageSize={pageSize}
							total={totalPreviousPolls}
							pageSizeOptions={[10, 20, 50, 100]}

							onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
							style={{ marginTop: "20px" }}
						/>
					)}
				</>
			)}
			</Flex>
		</Flex></>
	);
}
