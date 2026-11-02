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
import { Button, ConfigProvider, Modal, Space, Typography } from "antd";
import LoadingScreen from "@components/LoadingScreen";
import { GlobalMessageProvider } from "@/components/providers/GlobalMessageProvider";

import {
	socket,
	registerSocketEventHandlers,
	socketLogin,
	accessToken,
} from "@utils/socket";
import { clearAuthTokens, getGuestAccessToken } from "@api/authApi";

import {
	darkMode,
	highContrastMode,
	lightMode,
	showMobileIfVertical,
	themeColors,
} from "@/themes/ThemeConfig";

import "@assets/css/index.css";

import pages from "@/pages";
import type { ClassData, CurrentUserData, NotificationData } from "@/types";
import Log from "@utils/debugLogger";
import { getMe, getUser, requestUserVerificationEmail } from "@api/userApi";
import { getPublicKey, getServerConfig } from "@api/systemApi";
import type { ColorVisionMode } from "@utils/accessibilityColors";
import { getNotifications } from "./api/notificationApi";

export const isDev: boolean = !import.meta.env.PROD;

type ThemeContextType = {
	isDark: boolean;
	isHighContrast: boolean;
	toggleTheme: () => void;
};

type NotiDataContextType = {
	notiData: NotificationData | null;
	setNotiData: (data: NotificationData | null) => void;
};

type UserDataContextType = {
	userData: CurrentUserData | null;
	setUserData: (data: CurrentUserData | null) => void;
};

type ClassDataContextType = {
	classData: ClassData | null;
	setClassData: (data: ClassData | null) => void;
};

export type AppSettings = {
	general: {
		sfxVolume: number;
		muteSfx: boolean;
	};
	appearance: {
		theme: "light" | "dark";
		accentColor: string;
	};
	accessibility: {
		disableAnimations: boolean;
		largeText: number;
		colorVisionMode: ColorVisionMode;
		highContrast: boolean;
	};
};

type SettingsContextType = {
	settings: AppSettings;
	updateSettings: (newSettings: Partial<AppSettings>) => void;
};

const defaultSettings: AppSettings = {
	general: {
		sfxVolume: 50,
		muteSfx: false,
	},
	appearance: {
		theme: "light",
		accentColor: "#1677ff",
	},
	accessibility: {
		disableAnimations: false,
		largeText: 100,
		colorVisionMode: "default",
		highContrast: false,
	},
};

type ServerConfig = {
	emailEnabled: boolean;
	oidcProviders: string[];
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

const NotiDataContext = createContext<NotiDataContextType | undefined>(
	undefined,
);
const UserDataContext = createContext<UserDataContextType | undefined>(
	undefined,
);
const ClassDataContext = createContext<ClassDataContextType | undefined>(
	undefined,
);
const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined,
);

export const useNotiData = () => {
	const context = useContext(NotiDataContext);
	if (!context)
		throw new Error("useNotiData must be used within NotiDataProvider");
	return context;
};

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

export const useSettings = () => {
	const context = useContext(SettingsContext);
	if (!context)
		throw new Error("useSettings must be used within SettingsProvider");
	return context;
};

// Helper function to get appear animation styles based on settings
export const getAppearAnimation = (
	disableAnimations: boolean,
	delayIndex?: number,
): React.CSSProperties => {
	if (disableAnimations) {
		return {};
	}
	return {
		opacity: 0,
		animation: "appear 0.3s ease-in-out forwards",
		animationDelay:
			delayIndex !== undefined ? `${delayIndex * 0.05}s` : undefined,
	};
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const { settings, updateSettings } = useSettings();
	const isDark = settings.appearance.theme === "dark";
	const isHighContrast = settings.accessibility.highContrast;
	const activeTheme = isHighContrast
		? highContrastMode
		: isDark
			? darkMode
			: lightMode;

	useEffect(() => {
		const bodyColor = isHighContrast
			? "#000000"
			: isDark
				? themeColors.dark.body.background
				: themeColors.light.body.background;
		const bodyTextColor = isHighContrast
			? "#ffffff"
			: isDark
				? themeColors.dark.body.color
				: themeColors.light.body.color;
		document.body.style.background = bodyColor;
		document.body.style.color = bodyTextColor;
		document.documentElement.dataset.colorVision =
			settings.accessibility.colorVisionMode;
		if (settings.accessibility.disableAnimations) {
			document.documentElement.dataset.disableAnimations = "true";
		} else {
			delete document.documentElement.dataset.disableAnimations;
		}
		if (isHighContrast) {
			document.documentElement.dataset.highContrast = "true";
		} else {
			delete document.documentElement.dataset.highContrast;
		}
		document.documentElement.style.setProperty(
			"--formbar-accent",
			settings.appearance.accentColor,
		);
	}, [
		isDark,
		isHighContrast,
		settings.accessibility.colorVisionMode,
		settings.accessibility.disableAnimations,
		settings.appearance.accentColor,
	]);

	const toggleTheme = () => {
		updateSettings({
			appearance: {
				...settings.appearance,
				theme: isDark ? "light" : "dark",
			},
		});
	};

	return (
		<ThemeContext.Provider value={{ isDark, isHighContrast, toggleTheme }}>
			<ConfigProvider
				theme={{
					...activeTheme,
					components: {
						...activeTheme.components,
						Segmented: {
							...activeTheme.components.Segmented,
							...(isHighContrast
								? {}
								: {
										itemSelectedBg:
											settings.appearance.accentColor,
										itemSelectedColor: "#ffffff",
									}),
						},
					},
					token: {
						...activeTheme.token,
						fontSize: (20 * settings.accessibility.largeText) / 100,
						fontSizeLG:
							(24 * settings.accessibility.largeText) / 100,
						...(isHighContrast
							? {}
							: {
									colorPrimary:
										settings.appearance.accentColor,
									colorLink: settings.appearance.accentColor,
									colorInfo: settings.appearance.accentColor,
								}),
						...(settings.accessibility.disableAnimations
							? {
									motionDurationMid: "0",
									motionDurationSlow: "0",
								}
							: {}),
					},
				}}
			>
				{children}
			</ConfigProvider>
		</ThemeContext.Provider>
	);
};

const NotiDataProvider = ({ children }: { children: ReactNode }) => {
	const [notiData, setNotiData] = useState<NotificationData | null>(null);

	return (
		<NotiDataContext.Provider value={{ notiData, setNotiData }}>
			{children}
		</NotiDataContext.Provider>
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

const SettingsProvider = ({ children }: { children: ReactNode }) => {
	const [settings, setSettings] = useState<AppSettings>(() => {
		try {
			const saved = localStorage.getItem("formbar-settings");
			const parsed = saved ? JSON.parse(saved) : {};
			const savedLargeText = parsed.accessibility?.largeText;
			const largeText =
				typeof savedLargeText === "boolean"
					? savedLargeText
						? 120
						: 100
					: typeof savedLargeText === "number"
						? savedLargeText
						: defaultSettings.accessibility.largeText;
			return {
				...defaultSettings,
				...parsed,
				general: { ...defaultSettings.general, ...parsed.general },
				appearance: {
					...defaultSettings.appearance,
					...parsed.appearance,
				},
				accessibility: {
					...defaultSettings.accessibility,
					...parsed.accessibility,
					largeText,
				},
			};
		} catch {
			return defaultSettings;
		}
	});

	const updateSettings = (newSettings: Partial<AppSettings>) => {
		setSettings((prev) => {
			const updated = { ...prev, ...newSettings };
			localStorage.setItem("formbar-settings", JSON.stringify(updated));
			return updated;
		});
	};

	return (
		<SettingsContext.Provider value={{ settings, updateSettings }}>
			{children}
		</SettingsContext.Provider>
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
	const [verificationRequestLoading, setVerificationRequestLoading] =
		useState(false);
	const { userData, setUserData } = useUserData();
	const { notiData, setNotiData } = useNotiData();
	const publicRoutes = [
		"/login",
		"/oauth",
		"/user/me/pin",
		"/user/me/password",
		"/user/verify/email",
	];
	const isVerificationRequired =
		Boolean(config?.emailEnabled) && Number(userData?.verified) === 0;
	const buildLoginPath = () => {
		if (location.pathname === "/oauth/authorize") {
			const returnURL = `${location.pathname}${location.search}`;
			return `/login?returnURL=${encodeURIComponent(returnURL)}`;
		}

		return "/login";
	};

	const fetchConfig = async () => {
		try {
			const configResponse = await getServerConfig();
			const nextConfig: ServerConfig = {
				emailEnabled: Boolean(configResponse?.data?.emailEnabled),
				oidcProviders: configResponse?.data?.oidcProviders || [],
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
		try {
			const userResponse = await getMe();
			const userNotifications = await getNotifications({ limit: 20, offset: 0 });

			const { data } = userResponse;
			const notiData: NotificationData = userNotifications?.data;
			
			const isGuestUser = Boolean(data?.isGuest);

			const serverConfig = config || (await fetchConfig());
			if (!serverConfig?.emailEnabled || isGuestUser) {
				Log({
					message: "User data fetched successfully.",
					data,
					level: "info",
				});
				setUserData(data);
			}

			if (isGuestUser) {
				return;
			}

			setNotiData(notiData);

			const userDetailResponse = await getUser(data.id);

			const verified = Number(userDetailResponse?.data?.verified);

			if (!Number.isNaN(verified)) {
				const nextUserData = { ...data, verified };
				Log({
					message: "User data fetched successfully.",
					data: nextUserData,
					level: "info",
				});
				setUserData(nextUserData);
			} else {
				setUserData(data);
			}
		} catch (err) {
			Log({
				message: "Error fetching user data",
				data: err,
				level: "error",
			});
			setHttpErrorCount((prev) => prev + 1);
		}
	};

	const handleLogout = () => {
		clearAuthTokens();
		socket?.disconnect();
		setUserData(null);
		navigate("/login");
	};

	const requestVerificationEmail = async () => {
		if (!userData?.id || !accessToken) return;

		setVerificationRequestLoading(true);
		try {
			const response = await requestUserVerificationEmail(
				String(userData.id),
			);
			if (!response.ok || response?.error) {
				throw new Error(
					response?.error?.message ||
						"Failed to request verification email",
				);
			}

			modal.success({
				title: "Verification Email Sent",
				content:
					"Check your inbox and click the verification link to activate your account.",
			});
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

		async function pingServer() {
			attempts++;
			setHttpErrorCount(attempts - 1);

			await getPublicKey()
				.then(({ success }) => {
					if (success) {
						Log({
							message: "Ping successful.",
							level: "info",
						});
						setHttpErrorCount(0);
					} else {
						Log({
							message: "Ping failed.",
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
			setHttpErrorCount(0)
		}

		pingServer();

		return () => {
			// clearTimeout(timeoutId);
		};
	}, []);

	useEffect(() => {
		const hasStoredRefreshToken = Boolean(
			localStorage.getItem("refreshToken"),
		);
		const guestAccessToken = getGuestAccessToken();

		if (!socket?.connected && hasStoredRefreshToken) {
			socketLogin();
		} else if (!socket?.connected && guestAccessToken) {
			socketLogin(guestAccessToken, "access");
		} else if (!hasStoredRefreshToken && !guestAccessToken) {
			if (!publicRoutes.includes(window.location.pathname)) {
				navigate(buildLoginPath());
			}
			setIsConnected(true);
		}

		function onConnect() {
			setSocketErrorCount(0); // Reset on successful connection
			Log({ message: "Connected to server.", level: "info" });

			fetchUserData().then(() => {
				const returnURL = new URLSearchParams(
					window.location.search,
				).get("returnURL");
				if (window.location.pathname === "/login" && !returnURL) {
					navigate("/");
				}
			});
			setIsConnected(true);
		}

		function onSetClass(classID: number) {
			Log({
				message: "Class ID set to: " + (classID || "{No Class}"),
				level: "debug",
			});
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

		// When all token-refresh and re-login attempts fail (e.g. stale tokens
		// after a long absence) clear credentials and return to the login page
		// so the user isn't permanently stuck on the loading screen.
		function onAuthFailed() {
			Log({
				message:
					"All auth attempts failed - clearing tokens and redirecting to login",
				level: "warn",
			});
			/* Comment these to fix reload bug */
			clearAuthTokens();
			setIsConnected(true); // dismiss the loading screen
			navigate(buildLoginPath());
		}
		window.addEventListener("formbar:authfailed", onAuthFailed);

		return () => {
			socket?.off("connect", onConnect);
			socket?.off("connect_error", connectError);
			socket?.off("disconnect", onDisconnect);
			socket?.off("setClass", onSetClass);
			window.removeEventListener("formbar:authfailed", onAuthFailed);
		};
	}, []);

	return (
		<>
			{contextHolder}
			<Modal
				title="Email Verification Required"
				open={isVerificationRequired}
				closable={false}
				mask={{
					closable: false,
				}}
				keyboard={false}
				footer={null}
			>
				<Space direction="vertical" size="middle">
					<Typography.Paragraph style={{ marginBottom: 0 }}>
						Your account has not been verified yet. You must verify
						your email before using Formbar.
					</Typography.Paragraph>
					<Space wrap>
						<Button
							type="primary"
							onClick={requestVerificationEmail}
							loading={verificationRequestLoading}
						>
							Request Verification Email
						</Button>
						<Button danger onClick={handleLogout}>
							Log Out
						</Button>
					</Space>
				</Space>
			</Modal>
			{isVerificationRequired ? (
				<LoadingScreen
					socketErrors={socketErrorCount}
					httpErrors={httpErrorCount}
					isConnected={isConnected}
				/>
			) : (
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
			)}
		</>
	);
};

function App() {
	return (
		<StrictMode>
			<svg
				aria-hidden="true"
				style={{ position: "absolute", width: 0, height: 0 }}
			>
				<defs>
					<filter
						id="formbar-deuteranopia"
						colorInterpolationFilters="sRGB"
					>
						<feColorMatrix values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
					</filter>
					<filter
						id="formbar-protanopia"
						colorInterpolationFilters="sRGB"
					>
						<feColorMatrix values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" />
					</filter>
					<filter
						id="formbar-tritanopia"
						colorInterpolationFilters="sRGB"
					>
						<feColorMatrix values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" />
					</filter>
				</defs>
			</svg>
			<BrowserRouter>
				<SettingsProvider>
					<ThemeProvider>
						<GlobalMessageProvider>
							<UserDataProvider>
								<NotiDataProvider>
									<ClassDataProvider>
										<AppContent />
									</ClassDataProvider>
								</NotiDataProvider>
							</UserDataProvider>
						</GlobalMessageProvider>
					</ThemeProvider>
				</SettingsProvider>
			</BrowserRouter>
		</StrictMode>
	);
}

createRoot(document.getElementById("root")!).render(<App />);
