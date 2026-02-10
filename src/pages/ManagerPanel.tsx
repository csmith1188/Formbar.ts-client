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
	Spin,
	Skeleton,
} from "antd";
import { type UserData } from "../types";
import { LoadingOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;

import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { Activity, useEffect, useState } from "react";
import { accessToken, formbarUrl } from "../socket";

export default function ManagerPanel() {
	const [listCategory, setListCategory] = useState<
		"Users" | "IP Addresses" | "Banned Users"
	>("Users");
	const [users, setUsers] = useState<Record<string, UserData>>({});
	const [classrooms, setClassrooms] = useState<any[]>([]);

	useEffect(() => {
		if (!accessToken) return;

		fetch(`${formbarUrl}/api/v1/manager/`, {
			method: "GET",
			headers: {
				Authorization: `${accessToken}`,
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({ message: "Manager panel data", data });
				setUsers(data.users);
				setClassrooms(data.classrooms);
			})
			.catch((err) => {
				Log({
					message: "Error fetching manager panel data",
					data: err,
					level: "error",
				});
			});
	}, [accessToken]);

	function handleVerify(userId: number) {
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
			})
			.catch((err) => {
				Log({
					message: "Error verifying user",
					data: err,
					level: "error",
				});
			});
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

			<Flex
				justify="center"
				style={{ marginTop: "20px", marginBottom: "20px" }}
			>
				<Segmented
					options={["Users", "IP Addresses", "Banned Users"]}
					onChange={(value) =>
						setListCategory(
							value as "Users" | "IP Addresses" | "Banned Users",
						)
					}
					value={listCategory}
				/>
			</Flex>

			<div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px" }}>
				<Activity
					mode={listCategory === "Users" ? "visible" : "hidden"}
				>
					<Flex
						gap={10}
						justify="center"
						align="center"
						style={{ marginBottom: "20px", height: "40px" }}
					>
						<Title level={3} style={{ margin: 0 }}>
							Sort by:
						</Title>
						<Button
							variant="solid"
							style={{ padding: "0 20px", height: "100%" }}
						>
							Name
						</Button>
						<Button
							variant="solid"
							style={{ padding: "0 20px", height: "100%" }}
						>
							Permission
						</Button>
						<Input
							placeholder="Search users..."
							style={{ width: "40%" }}
						/>
					</Flex>

					<Row gutter={[8, 8]} style={{ margin: "10px" }}>
						{Object.keys(users).length > 0 ? (
							Object.values(users).map((user) => (
								<Col span={4} key={user.id}>
									<Card
										title={
											user.displayName ||
											user.email ||
											"Pending User"
										}
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
										<Flex
											vertical
											style={{ marginBottom: "10px" }}
										>
											<Text
												type="secondary"
												style={{ fontSize: "16px" }}
											>
												{user.email}
											</Text>
											{user.verified !== 0 ? (
												<Text
													type="secondary"
													style={{ fontSize: "16px" }}
												>
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
										<Select
											style={{ width: "100%" }}
											defaultValue={user.permissions}
										>
											<Select.Option value={5}>
												Manager
											</Select.Option>
											<Select.Option value={4}>
												Teacher
											</Select.Option>
											<Select.Option value={3}>
												Mod
											</Select.Option>
											<Select.Option value={2}>
												Student
											</Select.Option>
											<Select.Option value={1}>
												Guest
											</Select.Option>
										</Select>
										<Flex
											gap={10}
											justify="space-evenly"
											style={{ marginTop: "10px" }}
											wrap
										>
											{user.verified === 0 ? (
												<Tooltip
													title={"Verify User"}
													color="green"
												>
													<Button
														variant="solid"
														color="green"
														size="large"
														style={{
															padding: "0 20px",
														}}
														onClick={() =>
															handleVerify(
																user.id,
															)
														}
													>
														<IonIcon
															icon={
																IonIcons.checkmarkCircle
															}
															size="large"
														/>
													</Button>
												</Tooltip>
											) : null}
											<Tooltip
												title={"Ban User"}
												color="red"
											>
												<Button
													variant="solid"
													color="red"
													size="large"
													style={{
														padding: "0 20px",
													}}
												>
													<IonIcon
														icon={IonIcons.ban}
														size="large"
													/>
												</Button>
											</Tooltip>
											<Tooltip
												title={"Delete User"}
												color="red"
											>
												<Button
													variant="solid"
													color="red"
													size="large"
													style={{
														padding: "0 20px",
													}}
												>
													<IonIcon
														icon={IonIcons.trash}
														size="large"
													/>
												</Button>
											</Tooltip>
										</Flex>
									</Card>
								</Col>
							))
						) : (
							<Flex justify="center" style={{ width: "100%" }}>
								<Skeleton></Skeleton>
							</Flex>
						)}
					</Row>
				</Activity>
				<Activity
					mode={
						listCategory === "IP Addresses" ? "visible" : "hidden"
					}
				>
					<div style={{ textAlign: "center" }}>
						IP Addresses Management Coming Soon!
					</div>
				</Activity>
				<Activity
					mode={
						listCategory === "Banned Users" ? "visible" : "hidden"
					}
				>
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

			<Flex
				gap={20}
				style={{
					position: "fixed",
					bottom: "20px",
					left: "20px",
					zIndex: 1000,
				}}
			>
				<Button type="primary">View Logs</Button>
				<Button type="primary">Download Database</Button>
			</Flex>
		</div>
	);
}
