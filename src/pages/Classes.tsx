import { Button, Card, Flex, Input, Select, Typography } from "antd";
const { Title, Text } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import Log from "../debugLogger";
import { useUserData, useTheme } from "../main";
import type { CardStylesType } from "antd/es/card/Card";
import { useMobileDetect } from "../main";
import { accessToken, formbarUrl } from "../socket";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ClassesPage() {
	const navigate = useNavigate();
	const { userData, setUserData } = useUserData();
	const { isDark } = useTheme();
	const isMobileView = useMobileDetect();

	const [joinClassCode, setJoinClassCode] = useState<string>("");

	const [joinedClasses, setJoinedClasses] = useState<
		Array<{ id: number; name: string }>
	>([]);
	const [ownedClasses, setOwnedClasses] = useState<
		Array<{ id: number; name: string }>
	>([]);

	const [selectedClass, setSelectedClass] = useState<number | null>(null);

	const [createClassName, setCreateClassName] = useState<string>("");

	useEffect(() => {
		if (!userData) return;

		fetch(`${formbarUrl}/api/v1/user/${userData.id}/classes`, {
			method: "GET",
			headers: {
				Authorization: `${accessToken}`,
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "Classes data", data });

				const owned = data.filter((cls: any) => cls.isOwner === true);
				const joined = data.filter((cls: any) => cls.isOwner === false);
				setOwnedClasses(owned);
				setJoinedClasses(joined);
			})
			.catch((err) => {
				Log({
					message: "Error fetching classes data",
					data: err,
					level: "error",
				});
			});
	}, [userData]);

    function deleteClass() {
        if (selectedClass === null) {
            Log({ message: "No class selected", level: "error" });
            return;
        }
        Log({ message: "Selected class for deletion", data: { selectedClass } });
    }

	function enterClass() {
		if (selectedClass === null) {
			Log({ message: "No class selected", level: "error" });
			return;
		}
		Log({ message: "Selected class", data: { selectedClass } });
		fetch(`${formbarUrl}/api/v1/class/${selectedClass}/join`, {
			method: "POST",
			headers: {
				Authorization: `${accessToken}`,
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "Entered class", data });
				// Handle successful class entry (e.g., navigate to class page)
				if (response.success) {
					fetch(`${formbarUrl}/api/v1/user/me`, {
						method: "GET",
						headers: {
							Authorization: `${accessToken}`,
						},
					})
						.then((res) => res.json())
						.then((userResponse) => {
							const { data: userData } = userResponse;
							Log({
								message:
									"User data fetched successfully after joining class.",
								data: userData,
								level: "info",
							});
							// Update user data in context or state
							// For example, if you have a setUserData function from context:
							setUserData(userData);
							if (userData.classPermissions >= 4)
								navigate("/panel");
							else navigate("/student");
						})
						.catch((err) => {
							Log({
								message:
									"Error fetching user data after joining class:",
								data: err,
								level: "error",
							});
						});
				}
			})
			.catch((err) => {
				Log({
					message: "Error entering class",
					data: err,
					level: "error",
				});
			});
	}
    function enterClassWithId(classId: number) {
        Log({ message: "Selected class (direct)", data: { classId } });
        fetch(`${formbarUrl}/api/v1/class/${classId}/join`, {
            method: "POST",
            headers: {
                Authorization: `${accessToken}`,
            },
        })
            .then((res) => res.json())
            .then((response) => {
                const { data } = response;
                Log({ message: "Entered class", data });
                if (response.success) {
                    fetch(`${formbarUrl}/api/v1/user/me`, {
                        method: "GET",
                        headers: {
                            Authorization: `${accessToken}`,
                        },
                    })
                        .then((res) => res.json())
                        .then((userResponse) => {
                            const { data: userData } = userResponse;
                            Log({
                                message:
                                    "User data fetched successfully after joining class.",
                                data: userData,
                                level: "info",
                            });
                            setUserData(userData);
                            if (userData.classPermissions >= 4)
                                navigate("/panel");
                            else navigate("/student");
                        })
                        .catch((err) => {
                            Log({
                                message:
                                    "Error fetching user data after joining class:",
                                data: err,
                                level: "error",
                            });
                        });
                }
            })
            .catch((err) => {
                Log({
                    message: "Error entering class",
                    data: err,
                    level: "error",
                });
            });
    }
	function createClass() {
		if (createClassName.trim() === "") {
			Log({ message: "Class name cannot be empty", level: "error" });
			return;
		}
		fetch(`${formbarUrl}/api/v1/class/create`, {
			method: "POST",
			headers: {
				Authorization: `${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: createClassName }),
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "Created class", data });
				// Handle successful class creation (e.g., update ownedClasses state)
                if (response.success) {
					setOwnedClasses((prev) => [...prev, { id: data.classId, name: data.className }]);
					setCreateClassName("");
					// Call enterClass with the new classId directly to avoid race condition
					enterClassWithId(data.classId);
					// Helper to enter a class by id directly (avoids relying on async setSelectedClass)
					
                }
			})
			.catch((err) => {
				Log({
					message: "Error creating class",
					data: err,
					level: "error",
				});
			});
	}

	function joinClass() {
		if (joinClassCode.trim() === "") {
			Log({ message: "Class code cannot be empty", level: "error" });
			return;
		}
		fetch(`${formbarUrl}/api/v1/room/${joinClassCode}/join`, {
			method: "POST",
			headers: {
				Authorization: `${accessToken}`,
				"Content-Type": "application/json",
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "Joined class with code", data });
				// Handle successful class join (e.g., navigate to class page)
				if (response.success) {
                    setJoinedClasses((prev) => [...prev, { id: data.classId, name: data.className }]);
                    setJoinClassCode("");
				}
			})
			.catch((err) => {
				Log({
					message: "Error joining class with code",
					data: err,
					level: "error",
				});
			});
	}

    if(location.href.includes("joinClass")) {
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get("code");
        if (classCode) {
            Log({ message: "Joining class from URL code", data: { classCode } });
            joinClassWithCode(classCode);
        }
    }

    function joinClassWithCode(code: string) {
        fetch(`${formbarUrl}/api/v1/room/${code}/join`, {
            method: "POST",
            headers: {
                Authorization: `${accessToken}`,
                "Content-Type": "application/json",
            },
        })
        .then((res) => res.json())
        .then((response) => {
            const { data } = response;
            Log({ message: "Joined class with code (URL)", data });
            if (response.success) {
                enterClassWithId(data.classId);
            }
        })
        .catch((err) => {
            Log({
                message: "Error joining class with code (URL)",
                data: err,
                level: "error",
            });
        });
    }

	return (
		<>
			<FormbarHeader />

			<Flex
				vertical
				align="center"
				justify="center"
				style={{ padding: "20px", height: "100%", width: "100%", overflowY: "auto" }}
				gap={!isMobileView ? 40 : 24}
			>
				{/* Page heading */}
				<div style={{ textAlign: "center", animation: "slideInUp 0.35s ease both" }}>
					<Title style={{ marginBottom: 4, fontWeight: 800, letterSpacing: "-0.02em" }}>
						{!isMobileView ? "Manage " : ""}Your Classes
					</Title>
					<Text style={{ fontSize: 15, opacity: 0.65 }}>
						Enter
						{userData?.permissions && userData.permissions >= 4
							? ", create,"
							: ""}{" "}
						or join a class quickly
					</Text>
				</div>

				{/* Cards */}
				<Flex
					align="stretch"
					justify="center"
					gap={isMobileView ? 16 : 20}
					style={{ width: "100%", maxWidth: 1100 }}
					wrap="wrap"
				>
					{/* Enter a Class */}
					<Card
						title={
							<Flex align="center" gap={8} justify="center">
								<span>🚪</span>
								<span>Enter a Class</span>
							</Flex>
						}
						style={{
							...cardStyle(isMobileView),
							backdropFilter: "blur(16px)",
							WebkitBackdropFilter: "blur(16px)",
							border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
							boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.35)" : "0 8px 32px rgba(0,0,0,0.08)",
							borderRadius: 20,
						}}
						styles={cardStyles}
						loading={!userData}
					>
						<Flex vertical gap={16} align="center" justify="center" style={{ height: "100%" }}>
							<Select
								style={{ width: "100%" }}
								placeholder="Select a class to enter"
								value={selectedClass}
								onChange={(value) => setSelectedClass(value)}
								size="large"
							>
								{ownedClasses.length > 0 && (
									<Select.OptGroup label="📌 Owned Classes">
										{ownedClasses.map((cls) => (
											<Select.Option key={cls.id} value={cls.id}>
												{cls.name}
											</Select.Option>
										))}
									</Select.OptGroup>
								)}
								{joinedClasses.length > 0 && (
									<Select.OptGroup label="🎓 Joined Classes">
										{joinedClasses.map((cls) => (
											<Select.Option key={cls.id} value={cls.id}>
												{cls.name}
											</Select.Option>
										))}
									</Select.OptGroup>
								)}
							</Select>
							<Flex align="center" justify="center" gap={10} wrap="wrap" style={{ width: "100%" }}>
								<Button
									type="primary"
									size="large"
									style={{ flex: 1, minWidth: 100, fontWeight: 600, borderRadius: 10 }}
									onClick={() => enterClass()}
								>
									Enter{isMobileView ? "" : " Class"}
								</Button>
								{userData && userData.permissions >= 4 && (
									<Button
										size="large"
										color="danger"
										variant="solid"
										style={{ fontWeight: 600, borderRadius: 10 }}
										onClick={() => deleteClass()}
									>
										Delete
									</Button>
								)}
							</Flex>
						</Flex>
					</Card>

					{/* Create a Class */}
					{userData && userData.permissions && userData.permissions >= 4 && (
						<Card
							title={
								<Flex align="center" gap={8} justify="center">
									<span>✨</span>
									<span>Create a Class</span>
								</Flex>
							}
							style={{
								...cardStyle(isMobileView),
								animationDelay: "0.05s",
								backdropFilter: "blur(16px)",
								WebkitBackdropFilter: "blur(16px)",
								border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
								boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.35)" : "0 8px 32px rgba(0,0,0,0.08)",
								borderRadius: 20,
							}}
							styles={cardStyles}
						>
							<Flex vertical gap={16} align="center" justify="center" style={{ height: "100%" }}>
								<Input
									size="large"
									style={{ width: "100%" }}
									placeholder="Class Name"
									value={createClassName}
									onChange={(e) => setCreateClassName(e.target.value)}
									onPressEnter={() => createClass()}
								/>
								<Button
									type="primary"
									size="large"
									style={{ width: "100%", fontWeight: 600, borderRadius: 10 }}
									onClick={() => createClass()}
									disabled={!createClassName.trim()}
								>
									Create{isMobileView ? "" : " Class"}
								</Button>
							</Flex>
						</Card>
					)}

					{/* Join a Class */}
					<Card
						title={
							<Flex align="center" gap={8} justify="center">
								<span>🔗</span>
								<span>Join a Class</span>
							</Flex>
						}
						style={{
							...cardStyle(isMobileView),
							animationDelay: "0.1s",
							backdropFilter: "blur(16px)",
							WebkitBackdropFilter: "blur(16px)",
							border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
							boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.35)" : "0 8px 32px rgba(0,0,0,0.08)",
							borderRadius: 20,
						}}
						styles={cardStyles}
						loading={!userData}
					>
						<Flex vertical gap={16} align="center" justify="center" style={{ height: "100%" }}>
							<Input
								size="large"
								style={{ width: "100%" }}
								placeholder="Class Code"
								value={joinClassCode}
								onChange={(e) => setJoinClassCode(e.target.value)}
								onPressEnter={joinClass}
							/>
							<Button
								type="primary"
								size="large"
								style={{ width: "100%", fontWeight: 600, borderRadius: 10 }}
								onClick={joinClass}
								disabled={!joinClassCode.trim()}
							>
								Join{isMobileView ? "" : " Class"}
							</Button>
						</Flex>
					</Card>
				</Flex>
			</Flex>
		</>
	);
}

const cardStyle = (isMobileView: boolean) => ({
	width: isMobileView ? "calc(100vw - 40px)" : "320px",
	minHeight: isMobileView ? "180px" : "220px",
});

const cardStyles = {
	root: {
		opacity: 0,
		animation: "appear 0.35s ease-in-out forwards",
	},
	title: {
		width: "100%",
		textAlign: "center",
		fontSize: 16,
		fontWeight: 700,
	},
	body: {
		height: "calc(100% - 64px)",
		padding: "20px 24px",
	},
} as CardStylesType;
