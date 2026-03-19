import FormbarHeader from "../components/FormbarHeader";
import Log from "../debugLogger";
import {
	Segmented,
	Typography,
	Row,
	Col,
	Card,
	Button,
	Flex,
	Select,
	Tooltip,
	Input,
	Skeleton,
	Pagination,
    Modal,
} from "antd";

const { Title, Text } = Typography;

import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { Activity, useEffect, useState } from "react";
import { accessToken, formbarUrl } from "../socket";
import { useSettings, getAppearAnimation, useMobileDetect } from "../main";

type ManagerPanelUser = {
	id: number | string;
	email: string;
	permissions: number;
	displayName?: string;
	verified: number | boolean;
};

const DEFAULT_PAGE_SIZE = 24;

function isUnverifiedUser(user: ManagerPanelUser): boolean {
	return Number(user.verified) === 0;
}

export default function ManagerPanel() {
	const [listCategory, setListCategory] = useState<
		"Users" | "IP Addresses" | "Banned Users"
	>("Users");
	const [users, setUsers] = useState<ManagerPanelUser[]>([]);
    const [bannedUsers, setBannedUsers] = useState<ManagerPanelUser[]>([])
	const { settings } = useSettings();
	const [initialLoad, setInitialLoad] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [sortBy, setSortBy] = useState<"name" | "permission">("name");
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [totalUsers, setTotalUsers] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [refreshNonce, setRefreshNonce] = useState(0);
    const [modal, contextModal] = Modal.useModal()

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 250);
		return () => clearTimeout(timeout);
	}, [searchQuery]);

    const isMobile = useMobileDetect();

	useEffect(() => {
		if (!accessToken) return;

		const offset = (currentPage - 1) * pageSize;
		const params = new URLSearchParams({
			limit: String(pageSize),
			offset: String(offset),
			sortBy,
		});
		if (debouncedSearchQuery) {
			params.set("search", debouncedSearchQuery);
		}

		const abortController = new AbortController();

		fetch(`${formbarUrl}/api/v1/manager/?${params.toString()}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			signal: abortController.signal,
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "Manager panel data", data });

				const userItems = Array.isArray(data?.users) ? data.users : [];

                const unbannedUsers = userItems.filter((user: ManagerPanelUser) => user.permissions > 0);
                const bannedUserItems  = userItems.filter((user: ManagerPanelUser) => user.permissions === 0);

				setUsers(unbannedUsers);
                setBannedUsers(bannedUserItems);

				setTotalUsers(unbannedUsers.length);
			})
			.catch((err) => {
				if (err?.name === "AbortError") {
					return;
				}
				Log({
					message: "Error fetching manager panel data",
					data: err,
					level: "error",
				});
			})
			.finally(() => {
				setIsLoading(false);
			});

		return () => abortController.abort();
	}, [
        accessToken,
		currentPage,
		pageSize,
		sortBy,
		debouncedSearchQuery,
		refreshNonce,
		listCategory,
	]);

	useEffect(() => {
		// After users load, wait for animation to complete then disable it
		if (users.length > 0 && initialLoad) {
			const animationDuration = (users.length * 0.05 + 0.3) * 1000;
			const timer = setTimeout(() => {
				setInitialLoad(false);
			}, animationDuration);
			return () => clearTimeout(timer);
		}
	}, [users, initialLoad]);

	function handleVerify(userId: number | string) {
		fetch(`${formbarUrl}/api/v1/user/${userId}/verify`, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "User verified", data });
				setIsLoading(true);
				setInitialLoad(false);
				setCurrentPage(1);
				setRefreshNonce((value) => value + 1);
			})
			.catch((err) => {
				Log({
					message: "Error verifying user",
					data: err,
					level: "error",
				});
			});
	}

    function deleteUserButton(userId: number | string) {
        const targetUser =
            users.find((e) => e.id == userId) ??
            bannedUsers?.find((e) => e.id == userId);
        const userLabel =
            targetUser?.displayName ||
            targetUser?.email ||
            "This user";
        modal.warning({ 
            centered: true,
            title: "Are you sure you want to delete this user?",
            content: `${userLabel} will be unable to log in and removed from all classes.`,
            okCancel: true,
            onOk: () => {
                fetch(`${formbarUrl}/api/v1/user/${userId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                )
                .then(async (res) => {
                    let resp: any = null;
                    try { resp = await res.json(); } catch { resp = null; }
                    if (!res.ok) {
                        Log({ message: "Failed to delete user:", data: resp, level: "error" });
                        return;
                    }
                    if (resp?.success) {
                        setIsLoading(true);
                        setInitialLoad(false);
                        setRefreshNonce((value) => value + 1);
                    }
                })
                .catch((err) => {
                    Log({ message: "Error deleting user:", data: err, level: "error" });
                });
            }
        })

    }

    function banUserButton(userId: number | string) {
        const user = users.find((e) => e.id == userId) ??
            (typeof bannedUsers !== "undefined"
                ? bannedUsers.find((e: { id: number | string }) => e.id == userId)
                : undefined);
         const displayName = user?.displayName ?? "This user";
        modal.warning({ 
            centered: true,
            title: "Are you sure you want to ban this user?",
            content: `${displayName} will be unable to login or create a new account with this email`,
            okCancel: true,
            onOk: () => {
                fetch(`${formbarUrl}/api/v1/user/${userId}/ban`,
                    {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                )
                .then(async (res) => {
                    let resp: any = null;
                    try { resp = await res.json(); } catch { resp = null; }
                    if (!res.ok) {
                        Log({ message: "Failed to ban user:", data: resp, level: "error" });
                        return;
                    }
                    if (resp?.success) {
                        setIsLoading(true);
                        setInitialLoad(false);
                        setRefreshNonce((value) => value + 1);
                    }
                })
                .catch((err) => {
                    Log({ message: "Error banning user:", data: err, level: "error" });
                });
            }
        })
    }

    function unbanUserButton(userId: number | string) {
        const user = users.find((e) => e.id == userId) ??
            (typeof bannedUsers !== "undefined"
                ? bannedUsers.find((e: { id: number | string }) => e.id == userId)
                : undefined);

        const displayName = user?.displayName ?? "This user";
        
        modal.warning({ 
            centered: true,
            title: "Are you sure you want to unban this user?",
            content: `${displayName} will now be able to login or create a new account with this email`,
            okCancel: true,
            onOk: () => {
                fetch(`${formbarUrl}/api/v1/user/${userId}/unban`,
                    {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                )
                .then(async (res) => {
                    let resp: any = null;
                    try { resp = await res.json(); } catch { resp = null; }
                    if (!res.ok) {
                        Log({ message: "Failed to unban user:", data: resp, level: "error" });
                        return;
                    }
                    if (resp?.success) {
                        setIsLoading(true);
                        setInitialLoad(false);
                        setRefreshNonce((value) => value + 1);
                    }
                })
                .catch((err) => {
                    Log({ message: "Error unbanning user:", data: err, level: "error" });
                });
            }
        })
    }



	function renderUserCard(user: ManagerPanelUser, index: number, mobileCard: boolean) {
		const colStyle =
			initialLoad && !isLoading
				? getAppearAnimation(settings.disableAnimations, index)
				: {};

		const card = (
			<Card
				key={`user-card-${user.id}`}
				title={user.displayName || user.email || "Pending User"}
				styles={{
					title: {
						textAlign: "center",
					},
					body: {
						textAlign: "center",
					},
					root: {
						height: "100%",
					},
				}}
			>
				<Flex vertical style={{ marginBottom: "10px" }}>
					<Text type="secondary" style={{ fontSize: "16px" }}>
						{user.email}
					</Text>
					{!isUnverifiedUser(user) ? (
						<Text type="secondary" style={{ fontSize: "16px" }}>
							ID: {user.id}
						</Text>
					) : (
						<Text
							type="secondary"
							style={{
								fontSize: "16px",
								fontStyle: "italic",
							}}
						>
							Pending Verification
						</Text>
					)}
				</Flex>
                {
                    !isMobile && (
                        <Select style={{ width: "100%" }} defaultValue={user.permissions}>
                            <Select.Option value={5}>Manager</Select.Option>
                            <Select.Option value={4}>Teacher</Select.Option>
                            <Select.Option value={3}>Mod</Select.Option>
                            <Select.Option value={2}>Student</Select.Option>
                            <Select.Option value={1}>Guest</Select.Option>
                            {
                                user.permissions === 0 && (
                                    <Select.Option value={0}>Banned</Select.Option>
                                )
                            }
                        </Select>
                    )
                }
				<Flex gap={10} justify="space-evenly" style={{ marginTop: "10px" }} wrap>
					{isUnverifiedUser(user) ? (
						<Tooltip mouseEnterDelay={0.5} title={"Verify User"} color="green">
							<Button
								variant="solid"
								color="green"
								size="large"
								style={{
									padding: "0 20px",
								}}
								onClick={() => handleVerify(user.id)}
							>
								<IonIcon icon={IonIcons.checkmarkCircle} size="large" />
							</Button>
						</Tooltip>
					) : null}
                    {
                        user.permissions > 0 ? (
                            <Tooltip mouseEnterDelay={0.5} title={"Ban User"} color="red">
                                <Button
                                    variant="solid"
                                    color="red"
                                    size="large"
                                    style={{
                                        padding: "0 20px",
                                    }}
                                    onClick={() => banUserButton(user.id)}
                                >
                                    <IonIcon icon={IonIcons.ban} size="large" />
                                </Button>
                            </Tooltip>
                        ) : (
                            <Tooltip mouseEnterDelay={0.5} title={"Unban User"} color="green">
                                <Button
                                    variant="solid"
                                    color="green"
                                    size="large"
                                    style={{
                                        padding: "0 20px",
                                    }}
                                    onClick={() => unbanUserButton(user.id)}
                                >
                                    <IonIcon icon={IonIcons.checkmarkCircle} size="large" />
                                </Button>
                            </Tooltip>
                        )
                    }
                    {
                        isMobile && (
                            <Select style={{ flex: '1 1 auto' }} defaultValue={user.permissions}>
                                <Select.Option value={5}>Manager</Select.Option>
                                <Select.Option value={4}>Teacher</Select.Option>
                                <Select.Option value={3}>Mod</Select.Option>
                                <Select.Option value={2}>Student</Select.Option>
                                <Select.Option value={1}>Guest</Select.Option>
                                {
                                    user.permissions === 0 && (
                                        <Select.Option value={0}>Banned</Select.Option>
                                    )
                                }
                            </Select>
                        )
                    }
					<Tooltip mouseEnterDelay={0.5} title={"Delete User"} color="red">
						<Button
							variant="solid"
							color="red"
							size="large"
							style={{
								padding: "0 20px",
							}}
							onClick={() => deleteUserButton(user.id)}
						>
							<IonIcon icon={IonIcons.trash} size="large" />
						</Button>
					</Tooltip>
				</Flex>
			</Card>
		);

		if (mobileCard) {
			return card;
		}

		return (
			<Col span={4} key={`user-col-${user.id}`} style={colStyle}>
				{card}
			</Col>
		);
	}

	return (
        <>
        {contextModal}
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
			}}
		>
			<FormbarHeader />

			<Title
				style={{
					textAlign: "center",
					marginTop: "20px",
					marginBottom: "20px",
				}}
			>
				Manager{isMobile ? "" : " Panel"}
			</Title>

			<Flex justify="center" style={{ marginTop: "20px", marginBottom: "20px" }}>
				<Segmented
					options={["Users", "IP Addresses", "Banned Users"]}
					onChange={(value) => {
						if (value === "Users") {
							setIsLoading(true);
							setInitialLoad(true);
						}
						setListCategory(value as "Users" | "IP Addresses" | "Banned Users");
					}}
					value={listCategory}
				/>
			</Flex>

			<Flex gap={10} justify="center" align="center" style={{ marginBottom: "20px", height: "40px", padding: "0 5px" }}>
                {isMobile ? null : (
    				<Title level={3} style={{ margin: 0 }}>
    					Sort by:
    				</Title>
                )}
				<Button
					variant="solid"
					color={sortBy === "name" ? "primary" : undefined}
					style={{ padding: "0 20px", height: "100%", ...(isMobile ? { flex: '1 1 auto' } : {}) }}
					onClick={() => {
						setCurrentPage(1);
						setIsLoading(true);
						setInitialLoad(true);
						setSortBy("name");
					}}
				>
					Name
				</Button>
				<Button
					variant="solid"
					color={sortBy === "permission" ? "primary" : undefined}
					style={{ padding: "0 20px", height: "100%", ...(isMobile ? { flex: '1 1 auto' } : {}) }}
					onClick={() => {
						setCurrentPage(1);
						setIsLoading(true);
						setInitialLoad(true);
						setSortBy("permission");
					}}
				>
					Permission
				</Button>
				<Input
					placeholder="Search users..."
					style={{ width: "40%", ...(isMobile ? { flex: '1 1 auto' } : {}) }}
					value={searchQuery}
					onChange={(e) => {
						setCurrentPage(1);
						setIsLoading(true);
						setInitialLoad(true);
						setSearchQuery(e.target.value);
					}}
				/>
			</Flex>

			<div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px" }}>
				<Activity
					mode={listCategory === "Users" ? "visible" : "hidden"}
				>

					{ isMobile ? (
                        <Flex vertical gap={10} style={{ margin: "10px" }}>
                            {users.length > 0 ? (
                                users.map((user, index) => renderUserCard(user, index, true))
                            ) : (
                                <Flex justify="center" style={{ width: "100%" }}>
                                    <Skeleton active></Skeleton>
                                </Flex>
                            )}
                        </Flex>
                    ) : (
                        <Row gutter={[8, 8]} style={{ margin: "10px" }}>
                            {users.length > 0 ? (
								users.map((user, index) => renderUserCard(user, index, false))
                            ) : (
                                <Flex justify="center" style={{ width: "100%" }}>
                                    <Skeleton></Skeleton>
                                </Flex>
                            )}
                        </Row>
                    )}
                    {totalUsers > 0 && (
						<Flex justify="center" style={{ marginTop: "8px", marginBottom: "24px" }}>
							<Pagination
								current={currentPage}
								pageSize={pageSize}
								total={totalUsers}
								showSizeChanger
								pageSizeOptions={[12, 24, 48, 100]}
								onChange={(page, size) => {
									setIsLoading(true);
									setInitialLoad(true);
									setCurrentPage(page);
									setPageSize(size);
								}}
							/>
						</Flex>
					)}
				</Activity>
				<Activity mode={listCategory === "IP Addresses" ? "visible" : "hidden"}>
					<div style={{ textAlign: "center" }}>IP Addresses Management Coming Soon!</div>
				</Activity>
				<Activity mode={listCategory === "Banned Users" ? "visible" : "hidden"}>
					<Row gutter={[8, 8]} style={{ margin: "10px" }}>
						{
                            bannedUsers.length > 0 ? (
                                bannedUsers.map((user, index) => renderUserCard(user, index, false))
                            ) : (
                                <Flex justify="center" style={{ width: "100%" }}>
                                    <Skeleton></Skeleton>
                                </Flex>
                            )
						}
					</Row>
				</Activity>
			</div>
		</div>
        </>
	);
}
