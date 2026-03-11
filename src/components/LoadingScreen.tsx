import { Flex, Typography, Spin } from "antd";
const { Title, Text } = Typography;
import { LoadingOutlined } from "@ant-design/icons";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useMobileDetect } from "../main";

export default function LoadingScreen({
	socketErrors,
	httpErrors,
	isConnected,
}: {
	socketErrors: number;
	httpErrors: number;
	isConnected: boolean;
}) {
    const isMobile = useMobileDetect();
    
	return (
		<>
			<Flex
				style={isConnected ? hideLoadingStyle : showLoadingStyle}
				justify="center"
				align="center"
				vertical
				gap={20}
			>
				<Title
					style={{
						color: "#fff9",
						fontSize: isMobile ? "70px" : "120px",
						fontWeight: 700,
						marginBottom: "0",
					}}
				>
					<span className={!isConnected ? "bounce" : undefined}>F</span>
					<span className={!isConnected ? "bounce" : undefined}>o</span>
					<span className={!isConnected ? "bounce" : undefined}>r</span>
					<span className={!isConnected ? "bounce" : undefined}>m</span>
					<span className={!isConnected ? "bounce" : undefined}>b</span>
					<span className={!isConnected ? "bounce" : undefined}>a</span>
					<span className={!isConnected ? "bounce" : undefined}>r</span>
				</Title>
				{isConnected ? (
					<IonIcon
						icon={IonIcons.checkmark}
						style={{
							height: "48px",
							fontSize: "48px",
							color: "#fff",
						}}
					/>
				) : socketErrors < 5 ? (
					<Spin
						size="large"
						indicator={<LoadingOutlined />}
						styles={{
							indicator: {
								color: "#fff",
							},
						}}
					/>
				) : (
					<IonIcon
						icon={IonIcons.close}
						style={{
							height: "48px",
							fontSize: "48px",
							color: "#fff",
						}}
					/>
				)}

				<Text
					style={{
						color: "#fff7",
						fontSize: "20px",
						fontWeight: 500,
						marginTop: "0",
                        textAlign: "center",
					}}
				>
					{!isConnected ? randomText() : "Loading panel..."}
				</Text>

				{isConnected ? null : (
					<Text
						style={{
							color: "#fff5",
							fontSize: "12px",
							fontWeight: 400,
							marginTop: "0",
						}}
					>
						{httpErrors === 0
							? "Connecting to server..."
							: httpErrors < 5
								? `Trying again... (Attempt ${httpErrors})...`
								: "Connection failed. Is the server running?"}
					</Text>
				)}
			</Flex>
		</>
	);
}

function randomText() {
	const splashTexts = [
		"Printing Digipogs...",
		"Building Classrooms...",
		"Forming the Bar...",
		'While you wait, why not watch "Hundreds of Beavers"?',
		"Filling Pog Meters...",
		"Releasing Half-Life 3...",
		"I'm the Formboy!",
		"I'm the Femboy!",
		"Yo, Gurt!!",,
        "Steven, fix it!!",
        "PR #85",
        "Robert was here... It's in your skin. It's in your blood. It's in your brain. It is part of you.",
        "Wishlist Kogama on Steam!",
        "onebar@yorktechapps.com",
        "Loading battle pass...",
        "Loading FormAI..."
	];

	return splashTexts[Math.floor(Math.random() * splashTexts.length)];
}

const hideLoadingStyle = {
	width: "100vw",
	height: "100vh",
	position: "absolute",
	top: 0,
	left: 0,
	background:
		"linear-gradient(rgba(95, 122, 158, 1) 0%, rgba(28, 68, 124, 1) 100%)",
	zIndex: 9000,
	opacity: 0,
	pointerEvents: "none",
	transition: "opacity 0.5s ease-out",
} as React.CSSProperties;

const showLoadingStyle = {
	width: "100vw",
	height: "100vh",
	position: "absolute",
	top: 0,
	left: 0,
	background:
		"linear-gradient(rgba(95, 122, 158, 1) 0%, rgba(28, 68, 124, 1) 100%)",
	zIndex: 9000,
} as React.CSSProperties;
