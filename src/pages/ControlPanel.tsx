import {
	Menu,
	Flex,
	Button,
    Tooltip,
} from "antd";
import FormbarHeader from "../components/FormbarHeader";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useClassData, useSettings, useTheme, useUserData } from "../main";
import { Activity, useEffect, useState } from "react";

import Dashboard from "../components/ControlPanel/Dashboard";
import PollsMenu from "../components/ControlPanel/PollsMenu";
import SettingsMenu from "../components/ControlPanel/SettingsMenu";
import PermissionsMenu from "../components/ControlPanel/PermissionsMenu";
import PollEditorMenu from "../components/ControlPanel/PollEditorMenu";

import { accessToken, formbarUrl, socket } from "../socket";
import Log from "../debugLogger";
import ControlPanelPoll from "../components/BarPoll";
import Statistics from "../components/ControlPanel/StatisticsPage";

import { isMobile } from "../main";
import { useNavigate } from "react-router-dom";
import TimerPage from "../components/ControlPanel/TimerPage";

const items = [
	{
		key: "1",
		icon: <IonIcon icon={IonIcons.pieChart} />,
		deselectedicon: <IonIcon icon={IonIcons.pieChartOutline} />,
		selectedicon: <IonIcon icon={IonIcons.pieChart} />,
		label: "Dashboard",
	},
	{
		key: "2",
		icon: <IonIcon icon={IonIcons.barChartOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.barChartOutline} />,
		selectedicon: <IonIcon icon={IonIcons.barChart} />,
		label: "Polls",
	},
	{
		key: "7",
		icon: <IonIcon icon={IonIcons.pencilOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.pencilOutline} />,
		selectedicon: <IonIcon icon={IonIcons.pencil} />,
		label: "Poll Editor",
	},
	{
		key: "3",
		icon: <IonIcon icon={IonIcons.timerOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.timerOutline} />,
		selectedicon: <IonIcon icon={IonIcons.timer} />,
		label: "Timer",
	},
	{
		key: "4",
		icon: <IonIcon icon={IonIcons.statsChartOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.statsChartOutline} />,
		selectedicon: <IonIcon icon={IonIcons.statsChart} />,
		label: "Statistics",
	},
	{
		key: "5",
		icon: <IonIcon icon={IonIcons.lockClosedOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.lockClosedOutline} />,
		selectedicon: <IonIcon icon={IonIcons.lockClosed} />,
		label: "Permissions",
	},
	{
		key: "6",
		icon: <IonIcon icon={IonIcons.settingsOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.settingsOutline} />,
		selectedicon: <IonIcon icon={IonIcons.settings} />,
		label: "Settings",
	}
];

export default function ControlPanel() {
	const { classData, setClassData } = useClassData();
	const isMobileDevice = isMobile();

    const { settings } = useSettings();

	useEffect(() => {
		if (!socket) return; // Don't set up listener if socket isn't ready

		function classUpdate(classData: any) {
			setClassData(classData);
			Log({
				message: "Class Update received.",
				data: classData,
				level: "info",
			});

			Log({
				message: "Total Voters: " + classData.poll.totalResponders,
				level: "info",
			});
		}

		socket.on("classUpdate", classUpdate);

		socket.emit("classUpdate", "");
		return () => {
			socket.off("classUpdate", classUpdate);
		};
	}, [socket, setClassData]);

	const { isDark } = useTheme();

	const { userData } = useUserData();
	const navigate = useNavigate();

	const [currentMenu, setCurrentMenu] = useState("1");
	const [menuItems, setMenuItems] = useState(items);
	const [openModalId, setOpenModalId] = useState<number | null>(null);

	const [classActive, setClassActive] = useState<boolean>(
		() => !!classData?.isActive,
	);
	//const [allStudents, setAllStudents] = useState<Student[]>(students);

	function startClass() {
		socket?.emit("startClass");
		socket?.emit("classUpdate", "");
	}

	function endClass() {
		socket?.emit("endClass");
		setClassActive(false);
	}

	// Keep `classActive` synced with incoming `classData.isActive` updates
	useEffect(() => {
		setClassActive(!!classData?.isActive);
	}, [classData?.isActive]);

	function openMenu(key: string) {
		if (key === currentMenu) return;
		setCurrentMenu(key);

		const updatedItems = menuItems.map((item) => {
			if (item && item.key === key && "icon" in item) {
				// Set selected icon
				return { ...item, icon: item.selectedicon };
			} else if (item && "icon" in item) {
				// Set deselected icon
				return { ...item, icon: item.deselectedicon };
			}
			return item;
		});
		setMenuItems(updatedItems);
	}

	useEffect(() => {
		if (!userData) return;

		if (!userData.activeClass) {
			navigate("/classes");
		}

		if (userData.classPermissions && userData.classPermissions <= 2) {
			navigate("/student");
		}

	}, [userData, navigate]);

	return (
		<>
			<FormbarHeader />

			<ControlPanelPoll classData={classData} height="40px" />

			<Flex
				style={{
					height: "calc(100% - 40px)",
				}}
			>
				<Menu
					defaultSelectedKeys={["1"]}
					defaultOpenKeys={["sub1"]}
					mode="inline"
					inlineCollapsed={isMobileDevice}
					items={menuItems}
					theme={isDark ? "dark" : "light"}
					style={{
						height: "100%",
						minWidth: isMobileDevice ? "80px" : "250px",
						maxWidth: isMobileDevice ? "80px" : "250px",
						padding: "0 10px",
						paddingTop: "15px",
					}}
                    className={settings.disableAnimations ? "" : "animMenu"}
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
					<Activity mode={classActive ? "hidden" : "visible"}>
                        <Tooltip title={isMobileDevice ? "Start Class" : ""} mouseOverDelay={0.5} placement='right' color="green">
                            <Button
                                color="green"
                                variant="solid"
                                type="default"
                                onClick={startClass}
                            >
                                    {
                                        isMobileDevice ? (<Flex align="center" justify="center" gap={5}><IonIcon icon={IonIcons.easel} /> <IonIcon icon={IonIcons.play} /></Flex>) : "Start Class"
                                    }
                            </Button>
                        </Tooltip>
					</Activity>

					<Activity mode={classActive ? "visible" : "hidden"}>
                        <Tooltip title={isMobileDevice ? "End Class" : ""} mouseOverDelay={0.5} placement='right' color="red">
                            <Button
                                color="red"
                                variant="solid"
                                type="default"
                                onClick={endClass}
                            >
                                    {
                                        isMobileDevice ? (<Flex align="center" justify="center" gap={5}><IonIcon icon={IonIcons.easel} /> <IonIcon icon={IonIcons.stop} /></Flex>) : "End Class"
                                    }
                            </Button>
                        </Tooltip>
					</Activity>

                    {
                        classData?.poll.status && (
                            <Tooltip title={isMobileDevice ? "End Poll" : ""} mouseOverDelay={0.5} placement='right' color="red">
                                <Button
                                    color="red"
                                    variant="solid"
                                    type="default"
                                    onClick={() => {
                                        fetch(`${formbarUrl}/api/v1/class/${classData?.id}/polls/end`, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                "Authorization": `${accessToken}`,
                                            },
                                        })
                                        .then((res) => {
                                            if (!res.ok) {
                                                throw new Error("Failed to end poll");
                                            }
                                            return res.json();
                                        })
                                        .then((data) => {
                                            console.log("Poll ended:", data);
                                        })
                                        .catch((err) => {
                                            console.error("Error ending poll:", err);
                                        });
                                    }}
                                >
                                    {
                                        isMobileDevice ? (<Flex align="center" justify="center" gap={5}><IonIcon icon={IonIcons.pieChart} /> <IonIcon icon={IonIcons.stop} /></Flex>) : "End Poll"
                                    }
                                </Button>
                            </Tooltip>
                        )
                    }

                    {
                        classData?.poll.prompt && (
                            <Tooltip title={isMobileDevice ? "Clear Poll" : ""} placement='right' mouseOverDelay={0.5} color="red">
                                <Button
                                    color="red"
                                    variant="solid"
                                    type="default"
                                    onClick={() => {
                                        fetch(`${formbarUrl}/api/v1/class/${classData?.id}/polls/clear`, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                "Authorization": `${accessToken}`,
                                            },
                                        })
                                        .then((res) => {
                                            if (!res.ok) {
                                                throw new Error("Failed to clear polls");
                                            }
                                            return res.json();
                                        })
                                        .then((data) => {
                                            console.log("Polls cleared:", data);
                                        })
                                        .catch((err) => {
                                            console.error("Error clearing polls:", err);
                                        });
                                    }}
                                >
                                    {
                                        isMobileDevice ? (<Flex align="center" justify="center" gap={5}><IonIcon icon={IonIcons.trash} /> <IonIcon icon={IonIcons.stop} /></Flex>) : "Clear Poll"
                                    }
                                </Button>
                            </Tooltip>
                        )
                    }
				</Flex>

				<div
					style={{
						padding: "20px",
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
						/>
					</Activity>
					<Activity mode={currentMenu == "3" ? "visible" : "hidden"}>
						<TimerPage />
					</Activity>
					<Activity mode={currentMenu == "4" ? "visible" : "hidden"}>
						<Statistics />
					</Activity>
					<Activity mode={currentMenu == "5" ? "visible" : "hidden"}>
						<PermissionsMenu />
					</Activity>
					<Activity mode={currentMenu == "6" ? "visible" : "hidden"}>
						<SettingsMenu />
					</Activity>
					<Activity mode={currentMenu == "7" ? "visible" : "hidden"}>
						<PollEditorMenu />
					</Activity>
				</div>
			</Flex>
		</>
	);
}
