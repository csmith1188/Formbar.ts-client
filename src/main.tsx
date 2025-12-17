import { StrictMode, createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigProvider } from "antd";
import LoadingScreen from "./components/LoadingScreen";

import { url, api, socket } from './socket';

import { darkMode, lightMode, showMobileIfVertical, themeColors } from "../themes/GlobalConfig";

import "./assets/css/index.css";

import pages from "./pages";
import type { UserData } from "./types";

type ThemeContextType = {
	isDark: boolean;
	toggleTheme: () => void;
}

const connectionTriesLimit = 5;

export const isMobile = () => {
	// Do thorough check for mobile devices
	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

	let isMobileBool = /android|avantgo|blackberry|bb|playbook|iemobile|ipad|iphone|ipod|kindle|mobile|palm|phone|silk|symbian|tablet|up\.browser|up\.link|webos|windows ce|windows phone/i.test(userAgent.toLowerCase());

	// Additionally check for small screen sizes
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


const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [isDark, setIsDark] = useState(() => {
		const saved = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
		return saved ? saved === 'dark' : false;
	});

	useEffect(() => {
		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
		document.cookie = `theme=${isDark ? 'dark' : 'light'}; expires=${expires.toUTCString()}; path=/`;
		
		// Apply body background color based on theme
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

function App() {
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [connectionTries, setConnectionTries] = useState(0);
	const [showNotConnected, setShowNotConnected] = useState(false);
	const [userData, setUserData] = useState<UserData | null>(null);

	showNotConnected;
	isConnected;

	useEffect(() => {
    // no-op if the socket is already connected
		socket.connect();

		return () => {
		socket.disconnect();
		};
	}, []);

	useEffect(() => {
		
		socket.on('setClass', onSetClass);

		function onConnect() {
			setIsConnected(true);
			setConnectionTries(0); // Reset on successful connection
			console.log('connected')

			fetch(`${url}/api/me`, {
				method: 'GET',
				headers: {
					"api": api,
				}
			})
			.then(res => res.json())
			.then(data => {
				console.log(data);
				setUserData(data);
			})
			.catch(err => {
				console.error('Error fetching user data:', err);
			})
		}

		function onDisconnect() {
			setIsConnected(false);
		}

		function onSetClass(classID: number) {
			console.log("Class ID set to:", classID);
			socket.emit('classUpdate');

			
		}

		function connectError(err: any) {
			console.error('Connection Error:', err);
			setConnectionTries(prev => {
				connectionTries;
				const newCount = prev + 1;
				console.error('Connection Failed on Attempt:', newCount);

				if (newCount >= connectionTriesLimit) {
					console.error('Max connection attempts reached. Please check your network or contact support.');
					socket.disconnect();
					setShowNotConnected(true);
				}
				return newCount;
			});
		}

		socket.on('connect', onConnect);
		socket.on('connect_error', connectError);
		socket.on('disconnect', onDisconnect);

		return () => {
			socket.off('connect', onConnect);
			socket.off('connect_error', connectError);
			socket.off('disconnect', onDisconnect);
			socket.off('setClass', onSetClass);
		};
	}, []);
	return (
		<StrictMode>
			<ThemeProvider>
				<BrowserRouter>
					<Routes>
						{
							pages.map(page => {
								const Element = page.desktopPage;
								return <Route key={page.routePath} path={page.routePath} element={
									<>
									<LoadingScreen attempt={connectionTries} isConnected={isConnected} />
									<Element userData={userData} />
									</>
								} />
							})
						}
					</Routes>
				</BrowserRouter>
			</ThemeProvider>
		</StrictMode>
	);
}

createRoot(document.getElementById("root")!).render(<App />);
