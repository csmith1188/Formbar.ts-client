import { Card, Col, Flex, Pagination, Row, Spin, Statistic, Tooltip, Typography } from "antd";
const { Text, Title } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import Log from "../debugLogger";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useUserData } from "../main";
import { useEffect, useState } from "react";
import { accessToken, formbarUrl } from "../socket";

type Pool = {
	id: number;
	name: string;
	description: string;
	amount: number;
	members: number[];
	owners: number[];
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

	useEffect(() => {
		if (!userData) return;
		const offset = (currentPage - 1) * pageSize;
		const abortController = new AbortController();

		fetch(`${formbarUrl}/api/v1/user/${userData.id}/pools?limit=${pageSize}&offset=${offset}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			method: "GET",
			signal: abortController.signal,
		})
			.then((res) => res.json())
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
				if (err?.name === "AbortError") {
					return;
				}

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

		return () => abortController.abort();
	}, [userData, currentPage, pageSize]);

	const handlePayout = (poolId: number) => {
		Log({ message: `Payout initiated for pool ${poolId}` });
		// TODO: Implement payout logic
	};

	const handleAddMember = (poolId: number) => {
		Log({ message: `Add member initiated for pool ${poolId}` });
		// TODO: Implement add member logic
	};

	const handleRemoveMember = (poolId: number) => {
		Log({ message: `Remove member initiated for pool ${poolId}` });
		// TODO: Implement remove member logic
	};

	const handleDelete = (poolId: number) => {
		Log({ message: `Delete pool ${poolId}` });
		// TODO: Implement delete logic
	};

	return (
		<>
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
							pool.owners.includes(userData?.id ?? -1);
						const ownerLabel =
							pool.owners && pool.owners.length > 0
								? pool.owners[0] === userData?.id
									? "You"
									: `${pool.owners[0]}`
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
								},
								root: {
									height: "100%",
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
												title="Add Member"
												key="addmember"
												placement="top"
												color="blue"
											>
												<IonIcon
													icon={
														IonIcons.personAddOutline
													}
													style={{ fontSize: "32px" }}
													onClick={() => handleAddMember(pool.id)}
													key="addmember"
												/>
											</Tooltip>,
											<Tooltip
                                                mouseEnterDelay={0.5}
												title="Remove Member"
												key="removemember"
												placement="top"
												color="red"
											>
												<IonIcon
													icon={
														IonIcons.personRemoveOutline
													}
													style={{ fontSize: "32px" }}
													onClick={() => handleRemoveMember(pool.id)}
													key="removemember"
												/>
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
										? `User ${memberList.join(", User ")}`
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
		</>
	);
}
