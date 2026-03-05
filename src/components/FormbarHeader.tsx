import { Button, Flex, Tooltip, Popconfirm, Modal } from "antd";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useNavigate } from "react-router-dom";
import Log from "../debugLogger";

import { isDev, useMobileDetect, useTheme, useUserData } from "../main";
import { themeColors, version } from "../../themes/ThemeConfig";

import { accessToken, formbarUrl, socket } from "../socket";
import { useState } from "react";
import SettingsModal from "./SettingsModal";

export default function FormbarHeader() {
	const { isDark, toggleTheme } = useTheme();
	const navigate = useNavigate();
	const isMobileView = useMobileDetect();
	const { userData, setUserData } = useUserData();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [leaveClassModalOpen, setLeaveClassModalOpen] = useState(false);

	const headerStyles = {
		...styles.formbarHeader,
		background: isDark
			? themeColors.dark.header.background
			: themeColors.light.header.background,
        padding: isMobileView ? "0 16px" : "0 32px",
	};

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
			justify={isMobileView ? "center": "space-between"}
			gap="16"
		>
			{!isMobileView && (
                <>
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
                {/* <Badge count={1} size="small">
                    <Button style={{marginLeft: 10}} type="primary" shape="square" variant="solid" color="default" size="large"
                        onClick={() => navigate("/profile")}
                    >
                        <IonIcon icon={IonIcons.notifications} size="large" />
                    </Button>
                </Badge> */}
                </>
			)}
			<Flex align="center" justify="center" gap={10}>
                { isDev && (<>
                    <Tooltip
                        mouseEnterDelay={0.5}
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
                    <div
					style={{
						borderRight: `2px solid ${isDark ? "#fff3" : "#0003"}`,
						borderRadius: "999px",
						height: "30px",
					}}
                    />
                    </>
                )}

				{userData &&
				userData.activeClass &&
				userData.classPermissions &&
				userData.classPermissions < 4 ? (
					<Tooltip
                        mouseEnterDelay={0.5}
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
                        mouseEnterDelay={0.5}
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
                            mouseEnterDelay={0.5}
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

				{userData && (<>
					<Tooltip
                        mouseEnterDelay={0.5}
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
							onClick={() => userData.activeClass ? setLeaveClassModalOpen(true) : navigate("/classes")}
						>
							<IonIcon icon={IonIcons.easel} size="large" />
						</Button>
					</Tooltip>

                    <Modal title="Leave Class" centered open={leaveClassModalOpen} onCancel={() => setLeaveClassModalOpen(false)} onOk={() => {setLeaveClassModalOpen(false); leaveClass()}} okText="Leave" cancelText="Cancel">
                        Are you sure you want to leave your current class session?
                    </Modal>

				</>)}

				{
                
                userData && (<div
					style={{
						borderRight: `2px solid ${isDark ? "#fff3" : "#0003"}`,
						borderRadius: "999px",
						height: "30px",
					}}
				/>)}

				<Tooltip
                    mouseEnterDelay={0.5}
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

				{userData && (
					<Tooltip
                        mouseEnterDelay={0.5}
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

                <Tooltip
                    mouseEnterDelay={0.5}
                    placement="bottomRight"
                    title="Settings"
                    arrow={{ pointAtCenter: true }}
                    color="volcano"
                >
                    <Button
                        type="primary"
                        variant="solid"
                        color="volcano"
                        size="large"
                        style={styles.headerButton}
                        onClick={() => setSettingsOpen(true)}
                    >
                        <IonIcon icon={IonIcons.settings} size="large" />
                    </Button>
                </Tooltip>

				{userData && (
					<Tooltip
                        mouseEnterDelay={0.5}
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

            <Modal
                children={<SettingsModal />}
                open={settingsOpen}
                centered
                closable={false}
                onCancel={() => {setSettingsOpen(false)}}
                footer={null}
                height={700}
                width={window.innerWidth / 1.5}
                styles={{
                    container: {
                        padding: 0,
                        overflow: "hidden",
                        height: "700px",
                    },
                    body: {
                        padding: 0,
                        height: "100%",
                    }
                }}
            />
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
		padding: "0 0",
        aspectRatio: 1,
		boxShadow: "0 2px 0px rgba(0,0,0,0.2)",
        borderRadius: "12px",
	},

	headerButtonHover: {
		filter: "brightness(1.1)",
	},
};
