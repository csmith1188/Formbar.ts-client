import {
	Menu,
	Row,
	Col,
	Flex,
	Button,
	Card,
    Progress,
    Typography,
} from "antd";
const { Text } = Typography;
import FormbarHeader from "@components/FormbarHeader";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useClassData, useSettings, useTheme, useUserData } from "@/main";
import { Activity, useEffect, useState, useRef, useMemo } from "react";

import Dashboard from "@components/ControlPanel/Dashboard";
import PollsMenu from "@components/ControlPanel/PollsMenu";
import SettingsMenu from "@components/ControlPanel/SettingsMenu";
import RolesMenu from "@components/ControlPanel/RolesMenu";
import PollEditorMenu from "@components/ControlPanel/PollEditorMenu";

import { socket } from "@utils/socket";
import Log from "@utils/debugLogger";
import ControlPanelPoll from "@components/BarPoll";
import Statistics from "@components/ControlPanel/StatisticsPage";
import PollModal from "@components/PollModal";

import { isMobile } from "@/main";
import { useNavigate } from "react-router-dom";
import TimerPage from "@components/ControlPanel/TimerPage";
import { formatTime, toEpochMs } from "@utils/GlobalFunctions";
import { clearCurrentPoll, endPoll } from "@api/classApi";
import { clearTimer, pauseTimer, resumeTimer } from "@api/timerApi";

import useSound from 'use-sound'
import alarmSFX from '@assets/sfx/alarmClock.mp3';
import breakSFX from '@assets/sfx/break.wav';
import helpSFX from '@assets/sfx/help.wav';
import joinSFX from '@assets/sfx/join.wav';
import leaveSFX from '@assets/sfx/leave.wav';
import removeSFX from '@assets/sfx/remove.wav';
import tutdSFX from '@assets/sfx/TUTD.wav';
import { type ClassData, type ScopeKey } from "@/types";
import { currentUserHasScope, userHasAllScopes, userHasAnyScope } from "@utils/scopeUtils";
import { getMe } from "@api/userApi";

type EditorSeedPoll = {
	prompt: string;
	answers: { color: string; answer: string; isCorrect: boolean; weight: number }[];
	allowVoteChanges: boolean;
	allowTextResponses: boolean;
	blind: boolean;
	blindUntilEnded: boolean;
	autoEndTimer: number | null;
	autoEndThreshold: number | null;
	allowMultipleResponses: boolean;
};

interface MenuItem {
	key: string;
	icon: React.ReactNode;
	deselectedicon: React.ReactNode;
	selectedicon: React.ReactNode;
	label: string;
	requiredscopes?: {
		requireAll: boolean;
        scopes: string[];
	};
}


const items: MenuItem[] = [
	{
		key: "1",
		icon: <IonIcon icon={IonIcons.pieChart} />,
		deselectedicon: <IonIcon icon={IonIcons.pieChartOutline} />,
		selectedicon: <IonIcon icon={IonIcons.pieChart} />,
		label: "Dashboard",
		requiredscopes: {
			requireAll: true,
			scopes: [
				'class.students.read'
			]
		}
	},
	{
		key: "2",
		icon: <IonIcon icon={IonIcons.barChartOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.barChartOutline} />,
		selectedicon: <IonIcon icon={IonIcons.barChart} />,
		label: "Polls",
		requiredscopes: {
			requireAll: false,
			scopes: [
				'class.poll.create',
				'class.poll.delete',
				'class.poll.end',
				'class.poll.share'
			]
		}
	},
	{
		key: "7",
		icon: <IonIcon icon={IonIcons.pencilOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.pencilOutline} />,
		selectedicon: <IonIcon icon={IonIcons.pencil} />,
		label: "Poll Editor",
		requiredscopes: {
			requireAll: true,
			scopes: [
				'class.poll.create',
			]
		}
	},
	{
		key: "3",
		icon: <IonIcon icon={IonIcons.timerOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.timerOutline} />,
		selectedicon: <IonIcon icon={IonIcons.timer} />,
		label: "Timer",
		requiredscopes: {
			requireAll: true,
			scopes: [
				'class.timer.control',
			]
		}
	},
	{
		key: "4",
		icon: <IonIcon icon={IonIcons.statsChartOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.statsChartOutline} />,
		selectedicon: <IonIcon icon={IonIcons.statsChart} />,
		label: "Statistics",
		requiredscopes: {
			requireAll: false,
			scopes: []
		}
	},
	{
		key: "5",
		icon: <IonIcon icon={IonIcons.lockClosedOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.lockClosedOutline} />,
		selectedicon: <IonIcon icon={IonIcons.lockClosed} />,
		label: "Roles",
		requiredscopes: {
			requireAll: false,
			scopes: [
				'class.roles.read',
			]
		}
	},
	{
		key: "6",
		icon: <IonIcon icon={IonIcons.settingsOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.settingsOutline} />,
		selectedicon: <IonIcon icon={IonIcons.settings} />,
		label: "Settings",
		requiredscopes: {
			requireAll: true,
			scopes: [
				'class.session.settings'
			]
		}
	}
];

function canViewMenuItem(userData: Parameters<typeof currentUserHasScope>[0], item: MenuItem): boolean {
    if (!item.requiredscopes) return true;

    if (!item.requiredscopes.scopes.length) return true;

    return item.requiredscopes.requireAll
        ? userHasAllScopes(userData, item.requiredscopes.scopes as ScopeKey[])
        : userHasAnyScope(userData, item.requiredscopes.scopes as ScopeKey[]);
}

export default function ControlPanel() {
	const { classData, setClassData } = useClassData();
	const prevClassDataRef = useRef<ClassData | null>(null);
	const timerAlarmPlayedRef = useRef(false);
	const isMobileDevice = isMobile();
	const [currentMenu, setCurrentMenu] = useState("1");
	const [pollEditorSeed, setPollEditorSeed] = useState<EditorSeedPoll | null>(null);

    const [showPollDetails, setShowPollDetails] = useState(false);

    const { settings } = useSettings();

    const [playAlarm, alarmData] = useSound(alarmSFX, { volume: settings.general.sfxVolume / 100 });
    const [playBreak] = useSound(breakSFX, { volume: settings.general.sfxVolume / 100 });
    const [playHelp] = useSound(helpSFX, { volume: settings.general.sfxVolume / 100 });
    const [playJoin] = useSound(joinSFX, { volume: settings.general.sfxVolume / 100 });
    const [playLeave] = useSound(leaveSFX, { volume: settings.general.sfxVolume / 100 });
    const [playRemove] = useSound(removeSFX, { volume: settings.general.sfxVolume / 100 });
    const [playTUTD] = useSound(tutdSFX, { volume: settings.general.sfxVolume / 100 });

	const { setUserData, userData } = useUserData();

	const { isDark } = useTheme();

	const navigate = useNavigate();
    const visibleMenuItems = useMemo(
        () => items.filter((item) => canViewMenuItem(userData, item)),
        [userData]
    );

	const canControlTimer = currentUserHasScope(userData, "class.timer.control");

	useEffect(() => {
		if (!userData) return;

		if (!userData.activeClass) {
			navigate("/classes");
		}

        if (!currentUserHasScope(userData, "class.system.panel_access")) {
			navigate("/student");
		}

    }, [userData, classData, navigate]);

    useEffect(() => {
        if (!visibleMenuItems.length) return;

        if (!visibleMenuItems.some((item: MenuItem) => item.key === currentMenu)) {
            setCurrentMenu(visibleMenuItems[0].key);
        }
    }, [currentMenu, visibleMenuItems]);


	useEffect(() => {
		if (!socket) return; // Don't set up listener if socket isn't ready

		function classUpdate(newClassData: ClassData) {
			getMe()
				.then((response) => {
					const { data } = response;
					Log({
						message: "User data fetched successfully!!!.",
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

			setClassData(newClassData);

			if(!prevClassDataRef.current) {
				prevClassDataRef.current = newClassData;
				return;
			}

            // Get online students before and after update to compare
			const oldStudents = Object.values(prevClassDataRef.current?.students || {}).filter(student => !student.isOffline);
			const newStudents = Object.values(newClassData.students).filter(student => !student.isOffline);
            const oldResponses = prevClassDataRef.current?.poll ? Object.values(prevClassDataRef.current?.poll.responses || {}).map((resp: any) => resp.responses) : [];
            const newResponses = newClassData.poll ? Object.values(newClassData.poll.responses || {}).map((resp: any) => resp.responses) : [];

            const oldResponsesTotal = oldResponses.reduce((sum: number, count: number) => sum + count, 0);
            const newResponsesTotal = newResponses.reduce((sum: number, count: number) => sum + count, 0);
            const responsesChanged = JSON.stringify(oldResponses) !== JSON.stringify(newResponses);

            const oldHelpCount = oldStudents.filter(student => student.help).length;
            const newHelpCount = newStudents.filter(student => student.help).length;

            const oldBreakCount = oldStudents.filter(student => student.break).length;
            const newBreakCount = newStudents.filter(student => student.break).length;

            oldStudents.length < newStudents.length ? playJoin() : null;
            oldStudents.length > newStudents.length ? playLeave() : null;

            responsesChanged && newResponsesTotal >= oldResponsesTotal ? playTUTD() : null;
            oldResponsesTotal > newResponsesTotal ? playRemove() : null;

            oldHelpCount < newHelpCount ? playHelp() : null;
            oldBreakCount < newBreakCount ? playBreak() : null;
            
			setClassData(newClassData);
			prevClassDataRef.current = newClassData;

			Log({
				message: "Class Update received.",
				data: newClassData,
				level: "info",
			});

			Log({
				message: "Total Voters: " + (newClassData.poll ? newClassData.poll.totalResponders : 0),
				level: "info",
			});	
		}

		socket.on("classUpdate", classUpdate);

		socket.emit("classUpdate", "");
		return () => {
			socket.off("classUpdate", classUpdate);
		};
	}, [
        socket,
        setClassData,
        playTUTD,
        playHelp,
        playBreak,
        playRemove,
        playJoin,
        playLeave
    ]);

	const [openModalId, setOpenModalId] = useState<number | null>(null);

    const [timerPercent, setTimerPercent] = useState(0);
    const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);

	//const [allStudents, setAllStudents] = useState<Student[]>(students);

	function startClass() {
		socket?.emit("startClass");
		socket?.emit("classUpdate", "");
	}

	function endClass() {
		socket?.emit("endClass");
	}

	function openMenu(key: string) {
		if (key === currentMenu) return;
		setCurrentMenu(key);
	}

	function loadPollIntoEditor(seed: EditorSeedPoll) {
		setPollEditorSeed(seed);
		setCurrentMenu("7");
	}

    useEffect(() => {
        if (!classData?.timer?.startTime || classData.timer.startTime <= 0) {
            setTimerPercent(0);
            setTimerRemainingSeconds(0);
            return;
        }

        const timerActive = !!classData?.timer?.active;
        const startMs = toEpochMs(classData.timer.startTime);
        const endMs = toEpochMs(classData.timer.endTime);

        if (startMs === null || endMs === null || endMs <= startMs) {
            setTimerPercent(0);
            setTimerRemainingSeconds(0);
            return;
        }

        const totalMs = endMs - startMs;

        const updateTimerState = () => {
            const now = Date.now();
            const clampedNow = Math.min(Math.max(now, startMs), endMs);
            const percent = ((clampedNow - startMs) / totalMs) * 100;
            const remainingSeconds = Math.max(0, Math.ceil((endMs - clampedNow) / 1000));

            setTimerPercent((prev) => (Math.abs(prev - percent) >= 0.5 ? percent : prev));
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

    // Play alarm when timer ends
    useEffect(() => {
        // Reset alarm played flag when timer is cleared or restarted
        if (!classData?.timer?.startTime || classData.timer.startTime <= 0) {
            timerAlarmPlayedRef.current = false;
            return;
        }

        const checkTimer = () => {
            const timerEndMs = toEpochMs(classData.timer.endTime);
            const now = Date.now();
            const timerActive = classData?.timer?.active;
            const alarmAlreadyPlayed = timerAlarmPlayedRef.current;

            Log({
                message: "Timer check",
                data: {
                    timerEndMs,
                    now,
                    timerActive,
                    alarmAlreadyPlayed,
                    shouldPlay: timerActive && timerEndMs !== null && now >= timerEndMs && !alarmAlreadyPlayed,
                    timeUntilAlarm: timerEndMs !== null ? timerEndMs - now : null,
                },
                level: "info",
            });

            // Play alarm when current time reaches or exceeds end time, and timer is active
            if (timerActive && timerEndMs !== null && now >= timerEndMs && !alarmAlreadyPlayed) {
                Log({
                    message: "🔔 PLAYING ALARM NOW!",
                    data: { timerEndMs, now },
                    level: "info",
                });
                timerAlarmPlayedRef.current = true;
                playAlarm();
            }
        };

        checkTimer();

        // Check every 250ms (same as timer update interval)
        const intervalId = window.setInterval(checkTimer, 250);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [classData?.timer?.startTime, classData?.timer?.endTime, classData?.timer?.active, playAlarm]);

    const timerStartMs = toEpochMs(classData?.timer?.startTime);
    const timerEndMs = toEpochMs(classData?.timer?.endTime);
    const timerDurationSeconds =
        timerStartMs !== null && timerEndMs !== null && timerEndMs > timerStartMs
            ? Math.round((timerEndMs - timerStartMs) / 1000)
            : 0;

	const canStartClassSession = currentUserHasScope(userData, "class.session.start");
	const canEndClassSession = currentUserHasScope(userData, "class.session.end");
	const canToggleClassSession = classData?.isActive ? canEndClassSession : canStartClassSession;

	const canSeePoll = currentUserHasScope(userData, "class.poll.read");
	const canEndPoll = currentUserHasScope(userData, "class.poll.end");
	// const canSharePoll = currentUserHasScope(userData, "class.poll.share");
	const canClearPoll = currentUserHasScope(userData, "class.poll.delete");

	return (
		<>
			<FormbarHeader />

			{ canSeePoll && <ControlPanelPoll classData={classData} height="40px" /> }

            <Flex
				style={{
					height: canSeePoll ? "calc(100% - 40px)" : "100%",
				}}
			>
				<Menu
                    selectedKeys={[currentMenu]}
					defaultOpenKeys={["sub1"]}
					mode="inline"
					inlineCollapsed={isMobileDevice}
                    items={visibleMenuItems.map((item: MenuItem) => ({
                        ...item,
                        icon: item.key === currentMenu ? item.selectedicon : item.deselectedicon,
                    }))}
					theme={isDark ? "dark" : "light"}
					style={{
						height: "100%",
						minWidth: isMobileDevice ? "80px" : "250px",
						maxWidth: isMobileDevice ? "80px" : "250px",
						padding: "0 10px",
						paddingTop: "15px",
					}}
                    className={settings.accessibility.disableAnimations ? "" : "animMenu"}
					styles={{
						itemIcon: {
							marginRight: "18px",
						},
					}}
					onClick={(e) => openMenu(e.key)}
				/>

				<Flex
					style={{
						position: "absolute",
						bottom: "30px",
						left: "10px",
						gap: "10px",
						width: isMobileDevice ? "60px" : "230px",
					}}
					vertical
				>
					{
                        classData?.timer?.startTime ? (
                            <Card styles={{body: {padding: '10px'}}}>
                                <Flex align="center" justify="space-evenly" gap={10} vertical={isMobileDevice}>
                                    <Progress
                                        type="dashboard"
                                        percent={Math.round(timerPercent)}
                                        
                                        format={() => formatTime(timerRemainingSeconds)}
                                        strokeColor={{
                                            '0%': 'rgb(94, 158, 230)',
                                            '100%': 'rgba(41, 96, 167, 0.9)',
                                        }}
                                        strokeWidth={15}
                                        gapDegree={50}
                                        size={isMobileDevice ? 40 : 75}
                                    />
                                    {isMobileDevice ? null : <Text>{formatTime(timerDurationSeconds)} Timer</Text>}
                                </Flex>

								{
									canControlTimer && (
										<Flex gap={isMobileDevice ? 5 : 10} style={{marginTop: 10}} align="center" justify="center" vertical={isMobileDevice}>
											<Button variant="solid" color={classData?.timer.active ? "red" : "green"} style={{marginTop: 10, width: '100%'}}
												onClick={() => {
													if (!classData || !canControlTimer) return;
													if (classData.timer.active) {
														// Pause timer
														pauseTimer(classData.id)
														.then((res) => {
															if (!res.ok) {
																throw new Error("Failed to pause timer");
															}
															Log({message: "Timer paused:", data: res.data});
														})
														.catch((err) => {
															Log({message: "Error pausing timer:", data: err, level: 'error'});
														});
													} else {
														// Resume timer
														resumeTimer(classData.id)
														.then((res) => {
															if (!res.ok) {
																throw new Error("Failed to resume timer");
															}
															Log({message: "Timer resumed:", data: res.data});
														})
														.catch((err) => {
															Log({message: "Error resuming timer:", data: err, level: 'error'});
														});
													}
												}}
											>
												{
													classData?.timer.active ? (
														isMobileDevice ? <IonIcon icon={IonIcons.pause} /> : "Pause"
													) : (
														isMobileDevice ? <IonIcon icon={IonIcons.play} /> : "Resume"
													)
												}
											</Button>
											<Button variant="solid" color="red" style={{marginTop: 10, width: '100%'}}
												onClick={() => {
													if (!classData || !canControlTimer) return;
													// Clear timer
													alarmData.stop();
													clearTimer(classData.id)
													.then((res) => {
														if (!res.ok) {
															throw new Error("Failed to clear timer");
														}
														Log({message: "Timer cleared:", data: res.data});
													})
													.catch((err) => {
														Log({message: "Error clearing timer:", data: err, level: 'error'});
													});
												}}
											>
												{
													isMobileDevice ? <IonIcon icon={IonIcons.trash} /> : "Clear"
												}
											</Button>
										</Flex>
									)
								}
                            </Card>
                        ) : null
                    }

                    <PollModal
                        open={showPollDetails}
                        onCancel={() => setShowPollDetails(false)}
                        prompt={classData?.poll?.prompt || ""}
                        answers={classData?.poll?.responses || []}
                        allowVoteChanges={classData?.poll?.allowVoteChanges || false}
                        allowTextResponses={classData?.poll?.allowTextResponses || false}
                        blind={classData?.poll?.blind || false}
						blindUntilEnded={classData?.poll?.blindUntilEnded || false}
						autoEndTimer={classData?.poll?.autoEndTimer ?? null}
						autoEndThreshold={classData?.poll?.autoEndThreshold ?? null}
                        allowMultipleResponses={classData?.poll?.allowMultipleResponses || false}
                        readOnly
                    />

					{/* 2x2 grid of buttons (Ant Design Row/Col) */}
					<div style={{ width: isMobileDevice ? '60px' : '230px', marginTop: 8 }}>
						<Row gutter={[8, 8]}>
							<Col span={12} style={isMobileDevice ? mobileButtonColStyle : undefined}>
                                <Button
                                    disabled={!classData || classData.poll && !classData.poll.status || !canSeePoll}
                                    color="blue"
                                    variant="solid"
                                    style={buttonStyle}
                                    styles={{
                                        content: {
                                            width: '100%',
                                            whiteSpace: 'break-spaces',
                                            overflow: 'hidden',
                                            textOverflow: 'clip',
                                            fontSize: isMobileDevice ? '18px' : undefined,
                                        }
                                    }}
                                    onClick={() => setShowPollDetails(true)}
                                >
                                    Poll Details
                                </Button>
							</Col>
							<Col span={12} style={isMobileDevice ? mobileButtonColStyle : undefined}>
                                <Button
                                    disabled={!classData?.poll || !classData?.poll.status || !canEndPoll}
                                    color="pink"
                                    variant="solid"
                                    style={buttonStyle}
                                    styles={{
                                        content: {
                                            width: '100%',
                                            whiteSpace: 'break-spaces',
                                            overflow: 'hidden',
                                            textOverflow: 'clip',
                                            fontSize: isMobileDevice ? '18px' : undefined,
                                        }
                                    }}
                                    onClick={() => {
                                        endPoll(classData!.id)
                                        .then((res) => {
                                            if (!res.ok) {
                                                throw new Error("Failed to end poll");
                                            }
                                            Log({message: "Poll ended:", data: res.data});
                                        })
                                        .catch((err) => {
                                            Log({message: "Error ending poll:", data: err, level: 'error'});
                                        });
                                    }}
                                >
                                    End Poll
                                </Button>
							</Col>
							<Col span={12} style={isMobileDevice ? mobileButtonColStyle : undefined}>
                                <Button
                                    disabled={!classData || classData.poll && classData.poll.responses.length === 0 || !canClearPoll}
                                    color="orange"
                                    variant="solid"
                                    style={buttonStyle}
                                    styles={{
                                        content: {
                                            width: '100%',
                                            whiteSpace: 'break-spaces',
                                            overflow: 'hidden',
                                            textOverflow: 'clip',
                                            fontSize: isMobileDevice ? '18px' : undefined,
                                        }
                                    }}
                                    onClick={() => {
                                        clearCurrentPoll(classData!.id)
                                        .then((res) => {
                                            if (!res.ok) {
                                                throw new Error("Failed to clear polls");
                                            }
                                            Log({message: "Polls cleared:", data: res.data});
                                        })
                                        .catch((err) => {
                                            Log({message: "Error clearing polls:", data: err, level: 'error'});
                                        });
                                    }}
                                >
                                    Clear Poll
                                </Button>
                            </Col>
							<Col span={12} style={isMobileDevice ? mobileButtonColStyle : undefined}>
								<Button
									color={classData?.isActive ? "red" : "green"}
									variant="solid"
									style={buttonStyle}
									styles={{
										content: {
											width: '100%',
											whiteSpace: 'break-spaces',
											overflow: 'hidden',
											textOverflow: 'clip',
											fontSize: isMobileDevice ? '18px' : undefined,
										}
									}}
									disabled={!canToggleClassSession}
									onClick={() => {classData?.isActive ? endClass() : startClass()}}
								>
									{classData?.isActive ? "End Class" : "Start Class"}
								</Button>
							</Col>
						</Row>
					</div>
				</Flex>

                

				<div
					style={{
						height: "100%",
						width: isMobileDevice ? "calc(100% - 80px)" : "calc(100% - 250px)",
					}}
				>
					<Activity mode={currentMenu == "1" ? "visible" : "hidden"}>
						<Dashboard
							openModalId={openModalId}
							setOpenModalId={setOpenModalId}
						/>
					</Activity>
					<Activity mode={currentMenu == "2" ? "visible" : "hidden"}>
						<PollsMenu
							openModalId={openModalId}
							setOpenModalId={setOpenModalId}
							onLoadPollIntoEditor={loadPollIntoEditor}
						/>
					</Activity>
					<Activity mode={currentMenu == "3" ? "visible" : "hidden"}>
						<TimerPage />
					</Activity>
					<Activity mode={currentMenu == "4" ? "visible" : "hidden"}>
						<Statistics />
					</Activity>
					<Activity mode={currentMenu == "5" ? "visible" : "hidden"}>
						<RolesMenu />
					</Activity>
					<Activity mode={currentMenu == "6" ? "visible" : "hidden"}>
						<SettingsMenu />
					</Activity>
					<Activity mode={currentMenu == "7" ? "visible" : "hidden"}>
						<PollEditorMenu initialPoll={pollEditorSeed} />
					</Activity>
				</div>
			</Flex>
		</>
	);
}

const buttonStyle = {
    width: '100%',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    height: 'unset'
}

const mobileButtonColStyle = {
    maxWidth: "100%",
    width: "100%",
    flex: "1 1 auto",
    aspectRatio: "unset",
}
