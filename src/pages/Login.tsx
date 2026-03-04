import {
	Button,
	Card,
	Divider,
	Flex,
	Input,
	Segmented,
	Typography,
	notification,
} from "antd";
import FormbarHeader from "../components/FormbarHeader";
import Log from "../debugLogger";
import { useState } from "react";
const { Title } = Typography;
import { useEffect } from "react";
import { socket, socketLogin, accessToken } from "../socket";

import { useMobileDetect, useUserData } from "../main";
import { formbarUrl } from "../socket";
import { useNavigate, useLocation } from "react-router-dom";

import { useTheme } from "../main";

export default function LoginPage() {
	const { isDark } = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const { userData } = useUserData();

	const [mode, setMode] = useState("Login");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isMobileView = useMobileDetect();
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	const [googleOauthEnabled, setGoogleOauthEnabled] = useState(false);

	// If a third-party app (e.g. Jukebar) redirected the user here it will pass
	// ?redirectURL=<callback>.  After login we redirect back with the access token.
	const redirectURL = new URLSearchParams(location.search).get("redirectURL");

	// Login and Sign Up modes only
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	// Guest and Sign Up modes only
	const [displayName, setDisplayName] = useState("");

	// Sign Up mode only
	const [confirmPassword, setConfirmPassword] = useState("");

	const [api, contextHolder] = notification.useNotification();

	const showErrorNotification = (message: string) => {
		api["error"]({
			title: "Error",
			description: message,
			placement: "bottom",
		});
	};

	async function handleSubmit(e?: React.FormEvent) {
		e?.preventDefault();
		setIsSubmitting(true);
		try {
		// Handle form submission based on mode
		switch (mode) {
			case "Login":
				Log({ message: "Logging in", data: { email, password } });

				const formData = new URLSearchParams();
				formData.append("email", email);
				formData.append("password", password);
				formData.append("loginType", "login");

				localStorage.setItem("formbarLoginData", formData.toString());

				const storedLoginData = localStorage.getItem("formbarLoginData");
				Log({ message: "Stored login data", data: storedLoginData });

				const loginResponse = await fetch(
					`${formbarUrl}/api/v1/auth/login`,
					{
						method: "POST",
						headers: { "Content-Type": "application/x-www-form-urlencoded" },
						body: formData.toString(),
					},
				);
				if (!loginResponse.ok) {
					const errorData = await loginResponse.json();
					showErrorNotification(
						errorData.error.message || "Login failed",
					);
					throw new Error("Login failed");
				}
				const loginData = await loginResponse.json();
				const { data } = loginData;
				let { accessToken: loginAccessToken, refreshToken: loginRefreshToken, legacyToken: loginLegacyToken } = data;
				Log({ message: "Login successful", data: loginData });

				// If we were sent here by a third-party app redirect back to it.
				// On the /oauth path use the legacy token (includes permissions) so that
				// older apps like Jukebar that read tokenData.permissions still work.
				if (redirectURL) {
					const target = new URL(redirectURL);
					const tokenForRedirect = location.pathname === "/oauth" && loginLegacyToken
						? loginLegacyToken
						: loginAccessToken;
					target.searchParams.set("token", tokenForRedirect);
					window.location.href = target.toString();
					break;
				}

				// Establish the socket session. onConnect in main.tsx will fetch
				// user data and navigate away from the login page.
				socketLogin(loginRefreshToken);
				break;
			case "Sign Up":
				Log({
					message: "Signing up",
					data: { displayName, email, password, confirmPassword },
				});

				if (displayName.length < 4)
					return Log({
						message:
							"displayName must be at least 4 characters long",
						level: "error",
					});
				if (!emailRegex.test(email))
					return Log({
						message: "Invalid email format",
						level: "error",
					});
				if (password !== confirmPassword)
					return Log({
						message: "Passwords do not match",
						level: "error",
					});

				const signupResponse = await fetch(
					`${formbarUrl}/api/v1/auth/register`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email, password, displayName }),
					},
				);
				if (!signupResponse.ok) {
					const errorData = await signupResponse.json();
					showErrorNotification(
						errorData.error.message || "Signup failed",
					);
					throw new Error("Signup failed", errorData.error.message);
				}
				const signUpData = await signupResponse.json();
				const { data: signupData } = signUpData;
				Log({ message: "Signup successful", data: signUpData });

				const signUpformData = new URLSearchParams();
				signUpformData.append("email", email);
				signUpformData.append("password", password);
				signUpformData.append("loginType", "signup");
				localStorage.setItem("formbarLoginData", signUpformData.toString());

				// Establish the socket session. onConnect in main.tsx will fetch
				// user data and navigate away from the login page.
				socketLogin(signupData.refreshToken);
				break;

			case "Guest":
				Log({ message: "Continuing as guest", data: { displayName } });
				// Add guest logic here
				break;
		}
		} catch (err) {
			Log({ message: "Form submission error", data: err, level: "error" });
			if (!(err instanceof Error && err.message === "Login failed") &&
				!(err instanceof Error && err.message === "Signup failed")) {
				showErrorNotification("Something went wrong. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	// Fetch server config to determine which login methods are available
	useEffect(() => {
		fetch(`${formbarUrl}/api/v1/config`)
			.then((r) => r.json())
			.then((payload) => {
				setGoogleOauthEnabled(Boolean(payload?.data?.googleOauthEnabled));
			})
			.catch(() => {/* config unavailable – hide Google button */});
	}, []);

	// Handle the Google OAuth redirect callback.
	// After Google auth the server redirects back here with tokens in the URL.
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const oauthRefreshToken = params.get("refreshToken");
		if (oauthRefreshToken) {
			Log({ message: "Google OAuth callback – logging in via token", data: {} });
			// Wipe tokens from the URL immediately while staying on the same route
			params.delete("accessToken");
			params.delete("refreshToken");
			const cleanedSearch = params.toString();
			navigate(
				{
					pathname: location.pathname,
					search: cleanedSearch ? `?${cleanedSearch}` : "",
				},
				{ replace: true },
			);
			socketLogin(oauthRefreshToken);
		}
	}, [location.pathname, location.search, navigate]);

	//? Check if user is already logged in
	useEffect(() => {
		if (socket?.connected && userData) {
			// On the /oauth path: if a redirectURL is present, complete the OAuth
			// flow immediately using the current access token so the user doesn't
			// have to log in again.
			if (redirectURL && location.pathname === "/oauth") {
				const target = new URL(redirectURL);
				target.searchParams.set("token", accessToken);
				window.location.href = target.toString();
				return;
			}
			// For all other cases (including /oauth without a redirectURL),
			// only bounce away from /login — stay on /oauth so the user can
			// still interact with the page.
			if (location.pathname === "/login" || location.pathname === "/oauth") {
				navigate("/");
			}
		}
	}, [location.pathname, navigate, redirectURL, userData, socket]);

	return (
		<>
			{contextHolder}
			<FormbarHeader />
			<Flex
				vertical
				justify="center"
				align="center"
				style={{ height: "100%", margin: "auto" }}
			>
				<Flex
					vertical
					align="center"
					justify="center"
					style={{
						width: isMobileView ? "calc(100% - 32px)" : "480px",
						animation: "slideInUp 0.4s ease both",
					}}
					gap={24}
				>
					{/* Logo + Title */}
					<Flex vertical align="center" gap={8}>
						<img
							src="/img/FormbarLogo-Circle.png"
							alt="Formbar Logo"
							style={{
								height: isMobileView ? 56 : 72,
								filter: "drop-shadow(0 4px 20px rgba(59,130,246,0.5))",
								marginBottom: 4,
							}}
						/>
						{isMobileView ? (
							<Title style={{ fontWeight: 400, fontSize: "7vw", margin: 0, textAlign: "center" }}>
								Welcome to&nbsp;
								<span style={{ fontWeight: 800 }}>
									<span className="bounce">F</span>
									<span className="bounce">o</span>
									<span className="bounce">r</span>
									<span className="bounce">m</span>
									<span className="bounce">b</span>
									<span className="bounce">a</span>
									<span className="bounce">r</span>
								</span>
							</Title>
						) : (
							<Title style={{ fontWeight: 300, fontSize: 38, margin: 0, textAlign: "center", letterSpacing: "-0.02em" }}>
								Welcome to{" "}
								<span style={{ fontWeight: 800 }}>
									<span className="bounce">F</span>
									<span className="bounce">o</span>
									<span className="bounce">r</span>
									<span className="bounce">m</span>
									<span className="bounce">b</span>
									<span className="bounce">a</span>
									<span className="bounce">r</span>
								</span>
							</Title>
						)}
					</Flex>

					{/* Mode switcher */}
					<Segmented
						options={["Login", "Sign Up"]}
						onChange={setMode}
						value={mode}
						style={{ width: "100%" }}
					/>

					{/* Auth Card */}
					<Card
						style={{
							width: "100%",
							backdropFilter: "blur(20px)",
							WebkitBackdropFilter: "blur(20px)",
							border: isDark
								? "1px solid rgba(255,255,255,0.1)"
								: "1px solid rgba(0,0,0,0.08)",
							boxShadow: isDark
								? "0 8px 40px rgba(0,0,0,0.4), 0 0 60px rgba(59,130,246,0.08)"
								: "0 8px 40px rgba(0,0,0,0.1), 0 0 60px rgba(37,99,235,0.06)",
							borderRadius: 20,
						}}
						styles={{
							body: { padding: "28px 32px" },
						}}
					>
						<form onSubmit={handleSubmit}>
							<Flex vertical gap={12}>
								{(mode === "Guest" || mode === "Sign Up") && (
									<Input
										size="large"
										placeholder="Display Name"
										prefix={<span style={{ opacity: 0.5, marginRight: 4 }}>👤</span>}
										style={{
											color: displayName.length > 3
												? isDark ? "#e8edf5" : "#1a202c"
												: displayName.length > 0 ? "#ef4444" : undefined,
										}}
										value={displayName}
										onChange={(e) => setDisplayName(e.target.value)}
									/>
								)}

								{mode !== "Guest" && (
									<>
										<Input
											size="large"
											placeholder="Email address"
											prefix={<span style={{ opacity: 0.5, marginRight: 4 }}>✉️</span>}
											style={{
												color: emailRegex.test(email) || email.length === 0
													? isDark ? "#e8edf5" : "#1a202c"
													: "#ef4444",
											}}
											value={email}
											onChange={(e) => setEmail(e.target.value)}
										/>
										<Input.Password
											size="large"
											placeholder="Password"
											prefix={<span style={{ opacity: 0.5, marginRight: 4 }}>🔒</span>}
											style={{
												color: password.length >= 5
													? isDark ? "#e8edf5" : "#1a202c"
													: password.length > 0 ? "#ef4444" : undefined,
											}}
											value={password}
											onChange={(e) => setPassword(e.target.value)}
										/>
									</>
								)}

								{mode === "Sign Up" && (
									<Input.Password
										size="large"
										placeholder="Confirm Password"
										prefix={<span style={{ opacity: 0.5, marginRight: 4 }}>🔒</span>}
										styles={{
											root: {
												color: password === confirmPassword && confirmPassword.length >= 5
													? isDark ? "#e8edf5" : "#1a202c"
													: confirmPassword.length > 0 ? "#ef4444" : undefined,
											},
										}}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
									/>
								)}

								<Button
									htmlType="submit"
									type="primary"
									size="large"
									loading={isSubmitting}
									style={{
										width: "100%",
										height: 48,
										marginTop: 4,
										fontWeight: 600,
										fontSize: 16,
										letterSpacing: "0.01em",
										borderRadius: 12,
										boxShadow: isDark
											? "0 4px 20px rgba(59,130,246,0.4)"
											: "0 4px 20px rgba(37,99,235,0.25)",
									}}
									disabled={
										isSubmitting || (
										mode === "Login"
											? !(email && password && emailRegex.test(email) && password.length >= 5)
											: mode === "Sign Up"
												? !(displayName && email && emailRegex.test(email) && password && confirmPassword && password === confirmPassword && displayName.length > 3 && password.length >= 5 && confirmPassword.length >= 5)
												: mode === "Guest"
													? !(displayName && displayName.length > 3)
													: true
										)
									}
								>
									{mode === "Guest" ? "Continue as Guest" : mode}
								</Button>
							</Flex>
						</form>
					</Card>

					{/* Google OAuth */}
					{googleOauthEnabled && (
						<>
							<Divider style={{ margin: "0", opacity: 0.5 }}>or continue with</Divider>
							<Button
								size="large"
								style={{
									width: "100%",
									height: 48,
									fontWeight: 500,
									borderRadius: 12,
									backdropFilter: "blur(10px)",
									border: isDark
										? "1px solid rgba(255,255,255,0.12)"
										: "1px solid rgba(0,0,0,0.1)",
									background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)",
								}}
								icon={
									<img
										src="https://www.google.com/favicon.ico"
										alt="Google"
										style={{ width: 18, height: 18, verticalAlign: "middle" }}
									/>
								}
								onClick={() => {
									window.location.href = `${formbarUrl}/api/v1/auth/google?origin=${encodeURIComponent(window.location.href)}`;
								}}
							>
								Sign in with Google
							</Button>
						</>
					)}
				</Flex>
			</Flex>
		</>
	);
}
