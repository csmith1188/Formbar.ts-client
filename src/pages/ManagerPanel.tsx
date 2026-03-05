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
} from "antd";
const { Title, Text } = Typography;

import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { Activity, useEffect, useState } from "react";
import { accessToken, formbarUrl } from "../socket";

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
	const [pendingUsers, setPendingUsers] = useState<ManagerPanelUser[]>([]);
	const [initialLoad, setInitialLoad] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [sortBy, setSortBy] = useState<"name" | "permission">("name");
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [totalUsers, setTotalUsers] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [refreshNonce, setRefreshNonce] = useState(0);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 250);
		return () => clearTimeout(timeout);
	}, [searchQuery]);

	useEffect(() => {
		if (!accessToken || listCategory !== "Users") return;

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
				Authorization: `${accessToken}`,
			},
			signal: abortController.signal,
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "Manager panel data", data });

				const userItems = Array.isArray(data?.users) ? data.users : [];
				const pendingUserItems = Array.isArray(data?.pendingUsers)
					? data.pendingUsers
					: [];
				const total =
					typeof data?.pagination?.total === "number"
						? data.pagination.total
						: userItems.length;

				setUsers(userItems);
				setPendingUsers(pendingUserItems);
				setTotalUsers(total);
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
				Authorization: `${accessToken}`,
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "User verified", data });
				setIsLoading(true);
				setInitialLoad(true);
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

	function renderUserCard(user: ManagerPanelUser, index: number, keyPrefix: string) {
		const animateStyle =
			initialLoad && !isLoading
				? {
						opacity: 0,
						animation: "appear 0.3s ease-in-out forwards",
						animationDelay: `${index * 0.05}s`,
				  }
				: {};

		return (
			<Col span={4} key={`${keyPrefix}-${user.id}`} style={animateStyle}>
				<Card
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
					<Select style={{ width: "100%" }} defaultValue={user.permissions}>
						<Select.Option value={5}>Manager</Select.Option>
						<Select.Option value={4}>Teacher</Select.Option>
						<Select.Option value={3}>Mod</Select.Option>
						<Select.Option value={2}>Student</Select.Option>
						<Select.Option value={1}>Guest</Select.Option>
					</Select>
					<Flex gap={10} justify="space-evenly" style={{ marginTop: "10px" }} wrap>
						{isUnverifiedUser(user) ? (
							<Tooltip title={"Verify User"} color="green">
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
						<Tooltip title={"Ban User"} color="red">
							<Button
								variant="solid"
								color="red"
								size="large"
								style={{
									padding: "0 20px",
								}}
							>
								<IonIcon icon={IonIcons.ban} size="large" />
							</Button>
						</Tooltip>
						<Tooltip title={"Delete User"} color="red">
							<Button
								variant="solid"
								color="red"
								size="large"
								style={{
									padding: "0 20px",
								}}
							>
								<IonIcon icon={IonIcons.trash} size="large" />
							</Button>
						</Tooltip>
					</Flex>
				</Card>
			</Col>
		);
	}

	return (
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
				Manager Panel
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

			<Flex gap={10} justify="center" align="center" style={{ marginBottom: "20px", height: "40px" }}>
				<Title level={3} style={{ margin: 0 }}>
					Sort by:
				</Title>
				<Button
					variant="solid"
					color={sortBy === "name" ? "primary" : undefined}
					style={{ padding: "0 20px", height: "100%" }}
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
					style={{ padding: "0 20px", height: "100%" }}
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
					style={{ width: "40%" }}
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
				<Activity mode={listCategory === "Users" ? "visible" : "hidden"}>
					<Row gutter={[8, 8]} style={{ margin: "10px" }}>
						{isLoading ? (
							<Flex justify="center" style={{ width: "100%" }}>
								<Skeleton active style={{ width: "100%" }} />
							</Flex>
						) : (
							<>
								{pendingUsers.length > 0 && (
									<Col span={24}>
										<Text strong>Pending Users</Text>
									</Col>
								)}
								{pendingUsers.map((user, index) =>
									renderUserCard(user, index, "pending"),
								)}

								{users.length > 0 && (
									<Col span={24}>
										<Text strong style={{ marginTop: "10px", display: "block" }}>
											Users
										</Text>
									</Col>
								)}
								{users.map((user, index) =>
									renderUserCard(user, index + pendingUsers.length, "user"),
								)}

								{users.length === 0 && pendingUsers.length === 0 && (
									<Col span={24}>
										<Text type="secondary" style={{ display: "block", textAlign: "center" }}>
											No users found.
										</Text>
									</Col>
								)}
							</>
						)}
					</Row>

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
							<p>endpoint needed</p>
							// bannedUsers.map((user) => (
							//     <Col span={3} key={user.id}>
							//         <Card
							//             title={user.displayName}

							//             styles={
							//                 {
							//                     title: {
							//                         textAlign: 'center',
							//                     },
							//                     body: {
							//                         textAlign: 'center',
							//                     },
							//                     root: {
							//                         height: '100%',
							//                     }
							//                 }
							//             }

							//             >
							//             <Flex vertical style={{marginBottom:'10px'}}>
							//                 <Text type='secondary' style={{fontSize:'16px'}}>{user.email}</Text>
							//             </Flex>
							//             <Flex gap={10} justify="space-evenly" style={{marginTop:'10px'}} wrap>
							//                 <Tooltip title={"Unban User"} color="unban">
							//                     <Button variant="solid" color='green' size='large' style={{padding: '0 20px',}}>
							//                         <IonIcon icon={IonIcons.checkmarkCircle} size='large' />
							//                     </Button>
							//                 </Tooltip>
							//             </Flex>
							//         </Card>
							//     </Col>
							// ))
						}
					</Row>
				</Activity>
			</div>
		</div>
	);
}
