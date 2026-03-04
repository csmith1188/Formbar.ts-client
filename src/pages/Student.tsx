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
const { Title, Text } = Typography;

export default function Student() {
	const navigate = useNavigate();
	const { userData: initialUserData } = useUserData();
	const [userData, setUserData] = useState<any>(null);
	const [classData, setClassData] = useState<any>(null);
	const isMobileView = useMobileDetect();

	const [textResponse, setTextResponse] = useState<string>("");
	const lastPollDataRef = useRef<any>(null);

	const [pollWidth, setPollWidth] = useState<number>(
		!isMobileView
			? Math.min(window.innerWidth / 2 - 20, window.innerHeight - 200)
			: Math.min(window.innerWidth - 40, window.innerHeight / 2 - 100),
	);

	function Respond(response: string) {
		if (!socket || !socket.connected) {
			Log({
				message: "Socket not connected, cannot send response",
				level: "warn",
			});
			return;
		}
		let resTextResponse = classData?.poll.allowTextResponses
			? textResponse.trim()
			: "";
		socket.emit("pollResp", response, resTextResponse);
		Log({ message: `Responded with: ${response}`, level: "info" });
		socket.emit("classUpdate", ""); // Request updated class data after responding
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
			}

			setClassData(classData);
			lastPollDataRef.current = classData.poll;
			Log({
				message: "Class Update received.",
				data: classData,
				level: "info",
			});

			fetch(`${formbarUrl}/api/v1/user/me`, {
				method: "GET",
				headers: {
					Authorization: `${accessToken}`,
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

	return (
		<>
			<FormbarHeader />

			{/* Poll prompt */}
			<Title
				style={{
					position: "absolute",
					transform: "translate(-50%)",
					left: "50%",
					top: "82px",
					width: "90%",
					textAlign: "center",
					fontWeight: 700,
					letterSpacing: "-0.02em",
					fontSize: isMobileView ? "1.4rem" : "2rem",
					pointerEvents: "none",
					zIndex: 1,
				}}
			>
				{classData?.poll.prompt}
			</Title>

			{userData?.break !== true ? (
				<>
					<Flex
						style={{ width: "100%", height: "100%" }}
						justify={classData?.poll.status ? "space-around" : "center"}
						align="center"
						vertical={isMobileView || !classData?.poll.status}
					>
						{classData?.poll.responses.length > 0 ? (
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
								<FullCircularPoll poll={classData.poll} size={pollWidth} />
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
								gap={12}
							>
								{classData?.poll.allowTextResponses ? (
									<Input.TextArea
										style={{
											width: isMobileView ? "85%" : "50%",
											resize: "none",
											height: "160px",
											textAlign: "center",
											borderRadius: 12,
											fontSize: 15,
										}}
										placeholder="Type your response..."
										value={textResponse}
										onChange={(e) => setTextResponse(e.target.value)}
									/>
								) : null}
								<Flex
									gap={10}
									style={{ width: "100%" }}
									justify="center"
									align="center"
									wrap
								>
									{classData?.poll.responses.map((resp: any, index: number) => (
										<PollButton
											key={index}
											answerData={{ answer: resp.answer, color: resp.color }}
											Respond={Respond}
										/>
									))}
								</Flex>
								{classData?.poll.allowVoteChanges ? (
									<PollButton
										answerData={{ answer: "remove", color: "#ef4444" }}
										Respond={Respond}
									/>
								) : null}
							</Flex>
						) : !classData?.poll.prompt ? (
							<Flex vertical align="center" gap={12}>
								<Title style={{ opacity: 0.6, fontWeight: 300, letterSpacing: "-0.02em" }}>
									No active poll right now.
								</Title>
								<Text style={{ opacity: 0.4, fontSize: 15 }}>
									Sit tight — your teacher will start one shortly.
								</Text>
							</Flex>
						) : null}

						{!classData?.isActive ? (
							<Flex vertical align="center" gap={12}>
								<Title style={{ opacity: 0.6, fontWeight: 300 }}>
									Class is not active.
								</Title>
							</Flex>
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
						gap: 16,
					}}
				>
					<span style={{ fontSize: 48 }}>☕</span>
					<Title style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
						You are currently on a break.
					</Title>
					<Text style={{ opacity: 0.55, fontSize: 15 }}>
						Please wait until your break is over to participate in polls.
					</Text>
				</Flex>
			)}
		</>
	);
}
