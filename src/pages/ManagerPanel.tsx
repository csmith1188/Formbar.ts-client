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
    Switch,
    notification,
} from "antd";

const { Title, Text } = Typography;

import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { Activity, useEffect, useState } from "react";
import { accessToken } from "../socket";
import { useSettings, getAppearAnimation, useMobileDetect } from "../main";
import { banUser, deleteUser, unbanUser, verifyUser } from "../api/userApi";
import { addIpToList, deleteIpFromList, getIpAccessList, getManagerData, toggleIpList, updateIpFromList } from "../api/managerApi";
import { deleteRoom } from "../api/roomApi";

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
		"Users" | "IP Addresses" | "Classrooms" | "Banned Users"
	>("Users");

    const [ipListData, setIpListData] = useState<{ active: boolean, ips: { id: number, ip: string }[] }>({ active: false, ips: [] });
    const [selectedIpList, setSelectedIpList] = useState<"whitelist" | "blacklist">("whitelist");
    const [newIpText, setNewIpText] = useState("");
    const [showIpModal, setShowIpModal] = useState(false);
    const [isNewIpValid, setIsNewIpValid] = useState(false);

    const [api, contextHolder] = notification.useNotification();

    const [classrooms, setClassrooms] = useState<any[]>([]);

	const [users, setUsers] = useState<ManagerPanelUser[]>([]);
    const [bannedUsers, setBannedUsers] = useState<ManagerPanelUser[]>([])
	const [initialLoad, setInitialLoad] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [sortBy, setSortBy] = useState<"name" | "permission">("name");

	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [totalUsers, setTotalUsers] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [refreshNonce, setRefreshNonce] = useState(0);

    const [editingIpId, setEditingIpId] = useState<number | null>(null);
    const [editingIpValue, setEditingIpValue] = useState("");
    const [isIpValid, setIsIpValid] = useState(false);

    const ipRegex = /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\/(3[0-2]|[12]?\d))?$/;
    const validateIp = (ip: string) => ipRegex.test(ip);

    const [modal, contextModal] = Modal.useModal()
		const { settings } = useSettings();


	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 250);
		return () => clearTimeout(timeout);
	}, [searchQuery]);

    const isMobile = useMobileDetect();

	const updateManagerData = (ipList: "whitelist" | "blacklist" = selectedIpList) => {
        const offset = (currentPage - 1) * pageSize;

		getManagerData(offset, pageSize, sortBy)
			.then((response) => {
				const { data } = response;
				Log({ message: "Manager panel data", data });

				const userItems = Array.isArray(data?.users) ? data.users : [];

                const unbannedUsers = userItems.filter((user: ManagerPanelUser) => user.permissions > 0);
                const bannedUserItems  = userItems.filter((user: ManagerPanelUser) => user.permissions === 0);


                setClassrooms(data?.classrooms || []);
				setUsers(unbannedUsers);
                setBannedUsers(bannedUserItems);

				setTotalUsers(data?.pagination?.total || unbannedUsers.length);
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
        
		if (listCategory === "IP Addresses") {
			updateIpListData(ipList);
		}
    }

    const updateIpListData = (ipList: "whitelist" | "blacklist") => {
        getIpAccessList(ipList === "whitelist")
            .then((response) => {
                const { data } = response;
                Log({ message: `IP ${ipList} data`, data });
                setIpListData(data);
            }
            )
            .catch((err) => {
                Log({
                    message: `Error fetching IP ${ipList} data`,
                    data: err,
                    level: "error",
                });
            });
    }

	useEffect(() => {
		if (!accessToken) return;

		updateManagerData();
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
		verifyUser(String(userId))
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
                deleteUser(String(userId))
                .then(async (res) => {
                    if (!res.ok) {
                        Log({ message: "Failed to delete user:", data: res, level: "error" });
                        return;
                    }
                    if (res?.success) {
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
                banUser(String(userId))
                .then(async (res) => {
                    if (!res.ok) {
                        Log({ message: "Failed to ban user:", data: res, level: "error" });
                        return;
                    }
                    if (res?.success) {
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
                unbanUser(String(userId))
                .then(async (res) => {
                    if (!res.ok) {
                        Log({ message: "Failed to unban user:", data: res, level: "error" });
                        return;
                    }
                    if (res?.success) {
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
                        <Select style={{ width: "100%" }} defaultValue={user.permissions} disabled={isUnverifiedUser(user) || user.permissions === 0} >
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
        {contextHolder}
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
					options={["Users", "Classrooms", "IP Addresses", "Banned Users"]}
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

            <Activity mode={listCategory === "Users" ? "visible" : "hidden"}>
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
            </Activity>

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
                <Activity mode={listCategory === "Classrooms" ? "visible" : "hidden"}>
                        <Row gutter={[8, 8]} style={{ margin: "10px" }}>
                            {
                                classrooms.length > 0 ? (
                                    classrooms.map((classroom: any) => (
                                        <Col span={6} key={`classroom-col-${classroom.id}`}>
                                            <Card title={classroom.name} style={{ textAlign: "center" }}>
                                                <Text type="secondary" style={{marginRight: 10}}>ID: {classroom.id}</Text>
                                                <Button color="red" type="primary" variant="solid" onClick={() => {
                                                    deleteRoom(classroom.id)
                                                        .then(async (response) => {
                                                            if (!response.ok) {
                                                                const message =
                                                                    (response && (response.detail || response.message)) ||
                                                                    "Failed to delete class.";
                                                                throw new Error(message);
                                                            }
                                                            Log({ message: "Class deleted:", data: response.data });
                                                            api.success({
                                                                title: "Class deleted",
                                                                description: "The class has been deleted successfully.",
                                                                placement: 'bottom'
                                                            });
                                                            setIsLoading(true);
                                                            setInitialLoad(false);
                                                            setRefreshNonce((value) => value + 1);
                                                        })
                                                        .catch((error) => {
                                                            Log({ message: "Failed to delete class:", data: error, level: "error" });
                                                            api.error({
                                                                title: "Failed to delete class",
                                                                description:
                                                                (error && error.message) || "An unexpected error occurred while deleting the class.",
                                                                placement: 'bottom'
                                                            });
                                                        });
                                                }}>
                                                    Delete Class
                                                </Button>
                                            </Card>
                                        </Col>
                                    ))
                                ) : (
                                    <Flex justify="center" style={{ width: "100%" }}>
                                        <Skeleton active></Skeleton>
                                    </Flex>
                                )
                            }
                        </Row>
                </Activity>
				<Activity mode={listCategory === "IP Addresses" ? "visible" : "hidden"}>
                    <Flex justify="center" align="center" gap={10} wrap style={{ margin: "10px" }}>
                        <Segmented
                            options={["Whitelist", "Blacklist"]}
                            onChange={(value) => {
                                const nextIpList = value.toLowerCase() as "whitelist" | "blacklist";
                                setSelectedIpList(nextIpList);
                                updateIpListData(nextIpList);
                            }}
                        />
                        <Modal title={`Add IP to ${selectedIpList}`} open={showIpModal} onCancel={() => {
                            setNewIpText("");
                            setIsNewIpValid(false);
                            setShowIpModal(false);
                        }} onOk={() => {
                            if (isNewIpValid && newIpText) {
                                addIpToList(selectedIpList === "whitelist", newIpText)
                                    .then(() => {
                                        setNewIpText("");
                                        setIsNewIpValid(false);
                                        updateIpListData(selectedIpList);
                                        setShowIpModal(false);
                                    }
                                    )
                                    .catch((err) => {
                                        Log({   message: `Error adding IP to ${selectedIpList}:`, data: err, level: "error" });
                                    });
                            }
                        }} okButtonProps={{ disabled: !isNewIpValid }}>
                            <Input placeholder="Enter IP address (e.g., 192.168.1.1)" value={newIpText} onChange={(e) => {
                                setNewIpText(e.target.value);
                                setIsNewIpValid(validateIp(e.target.value));
                            }} status={newIpText && !isNewIpValid ? "error" : undefined} />
                        </Modal>
                        <Tooltip mouseEnterDelay={0.5} title={`Add IP to ${selectedIpList}`} color="blue">
                            <Button variant="solid" color="blue" onClick={() => setShowIpModal(true)}>
                                <IonIcon icon={IonIcons.add} />
                            </Button>
                        </Tooltip>
                        <Tooltip mouseEnterDelay={0.5} title={`Toggle ${selectedIpList.charAt(0).toUpperCase() + selectedIpList.slice(1)} Active`} color={ipListData.active ? "green" : "red"}>
                            <Switch checked={ipListData.active} onChange={() => {
                                toggleIpList(selectedIpList === 'whitelist');
                                updateIpListData(selectedIpList);
                            }} />
                        </Tooltip>
                    </Flex>
                    <div>
                        <Row gutter={[8, 8]} style={{ margin: "10px" }}>
                            {ipListData.ips.length > 0 ? (
                                ipListData.ips.map(({id, ip}) => (
                                    <Col span={8} key={`ip-col-${id}`}>
                                        <Card key={`whitelist-ip-${id}`} style={{ marginBottom: "10px" }}>
                                            <Flex gap={8} align="center">
                                                <Input 
                                                    value={editingIpId === id ? editingIpValue : ip} 
                                                    disabled={editingIpId !== id}
                                                    onChange={(e) => {
                                                        setEditingIpValue(e.target.value);
                                                        setIsIpValid(validateIp(e.target.value));
                                                    }}
                                                    status={editingIpId === id && editingIpValue && !isIpValid ? "error" : undefined}
                                                />

                                                {editingIpId === id ? (
                                                    <>
                                                        <Button 
                                                            variant="solid" 
                                                            color="green" 
                                                            style={{ marginLeft: "auto" }}
                                                            disabled={!isIpValid}
                                                            onClick={() => {
                                                                updateIpFromList(selectedIpList === "whitelist", String(id), editingIpValue)
                                                                    .then(() => {
                                                                        setEditingIpId(null);
                                                                        setEditingIpValue("");
                                                                        updateIpListData(selectedIpList);
                                                                    })
                                                                    .catch((err) => {
                                                                        Log({
                                                                            message: `Error updating IP in ${selectedIpList}:`,
                                                                            data: err,
                                                                            level: "error",
                                                                        });
                                                                    });
                                                            }}
                                                        >
                                                            <IonIcon icon={IonIcons.checkmark} />
                                                        </Button>
                                                        <Button 
                                                            variant="solid" 
                                                            color="default" 
                                                            style={{ marginLeft: "auto" }}
                                                            onClick={() => {
                                                                setEditingIpId(null);
                                                                setEditingIpValue("");
                                                                setIsIpValid(false);
                                                            }}
                                                        >
                                                            <IonIcon icon={IonIcons.close} />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button 
                                                            variant="solid" 
                                                            color="blue" 
                                                            style={{ marginLeft: "auto" }}
                                                            onClick={() => {
                                                                setEditingIpId(id);
                                                                setEditingIpValue(ip);
                                                                setIsIpValid(validateIp(ip));
                                                            }}
                                                        >
                                                            <IonIcon icon={IonIcons.pencil} />
                                                        </Button>

                                                        <Button 
                                                            variant="solid" 
                                                            color="red" 
                                                            style={{ marginLeft: "auto" }} 
                                                            onClick={() => deleteIpFromList(selectedIpList === "whitelist", id).then(() => updateIpListData(selectedIpList)).catch((err) => {
                                                                Log({
                                                                    message: `Error deleting IP from ${selectedIpList}:`,
                                                                    data: err,
                                                                    level: "error",
                                                                });
                                                                Modal.error({
                                                                    title: "Failed to delete IP",
                                                                    content: "An error occurred while deleting the IP address. Please try again.",
                                                                });
                                                            })}
                                                        >
                                                            <IonIcon icon={IonIcons.trash} />
                                                        </Button>
                                                    </>
                                                )}
                                            </Flex>
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                <Flex justify="center" style={{ width: "100%" }}>
                                    No IPs found
                                </Flex>
                            )}
                        </Row>
                    </div>
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
