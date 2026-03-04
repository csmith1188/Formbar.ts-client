import { Flex, Typography, Spin } from "antd";
const { Title, Text } = Typography;
import { LoadingOutlined } from "@ant-design/icons";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";

export default function LoadingScreen({
	socketErrors,
	httpErrors,
	isConnected,
}: {
	socketErrors: number;
	httpErrors: number;
	isConnected: boolean;
}) {
	return (
		<>
			<Flex
				style={isConnected ? hideLoadingStyle : showLoadingStyle}
				justify="center"
				align="center"
				vertical
				gap={28}
			>
				{/* Logo */}
				<img
					src="/img/FormbarLogo-Circle.png"
					alt="Formbar Logo"
					style={{
						height: 80,
						filter: "drop-shadow(0 0 30px rgba(59,130,246,0.7)) brightness(1.2)",
						animation: isConnected ? "none" : "pulseGlow 2s ease-in-out infinite",
					}}
				/>

				{/* Title */}
				<Title
					style={{
						color: "#ffffffee",
						fontSize: "80px",
						fontWeight: 800,
						marginBottom: "0",
						letterSpacing: "-0.04em",
						lineHeight: 1,
						textShadow: "0 0 40px rgba(59,130,246,0.4)",
					}}
				>
					<span className="bounce">F</span>
					<span className="bounce">o</span>
					<span className="bounce">r</span>
					<span className="bounce">m</span>
					<span className="bounce">b</span>
					<span className="bounce">a</span>
					<span className="bounce">r</span>
				</Title>

				{/* Status indicator */}
				<Flex vertical align="center" gap={10}>
					{isConnected ? (
						<Flex align="center" gap={8}>
							<IonIcon
								icon={IonIcons.checkmarkCircle}
								style={{
									height: "28px",
									fontSize: "28px",
									color: "#4ade80",
								}}
							/>
							<Text style={{ color: "#ffffff99", fontSize: "16px", fontWeight: 500 }}>
								Loading panel...
							</Text>
						</Flex>
					) : socketErrors < 5 ? (
						<Flex align="center" gap={12}>
							<Spin
								size="large"
								indicator={<LoadingOutlined />}
								styles={{ indicator: { color: "#93c5fd" } }}
							/>
							<Text style={{ color: "#ffffff99", fontSize: "16px", fontWeight: 500 }}>
								{randomText()}
							</Text>
						</Flex>
					) : (
						<Flex align="center" gap={8}>
							<IonIcon
								icon={IonIcons.closeCircle}
								style={{
									height: "28px",
									fontSize: "28px",
									color: "#f87171",
								}}
							/>
							<Text style={{ color: "#ffffff99", fontSize: "16px", fontWeight: 500 }}>
								Connection failed
							</Text>
						</Flex>
					)}

					<Text style={{ color: "#ffffff50", fontSize: "13px", fontWeight: 400 }}>
						{!isConnected
							? httpErrors === 0
								? "Connecting to server..."
								: httpErrors < 5
									? `Retrying... (Attempt ${httpErrors})`
									: "Is the server running?"
							: null}
					</Text>
				</Flex>
			</Flex>
		</>
	);
}

function randomText() {
	const texts = [
		"Printing Digipogs...",
		"Building Classrooms...",
		"Forming the Bar...",
		'While you wait, why not watch "Hundreds of Beavers"?',
		"Filling Pog Meters...",
		"Releasing Half-Life 3...",
		"I'm the Formboy!",
		"Yo, Gurt!!",,
        "Steven, fix it!!",
        "PR #85"
	];

	return texts[Math.floor(Math.random() * texts.length)];
}

const hideLoadingStyle = {
	width: "100vw",
	height: "100vh",
	position: "absolute",
	top: 0,
	left: 0,
	background: "linear-gradient(135deg, #0d1b2a 0%, #0a2540 50%, #0d1b2a 100%)",
	zIndex: 9000,
	opacity: 0,
	pointerEvents: "none",
	transition: "opacity 0.6s ease-out",
} as React.CSSProperties;

const showLoadingStyle = {
	width: "100vw",
	height: "100vh",
	position: "absolute",
	top: 0,
	left: 0,
	background: "linear-gradient(135deg, #0d1b2a 0%, #0a2540 50%, #0d1b2a 100%)",
	zIndex: 9000,
} as React.CSSProperties;
