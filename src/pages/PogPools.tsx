import {
	Col,
	Flex,
	FloatButton,
	Input,
	Modal,
	Row,
	Spin,
	Typography,
} from "antd";
const { Text, Title } = Typography;
import FormbarHeader from "@components/FormbarHeader";
import Log from "@utils/debugLogger";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useUserData } from "@/main";
import { useEffect, useState } from "react";
import { getUserPools } from "@api/userApi";
import type { PogPool } from "@/types";
import { createPool } from "@api/pogPoolsApi";
import { currentUserHasScope } from "@/utils/scopeUtils";
import PogPoolElement from "@/components/PogPoolElement";
import { useGlobalMessage } from "@/components/providers/GlobalMessageProvider";
import { messageTemplates } from "@utils/messageTemplates";
import CustomPagination from "@/components/CustomPagination";

const DEFAULT_PAGE_SIZE = 6;

function parsePools(responseData: unknown): PogPool[] {
	const data = responseData as {
		poolItems?: unknown;
		pools?: unknown;
	};

	if (Array.isArray(data?.poolItems)) {
		return data.poolItems as PogPool[];
	}

	if (Array.isArray(data?.pools)) {
		return data.pools as PogPool[];
	}

	if (typeof data?.pools === "string") {
		try {
			const parsed = JSON.parse(data.pools);
			return Array.isArray(parsed) ? (parsed as PogPool[]) : [];
		} catch {
			return [];
		}
	}

	return [];
}

export default function PogPools() {
	const { userData } = useUserData();
	const globalMessageAPI = useGlobalMessage();
	const [pools, setPools] = useState<PogPool[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [totalPools, setTotalPools] = useState(0);

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

	const handleCreatePool = () => {
		if (!poolName.trim()) {
			globalMessageAPI.error(messageTemplates.pool_name_required_error);

			return;
		}

		Log({ message: `Creating pool: ${poolName}` });
		createPool({ name: poolName, description: poolDesc })
			.then((response) => {
				if (response?.success === false || response?.error) {
					globalMessageAPI.error(messageTemplates.pool_create_failed);
					return;
				}
				Log({ message: `Pool ${poolName} created successfully` });
				globalMessageAPI.success(messageTemplates.pool_created_success);
				setPoolName("");
				setPoolDesc("");
				setIsCreateModalOpen(false);
				refreshPools();
			})
			.catch((error) =>
				Log({
					message: "Error creating pool",
					data: error,
					level: "error",
				}),
			);
	};

	const canManagePools = currentUserHasScope(userData, "global.pools.manage");

	return (
		<>
			<FormbarHeader />
			<div
				style={{
					height: "calc(100vh - 64px)",
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
						justifyContent: "center",
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
							return (
								<Col xs={24} sm={12} lg={8} key={pool.id}>
									<PogPoolElement
										pool={pool}
										refreshPools={refreshPools}
									/>
								</Col>
							);
						})}

					{!isLoading && !error && pools.length === 0 && (
						<Col span={24}>
							<Text
								type="secondary"
								style={{
									display: "block",
									textAlign: "center",
								}}
							>
								No pools found.
							</Text>
						</Col>
					)}

					{error && (
						<Col span={24}>
							<Text
								type="danger"
								style={{
									display: "block",
									textAlign: "center",
								}}
							>
								{error}
							</Text>
						</Col>
					)}
				</Row>

				{totalPools > 0 && (
					<Flex
						justify="center"
						style={{
							margin: 0,
							position: "absolute",
							width: "100%",
							bottom: 8,
						}}
					>
						<CustomPagination
							currentPage={currentPage}
							pageSize={pageSize}
							total={totalPools}
							
							onChange={(page, size) => {
								setIsLoading(true);
								setCurrentPage(page);
								setPageSize(size);
							}}
						/>
					</Flex>
				)}
			</div>
			{canManagePools && (
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
			)}{" "}
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
