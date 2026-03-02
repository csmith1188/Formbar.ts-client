import { Button, Card, Flex, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormbarHeader from "../components/FormbarHeader";
import { formbarUrl } from "../socket";

const { Text, Title } = Typography;

type VerifyState = "idle" | "loading" | "success" | "error";

export default function EmailVerifyPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [state, setState] = useState<VerifyState>("idle");
	const [statusMessage, setStatusMessage] = useState("");

	const code = useMemo(() => searchParams.get("code") || "", [searchParams]);

	useEffect(() => {
		if (!code) {
			setState("error");
			setStatusMessage("Verification code is missing.");
			return;
		}

		let isMounted = true;
		setState("loading");
		setStatusMessage("Verifying your email...");

		fetch(`${formbarUrl}/api/v1/user/verify/email?code=${encodeURIComponent(code)}`, {
			method: "GET",
			headers: {
				Accept: "application/json",
			},
		})
			.then(async (res) => {
				const payload = await res.json();
				if (!res.ok || payload?.error) {
					throw new Error(payload?.error?.message || "Email verification failed.");
				}

				if (!isMounted) return;
				setState("success");
				setStatusMessage(payload?.data?.message || "Email verified successfully.");
			})
			.catch((err) => {
				if (!isMounted) return;
				setState("error");
				setStatusMessage(err instanceof Error ? err.message : "Email verification failed.");
			});

		return () => {
			isMounted = false;
		};
	}, [code]);

	return (
		<>
			<FormbarHeader />
			<Flex justify="center" align="center" style={{ minHeight: "calc(100vh - 60px)", padding: "24px" }}>
				<Card style={{ width: "100%", maxWidth: 520 }}>
					<Flex vertical gap={12}>
						<Title level={3} style={{ marginBottom: 0 }}>
							Email Verification
						</Title>
						<Text
							type={state === "error" ? "danger" : state === "success" ? "success" : undefined}
						>
							{statusMessage || "Preparing verification..."}
						</Text>
						{state !== "loading" && (
							<Button type="primary" onClick={() => navigate("/login")}>
								Go to Login
							</Button>
						)}
					</Flex>
				</Card>
			</Flex>
		</>
	);
}
