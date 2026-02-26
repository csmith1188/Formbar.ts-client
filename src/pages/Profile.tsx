import FormbarHeader from "../components/FormbarHeader";
import Log from "../debugLogger";
import {
	Collapse,
	Card,
	Flex,
	Progress,
	Tooltip,
	Typography,
	Button,
	Input,
	message,
	Modal,
} from "antd";
const { Text, Link } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserData, isMobile } from "../main";
import { accessToken, formbarUrl } from "../socket";

export default function Profile() {
	const { userData } = useUserData();
	const [messageApi, contextHolder] = message.useMessage();
	const navigate = useNavigate();
	const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
	const [sensitiveActiveKeys, setSensitiveActiveKeys] = useState<string[]>(
		[],
	);
	const [sensModalOpen, setSensModalOpen] = useState(false);
	const [enteredPin, setEnteredPin] = useState("");

	const [profileProps, setProfileProps] = useState<{
		[key: string]: string | number | undefined;
	}>({});

	const [error, setError] = useState<string | null>(null);
	const [apiKey, setApiKey] = useState<string | null>(null);
	const [oldPin, setOldPin] = useState("");
	const [newPin, setNewPin] = useState("");
	const [apiKeyLoading, setApiKeyLoading] = useState(false);
	const [pinLoading, setPinLoading] = useState(false);
	const [pinResetLoading, setPinResetLoading] = useState(false);

	const { id } = useParams<{ id?: string }>();
	const isOwnProfile = !id || String(id) === String(userData?.id);

	const getErrorMessage = (response: any, fallback: string) => {
		if (typeof response?.error === "string") return response.error;
		if (response?.error?.message) return response.error.message;
		return fallback;
	};

	const regenerateApiKey = async () => {
		if (!userData?.id || !isOwnProfile) return;
		setApiKeyLoading(true);

		try {
			const response = await fetch(
				`${formbarUrl}/api/v1/user/${userData.id}/api/regenerate`,
				{
					method: "POST",
					headers: {
						Authorization: `${accessToken}`,
					},
				},
			);
			const payload = await response.json();
			if (!response.ok || payload?.error) {
				throw new Error(
					getErrorMessage(payload, "Failed to regenerate API key."),
				);
			}

			setApiKey(payload?.data?.apiKey || null);
			messageApi.success("API key regenerated successfully.");
		} catch (err) {
			messageApi.error(
				err instanceof Error
					? err.message
					: "Failed to regenerate API key.",
			);
		} finally {
			setApiKeyLoading(false);
		}
	};

	const updatePin = async () => {
		if (!userData?.id || !isOwnProfile) return;
		if (!/^\d{4,6}$/.test(newPin)) {
			messageApi.error("PIN must be 4-6 numeric digits.");
			return;
		}

		setPinLoading(true);
		try {
			const response = await fetch(
				`${formbarUrl}/api/v1/user/${userData.id}/pin`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `${accessToken}`,
					},
					body: JSON.stringify({
						oldPin: oldPin || undefined,
						pin: newPin,
					}),
				},
			);
			const payload = await response.json();
			if (!response.ok || payload?.error) {
				throw new Error(
					getErrorMessage(payload, "Failed to update PIN."),
				);
			}

			setOldPin("");
			setNewPin("");
			messageApi.success("PIN updated successfully.");
		} catch (err) {
			messageApi.error(
				err instanceof Error ? err.message : "Failed to update PIN.",
			);
		} finally {
			setPinLoading(false);
		}
	};

	const requestPinReset = async () => {
		if (!userData?.id || !isOwnProfile) return;
		setPinResetLoading(true);
		try {
			const response = await fetch(
				`${formbarUrl}/api/v1/user/${userData.id}/pin/reset`,
				{
					method: "POST",
					headers: {
						Authorization: `${accessToken}`,
					},
				},
			);
			const payload = await response.json();
			if (!response.ok || payload?.error) {
				throw new Error(
					getErrorMessage(payload, "Failed to request PIN reset."),
				);
			}

			messageApi.success("PIN reset email sent.");
		} catch (err) {
			messageApi.error(
				err instanceof Error
					? err.message
					: "Failed to request PIN reset.",
			);
		} finally {
			setPinResetLoading(false);
		}
	};

	useEffect(() => {
		if (!userData?.id && !id) return;

		fetch(`${formbarUrl}/api/v1/user/${id ? id : userData?.id}`, {
			method: "GET",
			headers: {
				Authorization: `${accessToken}`,
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				if (response.error) {
					Log({
						message: "Error fetching profile data",
						data: response.error,
						level: "error",
					});
					setError(
						typeof response.error === "string"
							? response.error
							: response.error.message || "Unknown error",
					);
					return;
				}

				setProfileProps({
					"Display Name": data.displayName || "N/A",
					Email: data.email || "N/A",
					Digipogs:
						data.digipogs || data.digipogs == 0
							? data.digipogs
							: "N/A",
					ID: data.id || "N/A",

					"Pog Meter":
						data.pogMeter && data.pogMeter > 0
							? data.pogMeter / 5
							: 0,
				});
				setError(null);
			})
			.catch((err) => {
				Log({
					message: "Error fetching profile data",
					data: err,
					level: "error",
				});
				setError("Error fetching profile data");
			});
	}, [userData, id, accessToken]);

	return (
		<>
			{contextHolder}
			<FormbarHeader />

			<Flex
				align="center"
				justify="center"
				style={{ padding: "20px", height: "100%", width: "100%" }}
			>
				{!error && (
					<Card
						style={{
							width: "300px",
							position: "absolute",
							top: "80px",
							left: "50%",
							transform: "translateX(-50%)",
						}}
						loading={profileProps["Pog Meter"] === undefined}
					>
						{profileProps["Pog Meter"] !== undefined && (
							<Flex
								vertical
								gap={10}
								style={{ textAlign: "center" as "center" }}
							>
								<strong>Pog Meter:</strong>
								<div style={infoStyle}>
									<Tooltip
										title={`${profileProps["Pog Meter"]}%`}
										placement="top"
										color="#aa68d0"
									>
										<Progress
											percent={
												profileProps[
													"Pog Meter"
												] as number
											}
											strokeColor={{
												"0%": "#108ee9",
												"100%": "#aa68d0",
											}}
											size={["", 40]}
											styles={{
												rail: {
													borderRadius: "10px",
													padding: "3px",
												},
												track: {
													position: "relative",
													height: "100%",
													borderRadius: "7px",
												},
											}}
											showInfo={false}
										/>
									</Tooltip>
								</div>
							</Flex>
						)}
					</Card>
				)}

				<Card
					style={{ margin: "20px", width: "600px" }}
					loading={error === null && !profileProps["Display Name"]}
				>
					<Flex
						vertical
						align="center"
						justify="center"
						style={{
							padding: "10px",
							minWidth: isMobile() ? "300px" : "500px",
						}}
						gap={15}
					>
						{error && (
							<Text
								style={{
									textAlign: "center",
									marginTop: "20px",
									color: "red",
								}}
							>
								Error: {error}
							</Text>
						)}
						{!error && (
							<h2
								style={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
									gap: "10px",
									width: "100%",
								}}
							>
								<Button
									variant="solid"
									color="blue"
									onClick={() => {
										navigate(
											id
												? `/profile/${id}/transactions`
												: "/profile/transactions",
										);
									}}
									style={{ width: "130px" }}
								>
									Transactions
								</Button>
								Your Profile
								<Button
									variant="solid"
									color="blue"
									onClick={() => navigate("/pools")}
									style={{ width: "130px" }}
									disabled
								>
									Pog Pools
								</Button>
							</h2>
						)}

						{!error &&
							Object.entries(profileProps).map(([key, value]) =>
								key == "Pog Meter" || value == "N/A" ? null : (
									<p key={key} style={infoStyle}>
										<strong>{key}:</strong>
										{value}
									</p>
								),
							)}

						{!error && (
							<div
								style={{ width: "100%" }}
								onClick={() => {
									if (!isOwnProfile || showSensitiveInfo) return;
									setSensModalOpen(true);
								}}
							>
								<Collapse
									style={{ width: "100%" }}
									activeKey={sensitiveActiveKeys}
									onChange={(keys) => {
										const normalized = Array.isArray(keys)
											? keys.map(String)
											: [String(keys)];
										setSensitiveActiveKeys(
											normalized.filter(Boolean),
										);
									}}
									expandIcon={({ isActive }) => (
										<IonIcon
											icon={
												isActive
													? IonIcons.lockOpen
													: IonIcons.lockClosed
											}
										/>
									)}
									collapsible={
										!isOwnProfile
											? "header"
											: showSensitiveInfo
												? "header"
												: "disabled"
									}
									size="small"
									items={[
										{
											children: (
												<Flex vertical gap={12}>
													{!isOwnProfile && (
														<Text type="secondary">
															Sensitive settings are
															only available on your
															own profile.
														</Text>
													)}
													{isOwnProfile && (
														<>
															<Flex
																vertical
																gap={8}
															>
																<Text strong>
																	API Key
																</Text>
																<Button
																	type="primary"
																	onClick={
																		regenerateApiKey
																	}
																	loading={
																		apiKeyLoading
																	}
																>
																	Regenerate
																	API Key
																</Button>
																{apiKey && (
																	<Text
																		copyable={{
																			text: apiKey,
																		}}
																	>
																		New key:{" "}
																		{apiKey}
																	</Text>
																)}
															</Flex>

															<Flex
																vertical
																gap={8}
															>
																<Text strong>
																	Update PIN
																</Text>
																<Input.Password
																	placeholder="Current PIN (if set)"
																	value={oldPin}
																	onChange={(e) =>
																		setOldPin(
																			e
																				.target
																				.value,
																		)
																	}
																/>
																<Input.Password
																	placeholder="New PIN (4-6 digits)"
																	value={newPin}
																	onChange={(e) =>
																		setNewPin(
																			e
																				.target
																				.value,
																		)
																	}
																/>
																<Button
																	type="primary"
																	onClick={
																		updatePin
																	}
																	loading={
																		pinLoading
																	}
																>
																	Update PIN
																</Button>
																<Button
																	onClick={() => {
																		setShowSensitiveInfo(
																			false,
																		);
																		setSensitiveActiveKeys(
																			[],
																		);
																	}}
																>
																	Lock
																	Sensitive
																	Info
																</Button>
															</Flex>
														</>
													)}
												</Flex>
											),
											key: "1",
											label: "Sensitive Information",
										},
									]}
								/>
							</div>
						)}
						<Modal
							title="Show sensitive information"
							okText="Show"
							cancelText="Cancel"
							open={sensModalOpen}
							onCancel={() => {
								setSensModalOpen(false);
								setEnteredPin("");
							}}
							onOk={() => {
								if (!/^\d{4,6}$/.test(enteredPin)) {
									messageApi.error(
										"Enter a valid 4-6 digit PIN.",
									);
									return;
								}

								setShowSensitiveInfo(true);
								setSensitiveActiveKeys(["1"]);
								setSensModalOpen(false);
								setEnteredPin("");
							}}
							closeIcon={<IonIcon icon={IonIcons.close} />}
						>
							<Flex vertical gap={10} justify="start" align="start">
								<Text>
									Enter your PIN to view sensitive account
									information.
								</Text>
								<Input.Password
									placeholder="PIN"
									value={enteredPin}
									onChange={(e) =>
										setEnteredPin(
											e.target.value.replace(/\D/g, ""),
										)
									}
									maxLength={6}
								/>
								<Link
									onClick={() => {
										requestPinReset();
									}}
									style={{ fontSize: "12px" }}
								>
									Forgot PIN?
								</Link>
								{pinResetLoading && (
									<Text type="secondary">
										Sending PIN reset email...
									</Text>
								)}
							</Flex>
						</Modal>
					</Flex>
				</Card>
			</Flex>
		</>
	);
}

const infoStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "row",
	justifyContent: "space-between",
	alignItems: "center",
	width: "100%",
};
