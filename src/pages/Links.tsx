import { useEffect, useState } from "react";
import { getAllClassLinks } from "@api/classApi";
import { useTheme, useUserData, useMobileDetect } from "@/main";
import { currentUserHasScope } from "@utils/scopeUtils";
import FormbarHeader from "@components/FormbarHeader";
import { darkMode, lightMode } from "@/themes/ThemeConfig";
import { Avatar, Col, Flex, Row, Typography } from "antd";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
const { Title, Text } = Typography;

export default function Links() {
	const { userData } = useUserData();
	const { isDark } = useTheme();
	const isMobile = useMobileDetect();

	const [classLinks, setClassLinks] = useState<any[]>([]);

	const canSeeLinks = currentUserHasScope(userData, "class.links.read");

	useEffect(() => {
		if (!userData || !userData?.activeClass || !canSeeLinks) return;

		getAllClassLinks(userData.activeClass).then((links) => {
			setClassLinks(links);
		});
	}, [userData, canSeeLinks]);

	return (
		<div style={{ height: "100%" }}>
			<FormbarHeader />

			<Flex style={{ display: "flex", height: "100%", gap: 20}}>
				{
					!isMobile && (
						<Flex vertical style={{ width: 320, padding: 24, borderRadius: 8, background: isDark ? darkMode.components.Card.colorBgContainer : lightMode.components.Card.colorBgContainer }}>
							<Title level={2} style={{ margin: 0 }}>
								Links
							</Title>
							<Text style={{ marginTop: 8, color: isDark ? "#bfcbdc" : "#5b6c85" }}>
								Quick access to your favorite sites and tools.
							</Text>
						</Flex>
					)
				}

				<Flex style={{ flex: 1, paddingTop: 10 }}>
					{!canSeeLinks && (
						<Text type="danger">You do not have permission to view class links.</Text>
					)}

					{canSeeLinks && classLinks.length === 0 && (
						<Text type="warning">No links have been added for this class yet.</Text>
					)}

					{
						!isMobile ? (
							<Flex justify="center" style={{ width: "100%", height: "100%", overflowY: "scroll" }}>
								{canSeeLinks && classLinks.length > 0 && (
									<Row gutter={[16, 16]} style={{ width: "100%", height: "min-content", justifyContent: "center" }}>
										{classLinks.map((l, index) => (
											<LinkCard key={l.id} link={l} index={index} />
										))}
									</Row>
								)}
							</Flex>
						) : (
							<Flex vertical style={{ width: "100%", height: "100%", gap: 12, padding: 12, overflowY: "scroll" }}>
								{canSeeLinks && classLinks.length > 0 && classLinks.map((l, index) => (
									<LinkCard key={l.id} link={l} index={index} />
								))}
							</Flex>
						)
					}
				</Flex>
			</Flex>
		</div>
	);
}

function LinkCard({ link, index }: { link: any; index: number }) {
	const isMobile = useMobileDetect();

	const linkElement = ( 
		<Flex
			align="center" gap={14}
			onClick={() => window.open(link.url, "_blank")}
			style={{
				width: isMobile ? '100%' : 'fit-content',
				gap: 14,
				padding: 18,
				borderRadius: 12,
				background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
				boxShadow: "rgba(0, 0, 0, 0.25) 0px 0px 3px",
				border: "1px solid rgba(255,255,255,0.1)",
				cursor: "pointer",
			}}
		>
			<Avatar size={64} shape="square" style={{ background: getColorByIndex(index), fontSize: 20, minWidth: 64 }}>
				{link.name ? link.name[0].toUpperCase() : "?"}
			</Avatar>

			<Flex vertical style={{ flex: 1 }}>
					<Title level={4} style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.name}</Title>
					<Text type="secondary" style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{openMsg()} {link.name}</Text>
			</Flex>

			<IonIcon icon={IonIcons.chevronForward}></IonIcon>
		</Flex>
	)

	return isMobile ? (
		<div style={{ width: "100%" }}>
			{linkElement}
		</div>
	) : (
		<Col>
			{linkElement}
		</Col>
	)
}

function openMsg() {
	const msgs = ["Open", "Visit", "Go to", "Access", "Launch"];
	return msgs[Math.floor(Math.random() * msgs.length)];
}

function getColorByIndex(index: number) {
	const colors = ["#2f54eb", "#eb2f96", "#fa541c", "#13c2c2", "#52c41a", "#722ed1", "#fa8c16"];
	return colors[index % colors.length];
}