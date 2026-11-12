import { Button, Card, Flex, Input, Typography } from "antd";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormbarHeader from "@components/FormbarHeader";
import { resetPinWithToken } from "@api/userApi";
import { useGlobalMessage } from "@/components/providers/GlobalMessageProvider";

const { Text, Title } = Typography;

export default function PinResetPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const globalMessageAPI = useGlobalMessage();

	const token = useMemo(
		() => searchParams.get("code") || searchParams.get("token") || "",
		[searchParams],
	);

	const [pin, setPin] = useState("");
	const [confirmPin, setConfirmPin] = useState("");
	const [loading, setLoading] = useState(false);
	const [resetComplete, setResetComplete] = useState(false);

	const submit = async () => {
		if (!token) {
			globalMessageAPI.error("Reset token is missing.");
			return;
		}
		if (!/^\d{4,6}$/.test(pin)) {
			globalMessageAPI.error("PIN must be 4-6 numeric digits.");
			return;
		}
		if (pin !== confirmPin) {
			globalMessageAPI.error("PIN values do not match.");
			return;
		}

		setLoading(true);
		try {
			const response = await resetPinWithToken(pin, token);
			if (!response.ok || response?.error) {
				throw new Error(
					response?.error?.message ||
						response?.error ||
						"PIN reset failed.",
				);
			}

			setResetComplete(true);
			globalMessageAPI.success("PIN reset successfully.");
		} catch (err) {
			globalMessageAPI.error(
				err instanceof Error ? err.message : "PIN reset failed.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<FormbarHeader />
			<Flex
				justify="center"
				align="center"
				style={{ minHeight: "calc(100vh - 60px)", padding: "24px" }}
			>
				<Card style={{ width: "100%", maxWidth: 520 }}>
					<Flex vertical gap={12}>
						<Title level={3} style={{ marginBottom: 0 }}>
							Reset PIN
						</Title>
						{!token && (
							<Text type="danger">
								Invalid or missing reset code. Request a new PIN
								reset email.
							</Text>
						)}
						{token && !resetComplete && (
							<>
								<Text>
									Enter a new 4-6 digit PIN for your account.
								</Text>
								<Input.Password
									placeholder="New PIN"
									maxLength={6}
									value={pin}
									onChange={(e) =>
										setPin(
											e.target.value.replace(/\D/g, ""),
										)
									}
								/>
								<Input.Password
									placeholder="Confirm PIN"
									maxLength={6}
									value={confirmPin}
									onChange={(e) =>
										setConfirmPin(
											e.target.value.replace(/\D/g, ""),
										)
									}
								/>
								<Button
									type="primary"
									onClick={submit}
									loading={loading}
								>
									Reset PIN
								</Button>
							</>
						)}
						{resetComplete && (
							<>
								<Text>Your PIN has been reset.</Text>
								<Button
									type="primary"
									onClick={() => navigate("/login")}
								>
									Go to Login
								</Button>
							</>
						)}
					</Flex>
				</Card>
			</Flex>
		</>
	);
}
