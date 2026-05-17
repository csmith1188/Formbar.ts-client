import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Divider, Flex, Typography } from "antd";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { darkMode, lightMode } from "@/themes/ThemeConfig";
import { authorizeOAuthApp, getOAuthAuthorizationMetadata } from "@api/oauthApi";
import { AppScopes } from "@/types";
import { useSettings, useUserData } from "@/main";

const { Title, Text } = Typography;

interface OAuthPermission {
	key: string;
	label: string;
	description?: string;
	granted: boolean;
}

interface OAuthInfo {
	icon: any;
	text: ReactNode;
}

interface OAuthAppInfo {
	name: string;

	permissions: OAuthPermission[];
	info: {
		redirectUrl: string;
	};
}

type OAuthRequest = {
	clientId: string;
	clientName: string;
	redirectUrl: string;
	responseType: string;
	scope: string;
	state: string;
	permissions: OAuthPermission[];
	errors: string[];
};

const emptyOAuthRequest: OAuthRequest = {
    clientId: "",
    clientName: "Unknown Application",
    redirectUrl: "",
    responseType: "code",
    scope: "",
    state: "",
    permissions: [],
    errors: [],
};

function getScopeMetadata(scopeKey: string): OAuthPermission | null {
	// Find the scope in the AppScopes object
	for (const scope of Object.values(AppScopes)) {
		if (scope.key === scopeKey.toLowerCase()) {
			return {
				key: scope.key,
				label: scope.label,
				description: scope.description,
				granted: true,
			};
		}
		console.log("Checked scope:", scope.key, "against", scopeKey);
	}

	return null;
}

function createPlayfulScope() {
	const scopes = [
		"Read the thoughts of squirrels",
		"Become a Formbob",
		"Enable Jukebar",
		"Summon Hayden",
		"Access the secret Formbar ranch recipe",
		"Send Brody to Venezuela"
	]
	return {
		key: "playful.scope",
		label: scopes[Math.floor(Math.random() * scopes.length)],
		description: "",
		granted: false,
	}
}


function prettifyScopeLabel(scopeKey: string) {
	return scopeKey
		.replace(/[._-]+/g, " ")
		.replace(/\b\w/g, (match) => match.toUpperCase());
}

function getReadableErrorMessage(err: unknown, fallback: string) {
	if (!(err instanceof Error)) {
		return fallback;
	}

	try {
		const parsed = JSON.parse(err.message);
		return parsed?.error?.message || parsed?.message || fallback;
	} catch {
		return err.message || fallback;
	}
}

export default function AuthorizeApp() {
	const { settings } = useSettings();
	const { userData } = useUserData();
	const location = useLocation();
	const navigate = useNavigate();
	const [isAuthorizing, setIsAuthorizing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [oauthRequest, setOauthRequest] = useState<OAuthRequest>(emptyOAuthRequest);
	const theme = settings.appearance.theme === "dark" ? darkMode : lightMode;

	useEffect(() => {
        let cancelled = false;

        (async () => {
            const params = new URLSearchParams(location.search);
            const clientId = params.get("client_id")?.trim() || "";
            const redirectUrl = params.get("redirect_uri")?.trim() || "";
            const scope = params.get("scope")?.trim() || "";
            const state = params.get("state")?.trim() || "";
            const responseType = params.get("response_type")?.trim() || "code";

            const errors = [] as string[];
            if (!clientId) errors.push("Missing client_id.");
            if (!redirectUrl) errors.push("Missing redirect_uri.");
            if (!scope) errors.push("Missing scope.");
            if (!state) errors.push("Missing state.");
            if (responseType !== "code") errors.push("Only response_type=code is supported.");

            let clientName = "Unknown Application";
            let requestedScopes = scope.split(/\s+/).filter(Boolean);
            if (errors.length === 0) {
                try {
                    const appInfoFromServer = await getOAuthAuthorizationMetadata({
                        clientId,
                        redirectUri: redirectUrl,
                        scope,
                        state,
                        responseType,
                    });
                    clientName = appInfoFromServer?.name || clientName;
                    requestedScopes = appInfoFromServer?.requestedScopes || requestedScopes;
                } catch (err) {
                    const message = getReadableErrorMessage(err, "Unable to load OAuth application metadata.");
                    errors.push(message);
                    if (/not authenticated|unauthorized/i.test(message)) {
                        navigate(`/login?returnURL=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
                    }
                }
            }

            const permissions = requestedScopes.map((scopeKey) => {
                const metadata = getScopeMetadata(scopeKey);
                return {
                    key: metadata?.key || scopeKey,
                    label: metadata?.label || prettifyScopeLabel(scopeKey),
                    description: metadata?.description,
                    granted: metadata?.granted || false,
                };
            });

            if (!cancelled) {
                setOauthRequest({
                    clientId,
                    clientName,
                    redirectUrl,
                    responseType,
                    scope,
                    state,
                    permissions,
                    errors,
                });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [location.pathname, location.search, navigate]);

	const appInfo: OAuthAppInfo = {
		name: oauthRequest.clientName,
		permissions: [...oauthRequest.permissions, createPlayfulScope()],
		info: {
			redirectUrl: oauthRequest.redirectUrl,
		},
	};

	const infoItems: OAuthInfo[] = [
		{
			icon: IonIcons.link,
			text: (
				<>
					Once authorized, you will be redirected outside of Formbar to:
					<Text code style={{ fontSize: 16, whiteSpace: "nowrap" }}>
						{appInfo.info.redirectUrl || "unknown destination"}
					</Text>
				</>
			),
		},
		{
			icon: IonIcons.lockClosed,
			text: "This application cannot read your sensitive information, such as your API key, password, or digipog pin.",
		},
	];

	async function handleAuthorize() {
		if (oauthRequest.errors.length > 0) {
			setErrorMessage(oauthRequest.errors[0]);
			return;
		}

		setIsAuthorizing(true);
		setErrorMessage(null);

		try {
			const redirectUrl = await authorizeOAuthApp({
				clientId: oauthRequest.clientId,
				redirectUri: oauthRequest.redirectUrl,
				scope: oauthRequest.scope,
				state: oauthRequest.state,
				responseType: oauthRequest.responseType,
			});

			window.location.assign(redirectUrl);
		} catch (err) {
			const message = getReadableErrorMessage(err, "Unable to authorize the application.");
			setErrorMessage(message);
			if (/not authenticated|unauthorized/i.test(message)) {
				navigate(`/login?returnURL=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
			}
		} finally {
			setIsAuthorizing(false);
		}
	}

	return (
		<Flex
			justify="center"
			align="center"
			style={{
				width: "100%",
				height: "100vh",
				background:
					settings.appearance.theme === "dark"
						? "linear-gradient(rgba(54, 94, 146, 1) 0%, rgba(13, 40, 77, 1) 100%)"
						: "#f0f2f5",
			}}
		>
			<Card
				style={{
					width: "100%",
					maxWidth: "800px",
					background: theme.components.Card.colorBgContainer,
				}}
				styles={{
					body: {
						padding: "32px",
					},
				}}
			>
				<Flex vertical>
					{oauthRequest.errors.length > 0 ? (
						<Alert
							type="error"
							showIcon
							title="Invalid OAuth request"
							description={oauthRequest.errors.join(" ")}
							style={{ marginBottom: 20 }}
						/>
					) : null}
					{errorMessage ? (
						<Alert
							type="error"
							showIcon
							title="Authorization failed"
							description={errorMessage}
							style={{ marginBottom: 20 }}
						/>
					) : null}
					<Flex gap={20} align="stretch">
						<Flex vertical align="center" gap={20} style={{ width: "100%" }}>
							<Flex vertical align="center" gap={12}>
								<Flex gap={12} justify="center" align="center">
									<div
										style={{
											width: "60px",
											height: "60px",
											borderRadius: "50%",
											backgroundImage: "url(/img/FormbarLogo-Circle.png)",
											backgroundSize: "100%",
											opacity: 0.5,
											flexShrink: 0,
										}}
									/>
									<Divider style={{ margin: 0, minWidth: 0, width: 20 }} dashed />
									<div
										style={{
											width: "60px",
											height: "60px",
											borderRadius: "50%",
											backgroundImage: "linear-gradient(135deg, rgba(101, 190, 57, 0.95), rgba(25, 118, 210, 0.95))",
											backgroundSize: "cover",
											backgroundPosition: "center",
											opacity: 0.5,
											flexShrink: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: 24,
											fontWeight: 700,
											color: "white",
										}}
									>
										{appInfo.name.slice(0, 1).toUpperCase()}
									</div>
								</Flex>
								<Text style={{ margin: 0 }}>An external application</Text>
								<Title level={4} style={{ margin: 0 }}>
									{appInfo.name}
								</Title>
								<Text type="secondary" style={{ fontSize: 16 }}>
									wants to access your Formbar account.
								</Text>
								<Text type="secondary" style={{ fontSize: "12px" }}>
									Signed in as {userData?.displayName || "your account"} <Divider vertical /> <Link to="/login">Not you?</Link>
								</Text>
							</Flex>

							<Divider style={{ margin: 0 }} />

							<Flex vertical gap={8} style={{ width: "100%" }}>
								{infoItems.map((item, index) => (
									<Flex key={index} gap={8} align="start">
										<IonIcon
											icon={item.icon}
											style={{
												opacity: 0.5,
												fontSize: 20,
												flexShrink: 0,
											}}
										/>
										<Text type="secondary" style={{ fontSize: 16 }}>
											{item.text}
										</Text>
									</Flex>
								))}
							</Flex>
						</Flex>

						<Divider style={{ margin: "20px 0", height: "unset" }} vertical dashed />

						<Flex vertical gap={16} style={{ width: "100%", height: "unset" }}>
							<Text type="secondary" style={{ margin: 0, fontSize: 16 }}>
								This will allow the Application to:
							</Text>

							<Flex vertical gap={8}>
								{appInfo.permissions.length > 0 ? (
									appInfo.permissions.map((permission) => (
										<Flex
											key={permission.key}
											gap={12}
											align="center"
											justify="stretch"
											style={{ padding: "8px" }}
										>
											<IonIcon
												icon={permission.granted ? IonIcons.checkmarkCircle : IonIcons.closeCircle}
												style={{
													color: permission.granted ? "#65be39ff" : "#c93739ff",
													fontSize: "24px",
													marginTop: "2px",
												}}
											/>
											<Flex vertical gap={0}>
												<Text style={{ fontSize: 18 }}>{permission.label}</Text>
												{permission.description ? (
													<Text type="secondary" style={{ fontSize: 14 }}>
														{permission.description}
													</Text>
												) : null}
											</Flex>
										</Flex>
									))
								) : (
									<Text type="secondary">No scopes were requested.</Text>
								)}
							</Flex>
						</Flex>
					</Flex>

					<Flex gap={12} style={{ width: "100%", marginTop: "12px" }}>
						<Button style={{ flex: 1 }} onClick={() => window.history.back()}>
							Cancel
						</Button>
						<Button
							type="primary"
							loading={isAuthorizing}
							disabled={oauthRequest.errors.length > 0}
							style={{ flex: 1 }}
							onClick={handleAuthorize}
						>
							Authorize
						</Button>
					</Flex>
				</Flex>
			</Card>
		</Flex>
	);
}
