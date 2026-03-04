import { Button, Flex, Tooltip, Popconfirm } from "antd";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useNavigate } from "react-router-dom";
import Log from "../debugLogger";

import { isDev, useMobileDetect, useTheme, useUserData } from "../main";
import { themeColors, version } from "../../themes/ThemeConfig";

import { accessToken, formbarUrl, socket } from "../socket";

export default function FormbarHeader() {
	const { isDark, toggleTheme } = useTheme();
	const navigate = useNavigate();
	const isMobileView = useMobileDetect();
	const { userData, setUserData } = useUserData();

	const headerBg = isDark
		? themeColors.dark.header.background
		: themeColors.light.header.background;

	const headerBorder = isDark
		? themeColors.dark.header.border
		: themeColors.light.header.border;

	const primaryTextColor = isDark
		? themeColors.dark.text.primary
		: themeColors.light.text.primary;

	function logoutHandler() {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
		socket?.disconnect();
        setUserData(null);
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

	const headerStyles: React.CSSProperties = {
		position: "absolute",
		top: 0,
		left: 0,
		width: "100%",
		height: "64px",
		padding: "0 20px",
		zIndex: 100,
		background: headerBg,
		backdropFilter: "blur(20px)",
		WebkitBackdropFilter: "blur(20px)",
		borderBottom: `1px solid ${headerBorder}`,
		boxShadow: isDark
			? "0 1px 32px rgba(0,0,0,0.35)"
			: "0 1px 24px rgba(0,0,0,0.08)",
	};

	return (
		<Flex
			style={headerStyles}
			align="center"
			className="formbarHeader"
			justify="space-between"
			gap="12"
		>
			{/* Left side: Logo / Brand */}
			{isMobileView ? (
				<Flex align="center" justify="center">
					<Tooltip
						title={
							<span>
								Formbar{" "}
								<span style={{ marginLeft: "4px", fontWeight: "600" }}>
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
								height: 38,
								filter: "drop-shadow(0 0 8px rgba(59,130,246,0.5))",
								cursor: "pointer",
							}}
							onClick={() => navigate("/")}
						/>
					</Tooltip>
				</Flex>
			) : (
				<Flex align="center" gap={10} style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
					<img
						src="/img/FormbarLogo-Circle.png"
						alt="Formbar Logo"
						style={{
							height: 36,
							filter: "drop-shadow(0 0 8px rgba(59,130,246,0.45))",
						}}
					/>
					<span style={styles.brandText(isDark, primaryTextColor)}>
						Formbar
					</span>
					<span style={styles.versionBadge(isDark)}>v{version}</span>
				</Flex>
			)}

			{/* Right side: Action buttons */}
			<Flex align="center" justify="center" gap={6}>
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
								<IonIcon icon={IonIcons.briefcase} size="large" />
							</Button>
						</Tooltip>
					)}

				{userData && (
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
				)}

				{userData && (
					<div style={styles.divider(isDark)} />
				)}

				<Tooltip
					placement="bottomRight"
					title={isDark ? "Light Mode" : "Dark Mode"}
					arrow={{ pointAtCenter: true }}
					color={isDark ? "#334155" : "#1e293b"}
				>
					<Button
						variant="solid"
						onClick={toggleTheme}
						size="large"
						style={{
							...styles.headerButton,
							background: isDark
								? "rgba(255,255,255,0.1)"
								: "rgba(0,0,0,0.07)",
							color: isDark ? "#e2e8f0" : "#334155",
							border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
						}}
					>
						<IonIcon
							icon={isDark ? IonIcons.sunny : IonIcons.moon}
							size="large"
						/>
					</Button>
				</Tooltip>

				{userData && (
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
				)}

                { isDev && (
                    <Tooltip
                        placement="bottomRight"
                        title="Testing"
                        arrow={{ pointAtCenter: true }}
                        color="geekblue"
                    >
                        <Button
                            type="primary"
                            variant="solid"
                            color="geekblue"
                            size="large"
                            style={styles.headerButton}
                            onClick={() => navigate("/testing")}
                        >
                            <IonIcon icon={IonIcons.bug} size="large" />
                        </Button>
                    </Tooltip>
                )}

				{userData && (
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
				)}
			</Flex>
		</Flex>
	);
}

const styles = {
	brandText: (_isDark: boolean, color: string): React.CSSProperties => ({
		fontSize: "22px",
		fontWeight: 700,
		color: color,
		letterSpacing: "-0.01em",
		userSelect: "none",
	}),

	versionBadge: (isDark: boolean): React.CSSProperties => ({
		fontSize: "11px",
		fontWeight: 600,
		padding: "2px 7px",
		borderRadius: "999px",
		background: isDark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.12)",
		color: isDark ? "#93c5fd" : "#2563eb",
		border: isDark ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(37,99,235,0.2)",
		letterSpacing: "0.02em",
		alignSelf: "center",
		marginTop: "2px",
	}),

	divider: (isDark: boolean): React.CSSProperties => ({
		width: "1px",
		height: "28px",
		borderRadius: "999px",
		background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
		margin: "0 2px",
	}),

	headerButton: {
		border: "none",
		width: "42px",
		height: "42px",
		padding: "0",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: "10px",
		flexShrink: 0,
	} as React.CSSProperties,
};
