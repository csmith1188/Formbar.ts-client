import FormbarHeader from "@components/FormbarHeader";
import Log from "@utils/debugLogger";
import {
	Collapse,
	Card,
	Flex,
	Typography,
	Button,
	Input,
	message,
	Modal,
    Space,
	InputNumber,
} from "antd";
const { Title, Text, Link } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserData, useSettings, useMobileDetect } from "@/main";
import CountUp from 'react-countup';
import { getMe, getUser, regenerateUserApiKey, requestUserPinReset, updateUserPin, verifyUserPin } from "@api/userApi";
import { transferDigipogs } from "@/api/digipogApi";
import { currentUserHasScope } from "@/utils/scopeUtils";

export default function Profile() {
    const { settings } = useSettings();
	const { userData } = useUserData();
	const [messageApi, contextHolder] = message.useMessage();
	const navigate = useNavigate();
	const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
	const [sensitiveActiveKeys, setSensitiveActiveKeys] = useState<string[]>(
		[],
	);
	const [sensModalOpen, setSensModalOpen] = useState(false);
	const [firstPinModalOpen, setFirstPinModalOpen] = useState(false);

	const [transferDigipog, setTransferDigipog] = useState(0);
	const [transferDigipogPin, setTransferDigipogPin] = useState("");
	const [transferDigipogReason, setTransferDigipogReason] = useState("");
	const [transferDigipogModalOpen, setTransferDigipogModalOpen] = useState(false);

	const [enteredPin, setEnteredPin] = useState("");
	const [firstPin, setFirstPin] = useState("");
	const [hasPin, setHasPin] = useState<boolean | null>(null);

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
	const [pinVerifyLoading, setPinVerifyLoading] = useState(false);
    const isMobile = useMobileDetect();

	const { id } = useParams<{ id?: string }>();
	const isOwnProfile = !id || String(id) === String(userData?.id);
	const isGuestProfile = Boolean(isOwnProfile && userData?.isGuest);
	const showGuestActions = !isGuestProfile;
	const showSensitiveSection = isOwnProfile && !isGuestProfile;

	const canTransferDigipogs = isOwnProfile && !isGuestProfile && currentUserHasScope(userData, "global.digipogs.transfer");

	const getErrorMessage = (response: unknown, fallback: string) => {
		const errorResponse = response as {
			error?: string | { message?: string };
		};
		if (typeof errorResponse?.error === "string") return errorResponse.error;
		if (errorResponse?.error?.message) return errorResponse.error.message;
		return fallback;
	};

    const fakeApiKey = () => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 80; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return result;
    }

	const regenerateApiKey = async () => {
		if (!userData?.id || !isOwnProfile) return;
		setApiKeyLoading(true);

		try {
			const response = await regenerateUserApiKey(String(userData.id));
			if (!response.ok || response?.error) {
				throw new Error(
					getErrorMessage(response, "Failed to regenerate API key."),
				);
			}

			setApiKey(response?.data?.apiKey || null);
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
			const response = await updateUserPin(String(userData.id), { oldPin: oldPin || undefined, pin: newPin });
			if (!response.ok || response?.error) {
				throw new Error(
					getErrorMessage(response, "Failed to update PIN."),
				);
			}

			setOldPin("");
			setNewPin("");
			setHasPin(true);
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
            const data = await requestUserPinReset(String(userData.id));
			if (!data.ok || data?.error) {
				throw new Error(
					getErrorMessage(data, "Failed to request PIN reset."),
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

	const verifySensitiveInfoPin = async () => {
		if (!userData?.id || !isOwnProfile) return;
		if (hasPin === false) {
			setSensModalOpen(false);
			setEnteredPin("");
			setShowSensitiveInfo(false);
			setSensitiveActiveKeys([]);
			setFirstPinModalOpen(true);
			return;
		}
		if (!/^\d{4,6}$/.test(enteredPin)) {
			messageApi.error("Enter a valid 4-6 digit PIN.");
			return;
		}

		setPinVerifyLoading(true);
		try {
            await verifyUserPin(String(userData.id), { pin: enteredPin });

			setShowSensitiveInfo(true);
			setSensitiveActiveKeys(["1"]);
			setSensModalOpen(false);
			setEnteredPin("");
		} catch (err) {
			let message = "Failed to verify PIN.";
			if (err instanceof Error) {
				try {
					message = JSON.parse(err.message).error?.message || err.message;
				} catch {
					message = err.message || message;
				}
			}
			
			if (message.toLowerCase().includes("no pin is set")) {
				setHasPin(false);
				setSensModalOpen(false);
				setEnteredPin("");
				setShowSensitiveInfo(false);
				setSensitiveActiveKeys([]);
				setFirstPinModalOpen(true);
				return;
			}

			messageApi.error(
				message
			);
		} finally {
			setPinVerifyLoading(false);
		}
	};

	const createFirstPin = async () => {
		if (!userData?.id || !isOwnProfile) return;
		if (!/^\d{4,6}$/.test(firstPin)) {
			messageApi.error("PIN must be 4-6 numeric digits.");
			return;
		}

		setPinLoading(true);
		try {
            const data = await updateUserPin(String(userData.id), { pin: firstPin });
			if (!data.ok || data?.error) {
				throw new Error(
					getErrorMessage(data, "Failed to update PIN."),
				);
			}

			setFirstPin("");
			setHasPin(true);
			setFirstPinModalOpen(false);
			setShowSensitiveInfo(true);
			setSensitiveActiveKeys(["1"]);
			messageApi.success("PIN created successfully.");
		} catch (err) {
			messageApi.error(
				err instanceof Error ? err.message : "Failed to create PIN.",
			);
		} finally {
			setPinLoading(false);
		}
	};

	useEffect(() => {
		if (!userData?.id && !id) return;

        const loadProfile = async () => {
            const response = isGuestProfile
				? await getMe()
				: await getUser(id ? String(id) : String(userData?.id));

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
				Email: isGuestProfile ? "N/A" : data.email || "N/A",
				"Digipogs":
					!isGuestProfile ? data.digipogs || data.digipogs == 0
						? data.digipogs
						: "N/A" : "N/A",
				ID: data.id || "N/A",

				"Pog Meter":
					data.pogMeter && data.pogMeter > 0
						? data.pogMeter / 5
						: 0,
			});
			setHasPin(
				isGuestProfile
					? false
					: typeof data?.hasPin === "boolean"
						? data.hasPin
						: null,
			);
			setError(null);
		};

        loadProfile().catch((err) => {
				Log({
					message: "Error fetching profile data",
					data: err,
					level: "error",
				});
				setHasPin(null);
				setError("Error fetching profile data");
			});
	}, [userData, id, isGuestProfile]);

	return (
		<>
			{contextHolder}
			<FormbarHeader />

			{
				Number(profileProps["Pog Meter"]) > 0 &&(
					<div style={{
						position: 'fixed',
						bottom: -10,
						width: '100%',
						height: `calc(${Number(profileProps["Pog Meter"]) / 100 * 88}% + 10px)`,
						animation: '1s pogMeterBop forwards infinite',
						background: 'linear-gradient(180deg, rgba(16, 143, 233, 0.5) 0%, rgba(170, 104, 208, 0.5) 100%)',
						pointerEvents: 'none',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'start',
						justifyContent: 'end',
					}}>
						<Title
							style={{marginLeft: '20px', fontStyle: 'italic', opacity: 0.5, color: settings.appearance.theme == 'dark' ? 'black' : 'white', zIndex: 2}}
						>Pog Meter</Title>
						<div className="pogMeterWave"
							style={{height:'50px'}}
						></div>
					</div>
				)
			}

			<Flex
				align="center"
				justify="center"
				style={{ padding: "20px", height: "100%", width: "100%" }}
			>
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
							minWidth: isMobile ? "300px" : "500px",
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
                                {
                                    !isMobile && showGuestActions && (
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
                                    )
                                }
								{
									<span style={{textAlign:'center', ...(isMobile && {width: '100%'})}}>{isOwnProfile && !isMobile ? "Your Profile" : "Profile"}</span>
								}
                                {
                                    !isMobile && showGuestActions && (
                                        <Button
                                            variant="solid"
                                            color="blue"
                                            onClick={() => navigate("/pools")}
                                            style={{ width: "130px" }}
                                        >
                                            Pog Pools
                                        </Button>
                                    )   
                                }
								
							</h2>
						)}

                        {
                            isMobile && showGuestActions && (
                                <Flex gap={10} style={{width:'100%'}} justify="center">
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
                            
                                    <Button
                                        variant="solid"
                                        color="blue"
                                        onClick={() => navigate("/pools")}
                                        style={{ width: "130px" }}
                                    >
                                        Pog Pools
                                    </Button>
                                </Flex>
                            )
                        }

						{!error && isGuestProfile && (
							<Text type="secondary" style={{ textAlign: "center" }}>
								Guest accounts are temporary. Profile details are
								limited, and account features like API keys, PINs,
								transactions, and pools are unavailable.
							</Text>
						)}

                        <Flex vertical gap={10} style={isMobile ? {
                            height: sensitiveActiveKeys.includes("1") ? '0' : '120px',
                            width: '100%',
                            overflow: 'hidden',
                            transition: 'height 0.3s ease',
                        } : {
                            width:'100%',
                        }}>
                            {!error &&
                                Object.entries(profileProps).map(([key, value]) =>
                                    key == "Pog Meter" || value == "N/A" ? 
                                    null : key == "Digipogs" && settings.accessibility.disableAnimations === false ? (
                                        <p key={key} style={infoStyle}>
                                            <strong>{key}:</strong>
                                            {<CountUp end={Number(value)} separator={''} duration={1} />}
                                        </p>
                                    )  : (
                                        <p key={key} style={infoStyle}>
                                            <strong>{key}:</strong>
                                            {value}
                                        </p>
                                    ),
                            )}
							{
								!isOwnProfile && canTransferDigipogs && (
									<>
										<Flex justify="center" align="center">
											<Button type="primary" variant="solid" color="blue" onClick={()=>setTransferDigipogModalOpen(true)}>
												Transfer Digipogs
											</Button>
										</Flex>

										<Modal
											title="Transfer Digipogs"
											okText="Transfer"
											cancelText="Cancel"
											open={transferDigipogModalOpen}
											onCancel={() => {
												setTransferDigipogModalOpen(false);
												setTransferDigipog(0);
												setTransferDigipogPin("");
												setTransferDigipogReason("");
											}}
											onOk={() => {
												if (!transferDigipog || transferDigipog <= 0 || !canTransferDigipogs || !userData) {
													return;
												}
												transferDigipogs({from: userData.id, to: Number(profileProps.ID), amount: transferDigipog, pin: transferDigipogPin, reason: transferDigipogReason}).then(() => {
													setTransferDigipogModalOpen(false);
													setTransferDigipog(0);
													setTransferDigipogPin("");
													setTransferDigipogReason("");
												})
											}}
											closeIcon={<IonIcon icon={IonIcons.close} />}
										>
											<Flex
												vertical
												gap={10}
												justify="start"
												align="start"
											>
												<Text>Transfers digipogs from your account to {profileProps['Display Name']}</Text>
												<InputNumber
													style={{width:'100%'}}
													placeholder="Amount"
													value={transferDigipog}
													onChange={(value) => setTransferDigipog(value || 0)}
													min={0}
													

												/>
												<Input
													placeholder="Reason"
													value={transferDigipogReason}
													onChange={(e) => setTransferDigipogReason(e.target.value)}
												/>
												<Input.Password
													placeholder="PIN"
													value={transferDigipogPin}
													onChange={(e) => setTransferDigipogPin(e.target.value)}
												/>
											</Flex>
										</Modal>
									</>
								)
							}
                        </Flex>

						{!error && showSensitiveSection && (
							<div
								style={{ width: "100%" }}
								onClick={() => {
									if (!isOwnProfile || showSensitiveInfo)
										return;
									if (hasPin === false) {
										setFirstPinModalOpen(true);
										return;
									}
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
									collapsible={showSensitiveInfo ? "header" : "disabled"}
									size="small"
									items={[
										{
											children: (
												<Flex vertical gap={12}>
													{!isOwnProfile && (
														<Text type="secondary">
															Sensitive settings
															are only available
															on your own profile.
														</Text>
													)}
													{isOwnProfile && (
														<>
															{hasPin !==
																false && (
																<Flex
																	vertical
																	gap={8}
																>
                                                                    <Flex justify="space-between" align="center">
                                                                        <Text
                                                                            strong
                                                                        >
                                                                            API{!isMobile && " Key"}
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
                                                                    </Flex>
                                                                    {
                                                                        apiKey ? (
                                                                            <Space.Compact style={{height:40}}>
                                                                                <Input disabled value={apiKey}/>
                                                                                <Button style={{height:'100%'}} variant="solid" type="primary" onClick={() => {
                                                                                    window.navigator.clipboard.writeText(apiKey);
                                                                                    messageApi.success("API key copied to clipboard.");
                                                                                }}>Copy</Button>
                                                                            </Space.Compact>
                                                                        ) : (
                                                                            <Input disabled value={fakeApiKey()} style={{height:40, filter:'blur(3px)', pointerEvents:"none"}}/>
                                                                        )
                                                                    }
																</Flex>
															)}

															<Flex
																vertical
																gap={8}
															>
																{hasPin ===
																false ? (
																	<>
																		<Text
																			strong
																		>
																			Set
																			your
																			first
																			PIN
																		</Text>
																		<Text type="secondary">
																			Create
																			a
																			4-6
																			digit
																			PIN
																			to
																			protect
																			sensitive
																			account
																			information.
																		</Text>
																		<Button
																			type="primary"
																			onClick={() =>
																				setFirstPinModalOpen(
																					true,
																				)
																			}
																		>
																			Set
																			PIN
																		</Button>
																	</>
																) : (
																	<>
																		<Text
																			strong
																		>
																			Update
																			PIN
																		</Text>
                                                                        <Flex gap={10} align="center">
                                                                            <Input.Password
                                                                                placeholder="Current PIN"
                                                                                value={
                                                                                    oldPin
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    setOldPin(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                            />
                                                                            <Input.Password
                                                                                placeholder="New PIN"
                                                                                value={
                                                                                    newPin
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    setNewPin(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                            />
                                                                            { !isMobile && (<Button
                                                                                type="primary"
                                                                                onClick={
                                                                                    updatePin
                                                                                }
                                                                                loading={
                                                                                    pinLoading
                                                                                }
                                                                            >
                                                                                Update
                                                                                PIN
                                                                            </Button>)}
                                                                        </Flex>
                                                                        { isMobile && (<Button
                                                                            type="primary"
                                                                            onClick={
                                                                                updatePin
                                                                            }
                                                                            loading={
                                                                                pinLoading
                                                                            }
                                                                        >
                                                                            Update
                                                                            PIN
                                                                        </Button>)}
																	</>
																)}
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
							confirmLoading={pinVerifyLoading}
							onCancel={() => {
								setSensModalOpen(false);
								setEnteredPin("");
							}}
							onOk={verifySensitiveInfoPin}
							closeIcon={<IonIcon icon={IonIcons.close} />}
						>
							<Flex
								vertical
								gap={10}
								justify="start"
								align="start"
							>
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
						<Modal
							title="Set your PIN"
							okText="Save PIN"
							cancelText="Cancel"
							open={firstPinModalOpen}
							confirmLoading={pinLoading}
							onCancel={() => {
								setFirstPinModalOpen(false);
								setFirstPin("");
							}}
							onOk={createFirstPin}
							closeIcon={<IonIcon icon={IonIcons.close} />}
						>
							<Flex
								vertical
								gap={10}
								justify="start"
								align="start"
							>
								<Text>
									No PIN is set on your account yet. Enter a
									4-6 digit PIN to protect sensitive account
									information.
								</Text>
								<Input.Password
									placeholder="New PIN (4-6 digits)"
									value={firstPin}
									onChange={(e) =>
										setFirstPin(
											e.target.value.replace(/\D/g, ""),
										)
									}
									maxLength={6}
								/>
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
