import { Button, Card, Col, Divider, Flex, FloatButton, Input, Modal, Pagination, Popover, Row, Spin, Statistic, Tooltip, Typography, notification } from "antd";
const { Text, Title } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import Log from "../debugLogger";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useUserData } from "../main";
import { useEffect, useState } from "react";
import { getUserPools } from "../api/userApi";
import { addPoolMember, createPool, deletePool, payoutPool, removePoolMember } from "../api/pogPoolsApi";

type Pool = {
	id: number;
	name: string;
	description: string;
	amount: number;
	members: Array<{ id: number; displayName: string }>;
	owners: Array<{ id: number; displayName: string }>;
};

const DEFAULT_PAGE_SIZE = 6;

function parsePools(responseData: unknown): Pool[] {
	const data = responseData as {
		poolItems?: unknown;
		pools?: unknown;
	};

	if (Array.isArray(data?.poolItems)) {
		return data.poolItems as Pool[];
	}

	if (Array.isArray(data?.pools)) {
		return data.pools as Pool[];
	}

	if (typeof data?.pools === "string") {
		try {
			const parsed = JSON.parse(data.pools);
			return Array.isArray(parsed) ? (parsed as Pool[]) : [];
		} catch {
			return [];
		}
	}

	return [];
}

export default function PogPools() {
	const { userData } = useUserData();
	const [pools, setPools] = useState<Pool[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [totalPools, setTotalPools] = useState(0);
	const [modal, contextHolder] = Modal.useModal();
	const [api, contextHolderNotification] = notification.useNotification();

    const [newPoolUserId, setNewPoolUserId] = useState("");
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [poolName, setPoolName] = useState("");
	const [poolDesc, setPoolDesc] = useState("");

	useEffect(() => {
		if (!userData) return;

        refreshPools();
	}, [userData, currentPage, pageSize]);

    const refreshPools = () => {
        if (!userData) return;
        const offset = (currentPage - 1) * pageSize;
        setIsLoading(true);

        getUserPools(String(userData.id), pageSize, offset)
            .then((response) => {
                const { data } = response;
                Log({ message: "Fetched pools", data });
                const poolItems = parsePools(data);
                const total =
                    typeof data?.pagination?.total === "number"
                        ? data.pagination.total
                        : poolItems.length;
                setPools(poolItems);
                setTotalPools(total);
                setError(null);
           	})
            .catch((err) => {
                Log({
                    message: "Error fetching pools",
                    data: err,
                    level: "error",
                });
                setError("Failed to fetch pools.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

	const handlePayout = (poolId: number) => {
		Log({ message: `Payout initiated for pool ${poolId}` });
		
        payoutPool(poolId)
            .then(() => {
                Log({ message: `Payout successful for pool ${poolId}` });
                refreshPools();
            })
            .catch((err) => {
                Log({ message: `Error during payout for pool ${poolId}`, data: err, level: "error" });
                api['error']({
                    title: "Error During Payout",
                    description: `Failed to payout the pool. Please try again.`,
                    placement: 'bottom'
                });
            });
	};

	const handleAddMember = (poolId: number) => {
        Log({ message: `Add user ${newPoolUserId} to pool ${poolId}` });
        addPoolMember(poolId, { userId: newPoolUserId })
            .then(() => {
                Log({ message: `User ${newPoolUserId} added to pool ${poolId}` });
                setNewPoolUserId("");
                refreshPools();
            })
            .catch((err) => {
                Log({ message: `Error adding user ${newPoolUserId} to pool ${poolId}`, data: err, level: "error" });
                api['error']({
                    title: "Error Adding Member",
                    description: `Failed to add user ${newPoolUserId} to the pool. Please try again.`,
                    placement: 'bottom'
                });
            });
	};

    const handleRemoveMember = (poolId: number, userId: string) => {
        Log({ message: `Remove user ${userId} from pool ${poolId}` });
        removePoolMember(poolId, { userId })
            .then(() => {
                Log({ message: `User ${userId} removed from pool ${poolId}` });
                setNewPoolUserId("");
                refreshPools();
            })
            .catch((err) => {
                Log({ message: `Error removing user ${userId} from pool ${poolId}`, data: err, level: "error" });
                api['error']({
                    title: "Error Removing Member",
                    description: `Failed to remove user ${userId} from the pool. Please try again.`,
                    placement: 'bottom'
                });
            });
    };

    const handleDelete = (poolId: number) => {
		Log({ message: `Delete pool ${poolId}` });

        modal.warning({
            title: "Confirm Pool Deletion",
            content: "Are you sure you want to delete this pool? This action cannot be undone.",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            okCancel: true,
            onOk: () => {
                
		
                deletePool(poolId)
                    .then(() => {
                        Log({ message: `Pool ${poolId} deleted` });
                        refreshPools();
                    })
                    .catch((err) => {
                        Log({ message: `Error deleting pool ${poolId}`, data: err, level: "error" });
                        api['error']({
                            title: "Error Deleting Pool",
                            description: `Failed to delete the pool. Please try again.`,
                            placement: 'bottom'
                        });
                    });
            },
        });
	};

	const handleCreatePool = () => {
		if (!poolName.trim()) {
			api['error']({
				title: "Validation Error",
				description: "Pool name is required.",
				placement: 'bottom'
			});

			return;
		}

		Log({ message: `Creating pool: ${poolName}` });
		createPool({ name: poolName, description: poolDesc })
			.then(() => {
				Log({ message: `Pool ${poolName} created successfully` });
				setPoolName("");
				setPoolDesc("");
				setIsCreateModalOpen(false);
				refreshPools();
			})
			.catch((err) => {
				Log({ message: `Error creating pool`, data: err, level: "error" });
				api['error']({
					title: "Error Creating Pool",
					description: `Failed to create the pool. Please try again.`,
                    placement: 'bottom'
				});
			});
	};

	return (
		<>
            {contextHolder}
            {contextHolderNotification}
			<FormbarHeader />

			<div
				style={{
					height: "calc(100vh - 80px)",
					overflowY: "auto",
					overflowX: "hidden",
					WebkitOverflowScrolling: "touch",
				}}
			>
				<Title style={{ textAlign: "center", marginTop: "20px" }}>
					Pog Pools
				</Title>

				<Row
					gutter={[16, 16]}
					style={{
						margin: "20px",
					}}
				>
				{isLoading && (
					<Col span={24}>
						<Flex justify="center">
							<Spin />
						</Flex>
					</Col>
				)}

				{!isLoading &&
					pools.map((pool) => {
						const isOwner =
							Array.isArray(pool.owners) &&
							pool.owners.some(owner => owner.id === userData?.id);
						const ownerLabel =
							isOwner
                                ? "You"
                                : Array.isArray(pool.owners) && pool.owners.length > 0
									? `${pool.owners[0].displayName}`
									: "N/A";
						const memberList = Array.isArray(pool.members)
							? pool.members
							: [];

						return (
							<Col xs={24} sm={12} lg={8} key={pool.id}>
						<Card
							title={pool.name}
							styles={{
								title: {
									textAlign: "center",
								},
								body: {
									textAlign: "center",
									height:
										isOwner
											? undefined
											: "calc(100% - 64px)",
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
                                    flex: '1 1 0'
								},
								root: {
									height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
								},
							}}
							actions={
								isOwner
									? [
											<Tooltip
                                                mouseEnterDelay={0.5}
												title="Payout Funds"
												key="payout"
												placement="top"
												color="green"
											>
												<IonIcon
													icon={IonIcons.cashOutline}
													style={{ fontSize: "32px" }}
													onClick={() => handlePayout(pool.id)}
													key="payout"
												/>
											</Tooltip>,
                                            <Tooltip
                                                mouseEnterDelay={0.5}
                                                title="Add or Remove Members"
                                                key="addmember"
                                                placement="top"
                                                color="blue"
                                            >
                                                <Popover
                                                    trigger={"click"}
                                                    title="Member"
                                                    content={
                                                        <Flex vertical gap={8}>
                                                            {
                                                                memberList.map((member) => (
                                                                    <Flex key={member.id} justify="space-between" align="center" gap={8}>
                                                                        <Tooltip title={`User ID: ${member.id}`} placement="top" color="blue">
                                                                            <Input disabled value={member.displayName} />
                                                                        </Tooltip>
                                                                        <Tooltip title={`Remove ${member.displayName}`} placement="top" color="red">
                                                                            <Button variant="solid" color="red" style={{ aspectRatio:'1'}} onClick={() => handleRemoveMember(pool.id, String(member.id))}>
                                                                                <IonIcon icon={IonIcons.personRemoveOutline} />
                                                                            </Button>
                                                                        </Tooltip>
                                                                    </Flex>
                                                                ))
                                                            }

                                                            {
                                                                memberList.length > 0 && (
                                                                    <Divider style={{margin: '10px 0'}} />
                                                                )
                                                            }

                                                            <Flex justify="space-between" align="center" gap={8}>
                                                                <Input placeholder="User ID" value={newPoolUserId} onChange={(e) => setNewPoolUserId(e.target.value)} />
                                                                <Tooltip title={`Add User ${newPoolUserId}`} placement="top" color="green">
                                                                    <Button variant="solid" color="green" style={{ aspectRatio:'1'}}
                                                                        onClick={() => {
                                                                            handleAddMember(pool.id);
                                                                        }}
                                                                    >
                                                                        <IonIcon icon={IonIcons.personAddOutline} />
                                                                    </Button>
                                                                </Tooltip>
                                                            </Flex>

                                                        </Flex>
                                                    }
                                                >
                                                        <IonIcon
                                                            icon={
                                                                IonIcons.peopleOutline
                                                            }
                                                            style={{ fontSize: "32px" }}
                                                            key="addmember"
                                                        />
                                                </Popover>
                                             </Tooltip>,
											<Tooltip
                                                mouseEnterDelay={0.5}
												title="Delete Pool"
												key="delete"
												placement="top"
												color="red"
											>
												<IonIcon
													icon={IonIcons.trashOutline}
													style={{ fontSize: "32px" }}
													onClick={() => handleDelete(pool.id)}
													key="delete"
												/>
											</Tooltip>,
										]
									: []
							}
						>
							<p>{pool.description}</p>

							<Row
								gutter={[16, 16]}
								style={{ marginTop: "20px" }}
							>
								<Col span={12}>
									<Statistic
										title="Owner"
										value={ownerLabel}
										styles={{
											content: {
												textAlign: "center",
												display: "flex",
												justifyContent: "center",
											},
										}}
									/>
								</Col>
								<Col span={12}>
									<Statistic
										title="Balance"
										value={pool.amount}
										styles={{
											content: {
												textAlign: "center",
												display: "flex",
												justifyContent: "center",
											},
										}}
									/>
								</Col>
							</Row>
							<Tooltip
								title={
									memberList.length > 0
										? memberList.map((m) => m.displayName).join(", ")
										: "No members"
								}
                                mouseEnterDelay={0.5}
								placement="top"
								style={{
									width: "100%",
									marginTop: "10px",
									textAlign: "center",
								}}
								color="blue"
							>
								<Text type="secondary">
									Members: {memberList.length}
								</Text>
							</Tooltip>
						</Card>
					</Col>
						);
					})}

				{!isLoading && !error && pools.length === 0 && (
					<Col span={24}>
						<Text type="secondary" style={{ display: "block", textAlign: "center" }}>
							No pools found.
						</Text>
					</Col>
				)}

				{error && (
					<Col span={24}>
						<Text type="danger" style={{ display: "block", textAlign: "center" }}>
							{error}
						</Text>
					</Col>
				)}
			</Row>

			{totalPools > 0 && (
				<Flex justify="center" style={{ marginBottom: "32px", marginTop: "20px" }}>
					<Pagination
						current={currentPage}
						pageSize={pageSize}
						total={totalPools}
						showSizeChanger
						pageSizeOptions={[6, 12, 24, 48]}
                        defaultPageSize={6}
						onChange={(page, size) => {
							setIsLoading(true);
							setCurrentPage(page);
							setPageSize(size);
						}}
					/>
				</Flex>
			)}
			</div>

			<FloatButton
                shape="circle"
                type="primary"
                tooltip={{
                    title: "Create Pool",
                    placement: "left",
                    color: "blue",
                }}
                styles={{
                    root: {
                        width: "64px",
                        height: "64px",
                    },
                }}
                onClick={() => setIsCreateModalOpen(true)}
                icon={
                    <IonIcon
                        icon={IonIcons.add}
                        style={{
                            fontSize: "36px",
                            display: "flex",
                        }}
                    />
                }
            />

			{/* Create Pool modal */}
			<Modal
				title="Create Pool"
				open={isCreateModalOpen}
				onCancel={() => {
					setPoolName("");
					setPoolDesc("");
					setIsCreateModalOpen(false);
				}}
				onOk={handleCreatePool}
				okText="Create"
				cancelText="Cancel"
			>
				<Flex vertical gap={16} style={{ marginTop: "16px" }}>
                    <Input
                        placeholder="Enter pool name"
                        value={poolName}
                        onChange={(e) => setPoolName(e.target.value)}
                    />
                    <Input.TextArea
                        placeholder="Enter pool description"
                        value={poolDesc}
                        onChange={(e) => setPoolDesc(e.target.value)}
                        rows={4}
                    />
				</Flex>
			</Modal>
		</>
	);
}
