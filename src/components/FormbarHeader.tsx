import { Button, Flex, Tooltip, Popconfirm } from "antd";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useNavigate } from "react-router-dom";
import Log from "../debugLogger";

import { useMobileDetect, useTheme, useUserData } from "../main";
import { themeColors, version } from "../../themes/ThemeConfig";

import pages from "../pages";
import { accessToken, formbarUrl, socket } from "../socket";

export default function FormbarHeader() {
	const { isDark, toggleTheme } = useTheme();
	const navigate = useNavigate();
	const isMobileView = useMobileDetect();
	const { userData } = useUserData();

	const headerStyles = {
		...styles.formbarHeader,
		background: isDark
			? themeColors.dark.header.background
			: themeColors.light.header.background,
	};

	const primaryTextColor = isDark
		? themeColors.dark.text.primary
		: themeColors.light.text.primary;

	const secondaryTextColor = isDark
		? themeColors.dark.text.secondary
		: themeColors.light.text.secondary;

	// Sort pages alphabetically by pageName
	const sortedPages = [...pages].sort((a, b) =>
		(a.pageName ?? "")
			.toLowerCase()
			.localeCompare((b.pageName ?? "").toLowerCase()),
	);

	function logoutHandler() {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
		socket?.disconnect();
		navigate("/login");
	}

	function leaveClass() {
		if (!userData || !userData.activeClass) {
			navigate("/classes");
			return;
		}
		const confirmLeave = window.confirm(
			"Are you sure you want to leave the current class?",
		);
		if (!confirmLeave) return;

		fetch(`${formbarUrl}/api/v1/class/${userData?.activeClass}/leave`, {
			method: "POST",
			headers: {
				Authorization: `${accessToken}`,
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "Left class", data });
				navigate("/classes");
			})
			.catch((err) => {
				Log({
					message: "Error leaving class",
					data: err,
					level: "error",
				});
			});
	}

	return (
		<Flex
			style={headerStyles}
			align="center"
			className="formbarHeader"
			justify="space-between"
			gap="16"
		>
			{isMobileView ? (
				<Flex align="center" justify="center">
					<Tooltip
						title={
							<span>
								Formbar{" "}
								<span
									style={{
										marginLeft: "4px",
										fontWeight: "600",
									}}
								>
									v{version}
								</span>
							</span>
						}
						placement="bottomLeft"
						arrow={{ pointAtCenter: true }}
						color="purple"
					>
						<img
							src="/img/FormbarLogo-Circle.png"
							alt="Formbar Logo"
							style={{
								height: 40,
								filter: "drop-shadow(0 0 5px rgba(0,0,0,0.5))",
							}}
						/>
					</Tooltip>
				</Flex>
			) : (
				<h1
					style={{
						...styles.formbarHeader.text,
						color: primaryTextColor,
						cursor: "pointer",
					}}
					onClick={() => navigate("/")}
				>
					Formbar
				</h1>
			)}
			<Flex align="center" justify="center" gap={10}>
				{userData &&
				userData.activeClass &&
				userData.classPermissions &&
				userData.classPermissions < 4 ? (
					<Tooltip
						placement="bottomRight"
						title={"Back to Class"}
						arrow={{ pointAtCenter: true }}
						color="red"
					>
						<Button
							type="primary"
							variant="solid"
							color="red"
							size="large"
							style={styles.headerButton}
							onClick={() => navigate(`/student`)}
						>
							<IonIcon icon={IonIcons.pieChart} size="large" />
						</Button>
					</Tooltip>
				) : userData &&
				  userData.activeClass &&
				  userData.classPermissions &&
				  userData.classPermissions >= 4 ? (
					<Tooltip
						placement="bottomRight"
						title={"Teacher Panel"}
						arrow={{ pointAtCenter: true }}
						color="pink"
					>
						<Button
							type="primary"
							variant="solid"
							color="pink"
							size="large"
							style={styles.headerButton}
							onClick={() => navigate("/panel")}
						>
							<IonIcon icon={IonIcons.pieChart} size="large" />
						</Button>
					</Tooltip>
				) : null}

				{userData &&
					userData.permissions &&
					userData.permissions >= 4 && (
						<Tooltip
							placement="bottomRight"
							title={"Manager Panel"}
							arrow={{ pointAtCenter: true }}
							color="cyan"
						>
							<Button
								type="primary"
								variant="solid"
								color="cyan"
								size="large"
								style={styles.headerButton}
								onClick={() => navigate("/manager")}
							>
								<IonIcon
									icon={IonIcons.briefcase}
									size="large"
								/>
							</Button>
						</Tooltip>
					)}

				<Tooltip
					placement="bottomRight"
					title={"Classes"}
					arrow={{ pointAtCenter: true }}
					color="blue"
				>
					<Button
						type="primary"
						variant="solid"
						color="blue"
						size="large"
						style={styles.headerButton}
						onClick={leaveClass}
					>
						<IonIcon icon={IonIcons.easel} size="large" />
					</Button>
				</Tooltip>

				<div
					style={{
						borderRight: `2px solid ${isDark ? "#fff3" : "#0003"}`,
						borderRadius: "999px",
						height: "30px",
					}}
				/>

				<Tooltip
					placement="bottomRight"
					title={isDark ? "Light Mode" : "Dark Mode"}
					arrow={{ pointAtCenter: true }}
					color={isDark ? "#aac" : "#222"}
				>
					<Button
						variant="solid"
						onClick={toggleTheme}
						size="large"
						style={{
							...styles.headerButton,
							backgroundColor: isDark ? "#aac" : "#222",
							color: isDark ? "#222" : "#ddd",
						}}
					>
						<IonIcon
							icon={isDark ? IonIcons.sunny : IonIcons.moon}
							size="large"
						/>
					</Button>
				</Tooltip>

				<Tooltip
					placement="bottomRight"
					title="Profile"
					arrow={{ pointAtCenter: true }}
					color="purple"
				>
					<Button
						type="primary"
						variant="solid"
						color="purple"
						size="large"
						style={styles.headerButton}
						onClick={() => navigate("/profile")}
					>
						<IonIcon icon={IonIcons.person} size="large" />
					</Button>
				</Tooltip>

				<Tooltip
					placement="bottomRight"
					title="Log Out"
					arrow={{ pointAtCenter: true }}
					color="magenta"
				>
					<Popconfirm
						placement="bottomRight"
						title={"Wait! Are you sure you would like to log out?"}
						icon={
							<IonIcon
								icon={IonIcons.alertCircle}
								color="red"
								size="large"
								style={{ marginRight: "4px", marginTop: "3px" }}
							/>
						}
						cancelText={"No"}
						okText={"Yes"}
						okType="danger"
						onConfirm={() => {
							logoutHandler();
						}}
					>
						<Button
							type="primary"
							variant="solid"
							color="magenta"
							size="large"
							style={styles.headerButton}
						>
							<IonIcon icon={IonIcons.logOut} size="large" />
						</Button>
					</Popconfirm>
				</Tooltip>
			</Flex>
		</Flex>
	);
}

const styles = {
	formbarHeader: {
		position: "absolute" as "absolute",
		top: 0,
		left: 0,
		width: "100%",
		height: "64px",
		padding: "0 32px",

		zIndex: 2,

		borderBottom: "3px solid #00000050",

		background: "linear-gradient(90deg, #1CB5E0 0%, #000851 100%)",

		text: {
			fontSize: "36px",
			position: "relative" as "relative",
			color: "white",
		},

		version: {
			fontSize: "18px",
			marginTop: "auto",
			marginBottom: "5px",
			marginLeft: "8px",
			fontWeight: "300" as "300",
			color: "#ffffffaa",
		},
	},

	headerButton: {
		border: "none",
		padding: "0 20px",
		boxShadow: "0 2px 0px rgba(0,0,0,0.2)",
	},

	headerButtonHover: {
		filter: "brightness(1.1)",
	},
};
