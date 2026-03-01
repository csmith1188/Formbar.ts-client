import {
	StrictMode,
	createContext,
	useState,
	useEffect,
	useContext,
} from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
	BrowserRouter,
	Route,
	Routes,
	useNavigate,
	useLocation,
} from "react-router-dom";
import { ConfigProvider, Modal } from "antd";
import LoadingScreen from "./components/LoadingScreen";

import {
	socket,
	registerSocketEventHandlers,
	formbarUrl,
	socketLogin,
	accessToken,
} from "./socket";

import {
	darkMode,
	lightMode,
	showMobileIfVertical,
	themeColors,
} from "../themes/ThemeConfig";

import "./assets/css/index.css";

import pages from "./pages";
import type { ClassData, CurrentUserData } from "./types";
import Log from "./debugLogger";

export const isDev: boolean = !import.meta.env.PROD;

type ThemeContextType = {
	isDark: boolean;
	toggleTheme: () => void;
};

type UserDataContextType = {
	userData: CurrentUserData | null;
	setUserData: (data: CurrentUserData | null) => void;
};

type ClassDataContextType = {
	classData: ClassData | null;
	setClassData: (data: ClassData | null) => void;
};

type ServerConfig = {
	emailEnabled: boolean;
	googleOauthEnabled: boolean;
};

const connectionTriesLimit = 5;

export const isMobile = () => {
	const userAgent =
		navigator.userAgent || navigator.vendor || (window as any).opera;

	let isMobileBool =
		/android|avantgo|blackberry|bb|playbook|iemobile|ipad|iphone|ipod|kindle|mobile|palm|phone|silk|symbian|tablet|up\.browser|up\.link|webos|windows ce|windows phone/i.test(
			userAgent.toLowerCase(),
		);

	if (window.innerWidth <= 768) {
		isMobileBool = true;
	}

	if (window.innerHeight > window.innerWidth && showMobileIfVertical) {
		isMobileBool = true;
	}

	return isMobileBool;
};

export const useMobileDetect = () => {
	const [isMobileView, setIsMobileView] = useState(isMobile());

	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(isMobile());
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobileView;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) throw new Error("useTheme must be used within ThemeProvider");
	return context;
};

const UserDataContext = createContext<UserDataContextType | undefined>(
	undefined,
);
const ClassDataContext = createContext<ClassDataContextType | undefined>(
	undefined,
);

export const useUserData = () => {
	const context = useContext(UserDataContext);
	if (!context)
		throw new Error("useUserData must be used within UserDataProvider");
	return context;
};

export const useClassData = () => {
	const context = useContext(ClassDataContext);
	if (!context)
		throw new Error("useClassData must be used within ClassDataProvider");
	return context;
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [isDark, setIsDark] = useState(() => {
		const saved = document.cookie
			.split("; ")
			.find((row) => row.startsWith("theme="))
			?.split("=")[1];
		return saved ? saved === "dark" : false;
	});

	useEffect(() => {
		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
		document.cookie = `theme=${isDark ? "dark" : "light"}; expires=${expires.toUTCString()}; path=/`;

		const bodyColor = isDark
			? themeColors.dark.body.background
			: themeColors.light.body.background;
		const bodyTextColor = isDark
			? themeColors.dark.body.color
			: themeColors.light.body.color;
		document.body.style.background = bodyColor;
		document.body.style.color = bodyTextColor;
	}, [isDark]);

	const toggleTheme = () => setIsDark(!isDark);

	return (
		<ThemeContext.Provider value={{ isDark, toggleTheme }}>
			<ConfigProvider theme={isDark ? darkMode : lightMode}>
				{children}
			</ConfigProvider>
		</ThemeContext.Provider>
	);
};

const UserDataProvider = ({ children }: { children: ReactNode }) => {
	const [userData, setUserData] = useState<CurrentUserData | null>(null);

	return (
		<UserDataContext.Provider value={{ userData, setUserData }}>
			{children}
		</UserDataContext.Provider>
	);
};

const ClassDataProvider = ({ children }: { children: ReactNode }) => {
	const [classData, setClassData] = useState<ClassData | null>(null);
	return (
		<ClassDataContext.Provider value={{ classData, setClassData }}>
			{children}
		</ClassDataContext.Provider>
	);
};

const PageWrapper = ({
	pageName,
	children,
}: {
	pageName: string;
	children: ReactNode;
}) => {
	useEffect(() => {
		document.title = `${pageName} - Formbar`;
	}, [pageName]);

	return <>{children}</>;
};

const AppContent = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [modal, contextHolder] = Modal.useModal();
	const [isConnected, setIsConnected] = useState(socket?.connected || false);
	const [socketErrorCount, setSocketErrorCount] = useState(0);
	const [httpErrorCount, setHttpErrorCount] = useState(0);
	const [config, setConfig] = useState<ServerConfig | null>(null);
	const [showVerificationModal, setShowVerificationModal] = useState(false);
	const [verificationRequestLoading, setVerificationRequestLoading] =
		useState(false);
	const { userData, setUserData } = useUserData();
	const publicRoutes = ["/login", "/user/me/pin", "/user/me/password"];

	const fetchConfig = async () => {
		try {
			const configResponse = await fetch(`${formbarUrl}/api/v1/config`, {
				method: "GET",
			});
			const configPayload = await configResponse.json();
			const nextConfig: ServerConfig = {
				emailEnabled: Boolean(configPayload?.data?.emailEnabled),
				googleOauthEnabled: Boolean(
					configPayload?.data?.googleOauthEnabled,
				),
			};
			setConfig(nextConfig);
			return nextConfig;
		} catch (err) {
			Log({
				message: "Error fetching server config",
				data: err,
				level: "error",
			});
			setConfig(null);
			return null;
		}
	};

	const fetchUserData = async () => {
		if (!accessToken) return;

		fetch(`${formbarUrl}/api/v1/user/me`, {
			method: "GET",
			headers: {
				Authorization: `${accessToken}`,
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { data } = response;
				Log({
					message: "User data fetched successfully.",
					data,
					level: "info",
				});
				setUserData(data);
				// If the user has an active class on the server, ensure we re-join it
				if (data && data.activeClass) {
					fetch(`${formbarUrl}/api/v1/class/${data.activeClass}/join`, {
						method: "POST",
						headers: {
							Authorization: `${accessToken}`,
						},
					})
						.then((res) => res.json())
						.then((joinResp) => {
							Log({
								message: "Re-joined active class after reconnect",
								data: joinResp,
							});
							// Request class data via socket
							socket?.emit("classUpdate", "");
						})
						.catch((err) => {
							Log({
								message: "Error rejoining class",
								data: err,
								level: "error",
							});
						});
				}
			})
			.catch((err) => {
				Log({
					message: "Error fetching user data",
					data: err,
					level: "error",
				});
				setHttpErrorCount((prev) => prev + 1);
			});
			const userPayload = await userResponse.json();
			const { data } = userPayload;
			if (userPayload?.error || !data?.id) {
				throw new Error("Failed to load current user data");
			}

			Log({
				message: "User data fetched successfully.",
				data,
				level: "info",
			});
			setUserData(data);

			const serverConfig = config || (await fetchConfig());
			if (!serverConfig?.emailEnabled) {
				setShowVerificationModal(false);
				return;
			}

			const userDetailResponse = await fetch(
				`${formbarUrl}/api/v1/user/${data.id}`,
				{
					method: "GET",
					headers: {
						Authorization: `${accessToken}`,
					},
				},
			);
			const userDetailPayload = await userDetailResponse.json();
			const verified = Number(userDetailPayload?.data?.verified);

			if (!Number.isNaN(verified)) {
				setUserData({ ...data, verified });
			}
			setShowVerificationModal(verified === 0);
		} catch (err) {
			Log({
				message: "Error fetching user data",
				data: err,
				level: "error",
			});
			setHttpErrorCount((prev) => prev + 1);
		}
	};

	const requestVerificationEmail = async () => {
		if (!userData?.id || !accessToken) return;

		setVerificationRequestLoading(true);
		try {
			const response = await fetch(
				`${formbarUrl}/api/v1/user/${userData.id}/verify/request`,
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
					payload?.error?.message ||
						"Failed to request verification email",
				);
			}

			modal.success({
				title: "Verification Email Sent",
				content:
					"Check your inbox and click the verification link to activate your account.",
			});
			setShowVerificationModal(false);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to request verification email.";
			modal.error({
				title: "Verification Request Failed",
				content: message,
			});
		} finally {
			setVerificationRequestLoading(false);
		}
	};

	/*
	 * Re-fetch user data on every page navigation
	 */
	useEffect(() => {
		if (socket?.connected && location.pathname !== "/login") {
			fetchUserData();
		}
	}, [location.pathname]);

	/*
	 * This effect handles initial HTTP connection and pinging the server
	 */
	useEffect(() => {
		let attempts = 0;
		let timeoutId: ReturnType<typeof setTimeout>;

		fetchConfig();

		function pingServer() {
			attempts++;
			setHttpErrorCount(attempts - 1);

			fetch(`${formbarUrl}/api/v1/certs`, { method: "GET" })
				.then((res) => {
					if (res.ok) {
						Log({
							message: "Ping successful.",
							data: res.status,
							level: "info",
						});
						setHttpErrorCount(0);
					} else {
						Log({
							message: "Ping failed with status",
							data: res.status,
							level: "error",
						});
						if (attempts < connectionTriesLimit) {
							timeoutId = setTimeout(pingServer, 1000); // Retry after 1 second
						}
					}
				})
				.catch((err) => {
					Log({
						message: "Error during ping",
						data: err,
						level: "error",
					});
					if (attempts < connectionTriesLimit) {
						timeoutId = setTimeout(pingServer, 1000); // Retry after 1 second
					}
				});
		}

		pingServer();

		return () => {
			clearTimeout(timeoutId);
		};
	}, []);

	useEffect(() => {
		if (!socket?.connected && localStorage.getItem("refreshToken")) {
			socketLogin(localStorage.getItem("refreshToken")!);
		} else if (!localStorage.getItem("refreshToken")) {
			if (!publicRoutes.includes(window.location.pathname)) {
				navigate("/login");
			}
			setIsConnected(true);
		}

		function onConnect() {
			setSocketErrorCount(0); // Reset on successful connection
			Log({ message: "Connected to server.", level: "info" });

			fetchUserData();
			if (window.location.pathname === "/login") {
				navigate("/");
			}
			setIsConnected(true);
		}

		function onSetClass(classID: number) {
			Log({ message: "Class ID set to: " + classID, level: "debug" });
			socket.emit("classUpdate", "");
		}

		function connectError(err: any) {
			Log({ message: "Connection Error", data: err, level: "error" });
			setSocketErrorCount((prev) => {
				const newCount = prev + 1;

				if (newCount >= connectionTriesLimit) {
					Log({
						message:
							"Max socket connection attempts reached. Please check your network or contact support.",
						level: "error",
					});
					socket?.disconnect();
				}
				return newCount;
			});
		}

		function onDisconnect(reason: string) {
			Log({
				message: "Disconnected from server",
				data: { reason },
				level: "warn",
			});
		}

		// Register socket event handlers
		registerSocketEventHandlers({
			onConnect,
			onConnectError: connectError,
			onDisconnect,
			onSetClass,
		});

		return () => {
			socket?.off("connect", onConnect);
			socket?.off("connect_error", connectError);
			socket?.off("disconnect", onDisconnect);
			socket?.off("setClass", onSetClass);
		};
	}, []);

	return (
		<>
			{contextHolder}
			<Modal
				title="Email Verification Required"
				open={showVerificationModal && location.pathname !== "/login"}
				onCancel={() => setShowVerificationModal(false)}
				onOk={requestVerificationEmail}
				okText="Request Verification Email"
				cancelText="Later"
				confirmLoading={verificationRequestLoading}
			>
				<p>
					Your account has not been verified yet. Request a
					verification email to verify your account and unlock
					restricted features.
				</p>
			</Modal>
			<Routes>
				{pages.map((page) => {
					const Element = page.page;
					return (
						<Route
							key={page.routePath}
							path={page.routePath}
							element={
								<PageWrapper pageName={page.pageName}>
									<LoadingScreen
										socketErrors={socketErrorCount}
										httpErrors={httpErrorCount}
										isConnected={isConnected}
									/>
									<Element />
								</PageWrapper>
							}
						/>
					);
				})}
			</Routes>
		</>
	);
};

function App() {
	return (
		<StrictMode>
			<BrowserRouter>
				<ThemeProvider>
					<UserDataProvider>
						<ClassDataProvider>
							<AppContent />
						</ClassDataProvider>
					</UserDataProvider>
				</ThemeProvider>
			</BrowserRouter>
		</StrictMode>
	);
}

createRoot(document.getElementById("root")!).render(<App />);
