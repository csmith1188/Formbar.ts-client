import { accessToken, formbarUrl, socket } from "../socket";

import FormbarHeader from "../components/FormbarHeader";
import FullCircularPoll from "../components/CircularPoll";
import { useEffect, useState, useRef } from "react";
import { useMobileDetect, useUserData } from "../main";
import { Typography, Flex, Input } from "antd";
import PollButton from "../components/PollButton";
import Log from "../debugLogger";
import StudentMenu from "../components/StudentMenu";
import { useNavigate } from "react-router-dom";
import { toEpochMs } from "../GlobalFunctions";
const { Title, Text } = Typography;

export default function Student() {
	const navigate = useNavigate();
	const { userData: initialUserData } = useUserData();
	const [userData, setUserData] = useState<any>(null);
	const [classData, setClassData] = useState<any>(null);
	// const [answerState, setAnswerState] = useState<any>([]);
	const isMobileView = useMobileDetect();
	// const [lastPollData, setLastPollData] = useState<any>(null);

	const [textResponse, setTextResponse] = useState<string>("");
	const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
    const [timerLerpPercent, setTimerLerpPercent] = useState<number>(0);
    const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
	const lastPollDataRef = useRef<any>(null);

	const [pollWidth, setPollWidth] = useState<number>(
		!isMobileView
			? Math.min(window.innerWidth / 2 - 20, window.innerHeight - 200)
			: Math.min(window.innerWidth - 40, window.innerHeight / 2 - 100),
	);

	function Respond(response: string | string[]) {
		let resTextResponse = classData?.poll?.allowTextResponses
			? textResponse.trim()
			: "";

        if (!classData || !classData.id) {
            Log({
                message: "Attempted to respond to poll before classData was available.",
                level: "warn",
            });
            return;
        }
		
        fetch(`${formbarUrl}/api/v1/class/${classData.id}/polls/response`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                response: response,
                textRes: resTextResponse,
            })
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to send poll response");
            }
            return res.json();
        })
        .then((res) => {
            Log({ message: "Poll response sent successfully.", data: res });
        })
        .catch((err) => {
            Log({ message: "Error sending poll response:", data: err, level: "error" });
        });
        

		Log({ message: `Responded with: ${response}`, level: "info" });
		// socket.emit("classUpdate", ""); // Request updated class data after responding
	}

	useEffect(() => {
		function handleResize() {
			if (!isMobileView) {
				setPollWidth(
					Math.min(
						window.innerWidth / 2 - 20,
						window.innerHeight - 200,
					),
				);
			} else {
				setPollWidth(
					Math.min(
						window.innerWidth - 40,
						window.innerHeight / 2 - 100,
					),
				);
			}
		}

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [isMobileView]);

	useEffect(() => {
		if (!initialUserData) return;

		// if(initialUserData.activeClass === null) navigate('/classes');
	}, [initialUserData]);

	useEffect(() => {
		if (!socket) return; // Don't set up listener if socket isn't ready

		function classUpdate(classData: any) {
			Log({ message: "Poll data", data: classData.poll });
			Log({
				message: "Last poll data ref",
				data: lastPollDataRef.current,
			});
			if (
				classData.poll.startTime !== lastPollDataRef.current?.startTime
			) {
				setTextResponse("");
				setSelectedResponses([]);
			}

			setClassData(classData);
			lastPollDataRef.current = classData.poll;
			// setLastPollData(classData.poll);
			Log({
				message: "Class Update received.",
				data: classData,
				level: "info",
			});

			fetch(`${formbarUrl}/api/v1/user/me`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			})
				.then((res) => res.json())
				.then((response) => {
					const { data } = response;
					Log({
						message: "User data fetched successfully.",
						data,
						level: "info",
					});
					setUserData(data);
				})
				.catch((err) => {
					Log({
						message: "Error fetching user data:",
						data: err,
						level: "error",
					});
				});

			// setAnswerState(classData.poll.responses);
		}

		socket.on("classUpdate", classUpdate);

		socket.emit("classUpdate", ""); // Initial request for class data
		return () => {
			socket.off("classUpdate", classUpdate);
		};
	}, [socket, setClassData]);

	useEffect(() => {
		if (!userData) return;

		if (!userData.activeClass) {
			navigate("/classes");
		}

		if (userData.classPermissions && userData.classPermissions > 2) {
			navigate("/panel");
		}

	}, [userData, navigate]);
    
    useEffect(() => {
        if (!classData?.timer?.startTime || classData.timer.startTime <= 0) return;

        const timerActive = !!classData?.timer?.active;

        const startMs = toEpochMs(classData.timer.startTime);
        const endMs = toEpochMs(classData.timer.endTime);

        if (startMs === null || endMs === null || endMs <= startMs) {
            return;
        }

		const totalMs = endMs - startMs;

		const updateTimerState = () => {
            const now = Date.now();
			const clampedNow = Math.min(Math.max(now, startMs), endMs);
			const percent = ((clampedNow - startMs) / totalMs) * 100;
            const remainingSeconds = Math.max(0, Math.ceil((endMs - clampedNow) / 1000));

			setTimerLerpPercent((prev) => (Math.abs(prev - percent) >= 0.5 ? percent : prev));
            setTimerRemainingSeconds((prev) => (prev !== remainingSeconds ? remainingSeconds : prev));
        };

		updateTimerState();

		if (!timerActive) {
			return;
		}

		const intervalId = window.setInterval(updateTimerState, 250);

        return () => {
			window.clearInterval(intervalId);
        };
    }, [classData?.timer?.startTime, classData?.timer?.endTime, classData?.timer?.active]);

	const timerStartMs = toEpochMs(classData?.timer?.startTime);
	const timerEndMs = toEpochMs(classData?.timer?.endTime);
	const timerDurationMs =
		timerStartMs !== null && timerEndMs !== null && timerEndMs > timerStartMs
			? timerEndMs - timerStartMs
			: 0;

	return (
		<>
			<FormbarHeader />

			<Title
				style={{
					position: "absolute",
					transform: "translate(-50%)",
					left: "50%",
					top: "90px",
					width: "100%",
					textAlign: "center",
				}}
			>
				{classData?.poll.prompt}
			</Title>

			{userData?.break !== true ? (
				<>
					<Flex
						style={
							!isMobileView
								? { width: "100%", height: "100%" }
								: { width: "100%", height: "100%" }
						}
						justify={
							classData?.poll.status ? "space-around" : "center"
						}
						align="center"
						vertical={isMobileView || !classData?.poll.status}
					>
						{classData?.poll.responses.length > 0 || classData?.timer.startTime > 0 ? (
							<Flex
								justify="center"
								align="center"
								vertical
								style={
									isMobileView
										? {
												width: "100%",
												height: "50%",
												paddingTop: "260px",
												paddingBottom: "120px",
											}
										: {
												width: "50%",
												paddingTop: "120px",
												paddingBottom: "120px",
											}
								}
							>
								<FullCircularPoll
									poll={classData.poll}
									size={pollWidth}
									timer={{
										active: classData?.timer?.active ?? false,
										current: timerLerpPercent,
										duration: timerDurationMs,
                                        remainingSeconds: timerRemainingSeconds,
									}}
                                    onlyTimer={!!classData?.timer?.startTime && (!classData?.poll?.status && classData.poll.responses.length === 0)}
								/>
							</Flex>
						) : null}

						{classData?.poll.status ? (
							<Flex
								justify="center"
								align="center"
								vertical
								style={
									isMobileView
										? { width: "100%", height: "50%" }
										: { width: "50%", padding: "0 20px" }
								}
								gap={10}
							>
								{classData?.poll.allowTextResponses ? (
									<Input.TextArea
										style={{
											width: "50%",
											resize: "none",
											height: "200px",
											textAlign: "center",
										}}
										value={textResponse}
										onChange={(e) =>
											setTextResponse(e.target.value)
										}
									></Input.TextArea>
								) : null}
								<Flex
									gap={10}
									style={{ width: "100%" }}
									justify="center"
									align="center"
                                    wrap
								>
									{classData?.poll.responses.map(
										(resp: any, index: number) => (
											<PollButton
												key={index}
												answerData={{
													answer: resp.answer,
													color: resp.color,
												}}
												Respond={Respond}
												allowMultipleResponses={classData?.poll?.allowMultipleResponses}
												selected={selectedResponses.includes(resp.answer)}
												onSelectToggle={(answer, nextSelected) => {
													setSelectedResponses((prev) => {
														if (nextSelected) {
															return prev.includes(answer)
																? prev
																: [...prev, answer];
														}
														return prev.filter(
															(selectedAnswer) =>
																selectedAnswer !== answer,
														);
													});
												}}
											/>
										),
									)}
								</Flex>
                                <Flex gap={10}>
								{classData?.poll.allowMultipleResponses ? (
									<PollButton
										answerData={{
											answer: "Submit",
											color: "#7dfc9f",
										}}
											Respond={() => Respond(selectedResponses)}
									/>
								) : null}
								{classData?.poll.allowVoteChanges ? (
									<PollButton
										answerData={{
											answer: "remove",
											color: "#f3655b",
										}}
										Respond={Respond}
									/>
								) : null}
                                </Flex>
							</Flex>
						) : !classData?.poll.prompt && !classData?.timer?.startTime ? (
							<Title style={{textAlign:'center'}}>There is no current poll.</Title>
						) : (
                            null
						)}

						{!classData?.isActive ? (
							<Title style={{textAlign:'center'}}>Class is not active.</Title>
						) : null}
					</Flex>

					<StudentMenu />
				</>
			) : (
				<Flex
					justify="center"
					align="center"
					style={{
						width: "100%",
						height: "80vh",
						flexDirection: "column",
						textAlign: "center",
					}}
				>
					<Title>You are currently on a break.</Title>
					<Text>
						Please wait until your break is over to participate in
						polls.
					</Text>
				</Flex>
			)}
		</>
	);
}
