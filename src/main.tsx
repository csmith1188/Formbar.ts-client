import { StrictMode, createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import LoadingScreen from "./components/LoadingScreen";

import { socket, registerSocketEventHandlers, connectionUrl, connectionAPI, prodUrl, loginSocket } from './socket';

import { darkMode, lightMode, showMobileIfVertical, themeColors } from "../themes/ThemeConfig";

import "./assets/css/index.css";

import pages from "./pages";
import type { ClassData, UserData } from "./types";
import Log from "./debugLogger";

type ThemeContextType = {
	isDark: boolean;
	toggleTheme: () => void;
}

type UserDataContextType = {
	userData: UserData | null;
	setUserData: (data: UserData | null) => void;
}

type ClassDataContextType = {
	classData: ClassData | null;
	setClassData: (data: ClassData | null) => void;
}

const connectionTriesLimit = 5;

export const isMobile = () => {
	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

	let isMobileBool = /android|avantgo|blackberry|bb|playbook|iemobile|ipad|iphone|ipod|kindle|mobile|palm|phone|silk|symbian|tablet|up\.browser|up\.link|webos|windows ce|windows phone/i.test(userAgent.toLowerCase());

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

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);
const ClassDataContext = createContext<ClassDataContextType | undefined>(undefined);

export const useUserData = () => {
	const context = useContext(UserDataContext);
	if (!context) throw new Error("useUserData must be used within UserDataProvider");
	return context;
};

export const useClassData = () => {
	const context = useContext(ClassDataContext);
	if (!context) throw new Error("useClassData must be used within ClassDataProvider");
	return context;
}

const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [isDark, setIsDark] = useState(() => {
		const saved = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
		return saved ? saved === 'dark' : false;
	});

	useEffect(() => {
		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
		document.cookie = `theme=${isDark ? 'dark' : 'light'}; expires=${expires.toUTCString()}; path=/`;
		
		const bodyColor = isDark ? themeColors.dark.body.background : themeColors.light.body.background;
		const bodyTextColor = isDark ? themeColors.dark.body.color : themeColors.light.body.color;
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
	const [userData, setUserData] = useState<UserData | null>(null);

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
}

const PageWrapper = ({ pageName, children }: { pageName: string; children: ReactNode }) => {
	useEffect(() => {
		document.title = `${pageName} - Formbar`;
	}, [pageName]);

	return <>{children}</>;
};

const AppContent = () => {
	const navigate = useNavigate();
	const [isConnected, setIsConnected] = useState(socket?.connected || false);
	const [socketErrorCount, setSocketErrorCount] = useState(0);
	const [httpErrorCount, setHttpErrorCount] = useState(0);
	const { setUserData } = useUserData();

	/*
	* This effect handles initial HTTP connection and pinging the server
	*/
	useEffect(() => {
		let attempts = 0;
		let timeoutId: ReturnType<typeof setTimeout>;

		function pingServer() {
			attempts++;
			setHttpErrorCount(attempts - 1);

			fetch(`${prodUrl}/certs`, { method: 'GET' })
			.then(res => {
				if (res.ok) {
					Log({ message: 'Ping successful.', level: 'info' });
					setIsConnected(true);
					setHttpErrorCount(0);
				} else {
					console.error('Ping failed with status:', res.status);
					if (attempts < connectionTriesLimit) {
						timeoutId = setTimeout(pingServer, 1000); // Retry after 1 second
					}
				}
			})
			.catch(err => {
				console.error('Error during ping:', err);
				if (attempts < connectionTriesLimit) {
					timeoutId = setTimeout(pingServer, 1000); // Retry after 1 second
				}
			});
		}

		pingServer();

		return() => {
			clearTimeout(timeoutId);
		};
	}, []);

	useEffect(() => {

		if(!socket?.connected && localStorage.getItem('connectionUrl') && localStorage.getItem('connectionAPI')) {
			loginSocket(localStorage.getItem('connectionUrl')!, localStorage.getItem('connectionAPI')!);
		} else if(!localStorage.getItem('connectionUrl') || !localStorage.getItem('connectionAPI')) {
			navigate('/login')
		}
		
		function onConnect() {
			setSocketErrorCount(0); // Reset on successful connection
			Log({ message: 'Connected to server.', level: 'info' });

			fetch(`${connectionUrl}/api/me`, {
				method: 'GET',
				headers: {
					"api": connectionAPI,
				}
			})
			.then(res => res.json())
			.then(data => {
				Log({ message: 'User data fetched successfully.', data, level: 'info' });
				setUserData(data);
			})
			.catch(err => {
				console.error('Error fetching user data:', err);
				setHttpErrorCount(prev => prev + 1);
			})
		}

		function onSetClass(classID: number) {
			Log({ message: "Class ID set to: " + classID, level: 'debug' });
			socket.emit('classUpdate', '');
		}

		function connectError(err: any) {
			console.error('Connection Error:', err);
			setSocketErrorCount(prev => {
				const newCount = prev + 1;

				if (newCount >= connectionTriesLimit) {
					console.error('Max socket connection attempts reached. Please check your network or contact support.');
					socket?.disconnect();
				}
				return newCount;
			});
		}

		function onDisconnect(reason: string) {
			console.warn('Disconnected from server. Reason:', reason);
		}

		// Register socket event handlers
		registerSocketEventHandlers({
			onConnect,
			onConnectError: connectError,
			onDisconnect,
			onSetClass
		});

		return () => {
			socket?.off('connect', onConnect);
			socket?.off('connect_error', connectError);
			socket?.off('disconnect', onDisconnect);
			socket?.off('setClass', onSetClass);
		};
	}, []);

	return (
		<Routes>
			{
				pages.map(page => {
					const Element = page.page;
					return <Route key={page.routePath} path={page.routePath} element={
						<PageWrapper pageName={page.pageName}>
							<LoadingScreen socketErrors={socketErrorCount} httpErrors={httpErrorCount} isConnected={isConnected} />
							<Element />
						</PageWrapper>
					} />
				})
			}
		</Routes>
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
