import {
	Menu,
	Flex,
	Col,
	Row,
	Typography,
	Card,
	Statistic,
	Splitter,
	Button,
	Tooltip,
} from "antd";
const { Title } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useClassData, useTheme } from "../main";
import { Activity, useEffect, useState, useRef } from "react";

import Dashboard from "../components/ControlPanel/Dashboard";
import PollsMenu from "../components/ControlPanel/PollsMenu";
import SettingsMenu from "../components/ControlPanel/SettingsMenu";
import PermissionsMenu from "../components/ControlPanel/PermissionsMenu";
import ClassroomPage from "../components/ControlPanel/ClassroomPage";

import { themeColors } from "../../themes/ThemeConfig";
import { socket } from "../socket";
import Log from "../debugLogger";
import ControlPanelPoll from "../components/BarPoll";
import Statistics from "../components/ControlPanel/StatisticsPage";

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
	// {
	// 	key: "3",
	// 	icon: <IonIcon icon={IonIcons.timerOutline} />,
	// 	deselectedicon: <IonIcon icon={IonIcons.timerOutline} />,
	// 	selectedicon: <IonIcon icon={IonIcons.timer} />,
	// 	label: "Timer",
	// },
	{
		key: "4",
		icon: <IonIcon icon={IonIcons.statsChartOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.statsChartOutline} />,
		selectedicon: <IonIcon icon={IonIcons.statsChart} />,
		label: "Statistics",
	},
	// {
	// 	key: "5",
	// 	icon: <IonIcon icon={IonIcons.lockClosedOutline} />,
	// 	deselectedicon: <IonIcon icon={IonIcons.lockClosedOutline} />,
	// 	selectedicon: <IonIcon icon={IonIcons.lockClosed} />,
	// 	label: "Permissions",
	// },
	// {
	// 	key: "6",
	// 	icon: <IonIcon icon={IonIcons.settingsOutline} />,
	// 	deselectedicon: <IonIcon icon={IonIcons.settingsOutline} />,
	// 	selectedicon: <IonIcon icon={IonIcons.settings} />,
	// 	label: "Settings & Links",
	// }
];

export default function ControlPanel() {
	const { classData, setClassData } = useClassData();

	const statsPanelRef = useRef<HTMLDivElement>(null);
	const [panelWidth, setPanelWidth] = useState(480);

	useEffect(() => {
		const panel = statsPanelRef.current;
		if (!panel) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setPanelWidth(entry.contentRect.width);
			}
		});

		resizeObserver.observe(panel);
		return () => resizeObserver.disconnect();
	}, []);

	const isSingleColumn = panelWidth < 380;

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
		setClassActive(true);
	}

	function endClass() {
		socket?.emit("endClass");
		setClassActive(false);
	}

	// Keep `classActive` synced with incoming `classData.isActive` updates
	useEffect(() => {
		setClassActive(!!classData?.isActive);
	}, [classData?.isActive]);

	const infoDivs = {
		background: isDark
			? themeColors.dark.information.background
			: themeColors.light.information.background,
	};

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
					inlineCollapsed={false}
					items={menuItems}
					theme={isDark ? "dark" : "light"}
					style={{
						height: "100%",
						minWidth: "250px",
						maxWidth: "250px",
						padding: "0 10px",
						paddingTop: "15px",
					}}
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
						width: "230px",
					}}
					vertical
				>
					<Activity mode={classActive ? "hidden" : "visible"}>
						<Button
							color="green"
							variant="solid"
							type="default"
							onClick={startClass}
						>
							Start Class
						</Button>
					</Activity>

					<Activity mode={classActive ? "visible" : "hidden"}>
						<Button
							color="red"
							variant="solid"
							type="default"
							onClick={endClass}
						>
							End Class
						</Button>
					</Activity>

					<Button
						variant="outlined"
						type="default"
						onClick={() => socket.emit("classUpdate", "")}
					>
						Update
					</Button>
				</Flex>

				<div
					style={{
						padding: "20px",
						height: "100%",
						width: "calc(100% - 250px)",
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
						<div>Timer Menu</div>
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
				</div>
			</Flex>
		</>
	);
}
