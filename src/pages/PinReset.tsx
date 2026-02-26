import { Button, Card, Flex, Input, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormbarHeader from "../components/FormbarHeader";
import { formbarUrl } from "../socket";

const { Text, Title } = Typography;

export default function PinResetPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [messageApi, contextHolder] = message.useMessage();

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
			messageApi.error("Reset token is missing.");
			return;
		}
		if (!/^\d{4,6}$/.test(pin)) {
			messageApi.error("PIN must be 4-6 numeric digits.");
			return;
		}
		if (pin !== confirmPin) {
			messageApi.error("PIN values do not match.");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${formbarUrl}/api/v1/user/pin/reset`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ pin, token }),
			});
			const payload = await response.json();
			if (!response.ok || payload?.error) {
				throw new Error(
					payload?.error?.message || payload?.error || "PIN reset failed.",
				);
			}

			setResetComplete(true);
			messageApi.success("PIN reset successfully.");
		} catch (err) {
			messageApi.error(
				err instanceof Error ? err.message : "PIN reset failed.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{contextHolder}
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
