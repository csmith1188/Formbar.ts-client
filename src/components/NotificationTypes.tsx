import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import {
	Badge,
	Button,
	Card,
	Descriptions,
	Divider,
	Flex,
	Tag,
	Tooltip,
	Typography,
} from "antd";
const { Title, Text } = Typography;
const { Ribbon } = Badge;
import type { KeyboardEvent, ReactNode } from "react";
import type { NotificationData } from "@/types";
import { markNotificationAsRead } from "@/api/notificationApi";
import Log from "@/utils/debugLogger";

type NotificationObjectProps = {
	notification: NotificationData["notifications"][number];
	includeAdditionalData?: boolean;
	hideInteractables?: boolean;
	showUnread?: boolean;
	onSelect?: (notification: NotificationData["notifications"][number]) => void;
	selected?: boolean;
};

const NotificationTitles: Record<string, string> = {
	"exchange_received": "Exchange Received",
    "exchange_completed": "Exchange Completed",
    "exchange_failed": "Exchange Failed",
    "exchange_canceled": "Exchange Cancelled",
    "exchange_rejected": "Exchange Rejected",
    "trade_received": "Trade Received",
    "trade_completed": "Trade Completed",
    "trade_failed": "Trade Failed",
    "trade_rejected": "Trade Rejected",
    "trade_canceled": "Trade Cancelled",
};

type Notification = NotificationData["notifications"][number];

function getNotificationTitle(notification: Notification) {
	return NotificationTitles[notification.type] || notification.type;
}

// function getNotificationData(notification: Notification) {
// 	if (typeof notification.data !== "string") return notification.data;

// 	try {
// 		return JSON.parse(notification.data);
// 	} catch {
// 		return notification.data;
// 	}
// }

export default function NotificationObject({
	notification,
	includeAdditionalData = false,
	hideInteractables = false,
	showUnread = false,
	onSelect,
	selected = false,
}: NotificationObjectProps) {
	const { actions, children } = getNotificationObjectType({ notification, includeAdditionalData });

	const createdAt = new Date(notification.created_at);
	const dateString = createdAt.toLocaleString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "numeric",
	});

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!onSelect || (event.key !== "Enter" && event.key !== " ")) return;

		event.preventDefault();
		onSelect(notification);
	};

	const showUnreadRibbon = showUnread && notification.is_read == 0;

	return (
		<Ribbon styles={{root: {width: '100%'}, "indicator": { opacity: showUnreadRibbon ? 1 : 0 }}} text={showUnreadRibbon && "Unread"}>
			<Card
				title={getNotificationTitle(notification)}
				className="notiCard"
				onClick={() => onSelect?.(notification)}
				onKeyDown={handleKeyDown}
				tabIndex={onSelect ? 0 : undefined}
				style={{
					borderColor: selected ? "var(--ant-color-primary)" : undefined,
					boxShadow: selected
						? "0 0 0 2px var(--ant-color-primary-bg)"
						: undefined,
					cursor: onSelect ? "pointer" : undefined,
				}}
				styles={{
					header: {
						fontSize: 14,
						minHeight: 0,
						padding: 10,
					},
					body: {
						fontSize: 12,
						padding: 10,
					},
					extra: {
						padding: 0,
						display: "flex",
					},
				}}
				extra={
					includeAdditionalData && (
						<Tooltip title={dateString} placement="bottom">
							<IonIcon icon={IonIcons.timeOutline} />
						</Tooltip>
					)
				}
			>
				{children}
				{
					!hideInteractables && (
						<Flex
							gap={4}
							wrap="wrap"
							style={{
								marginTop: 16,
								paddingTop: 10,
								borderTop: "1px solid var(--ant-color-border-secondary)",
							}}
							onClick={(event) => event.stopPropagation()}
						>
							{actions}
							<NotificationActionButton
								showLabel={includeAdditionalData}
								label="Mark as read"
								icon={IonIcons.mailOpen}
								onClick={async () => {
									const response = await markNotificationAsRead(String(notification.id));
									if (response.error) {
										Log({
											message: "Error marking notification as read",
											data: response.error,
											level: "error",
										});
										return;
									}
								}}
							/>
						</Flex>
					)
				}
			</Card>
		</Ribbon>
	);
}

export function NotificationDetails({
	notification,
}: {
	notification: Notification;
}) {
	const { actions, children } = getNotificationObjectType({
		notification,
		includeAdditionalData: true,
	});
	const createdAt = new Date(notification.created_at);
	const formattedDate = createdAt.toLocaleString("en-US", {
		dateStyle: "long",
		timeStyle: "short",
	});

	return (
		<Flex vertical style={{height: '100%'}}>
			<Flex vertical gap={8}>
				<Title level={3} style={{ margin: 0 }}>
					{getNotificationTitle(notification)}
				</Title>
			</Flex>

			<Divider />

			<Descriptions column={1} size="small">
				<Descriptions.Item label="Notification ID">
					{notification.id}
				</Descriptions.Item>
				<Descriptions.Item label="Date">
					{formattedDate}
				</Descriptions.Item>
			</Descriptions>

			<Divider />

			<div>{children}</div>

			<Flex
				gap={4}
				wrap="wrap"
				style={{
					marginTop: "auto",
					paddingTop: 16,
					borderTop: "1px solid var(--ant-color-border-secondary)",
				}}
			>
				{actions}
			</Flex>
		</Flex>
	);
}

function getNotificationObjectType({notification, includeAdditionalData = false}: NotificationObjectProps): {
	actions: ReactNode[],
	children: ReactNode,
} {
	switch (notification.type) {
		case "exchange_received":
			return ExchangeRecieved({ notification, includeAdditionalData });
		default:
			return {
				actions: [],
				children: (
					<Text style={{ fontSize: 14 }}>
						You have a new notification.
					</Text>
				),
			};
	}
}

function NotificationActionButton({
	label,
	icon,
	showLabel,
	onClick = () => {}
}: {
	label: string;
	icon: string;
	showLabel: boolean;
	onClick?: any,
}) {
	return (
		<Tooltip title={label} placement="bottom">
			<Button
				type="text"
				size="small"
				icon={<IonIcon icon={icon} />}
				style={{fontSize: 16}}
				aria-label={label}
				onClick={onClick}
			>
				{showLabel && (label)}
			</Button>
		</Tooltip>
	);
}

function ExchangeRecieved({notification, includeAdditionalData = false}: NotificationObjectProps) {
	const actions: ReactNode[] = [
		<NotificationActionButton
			key="accept"
			label="Accept"
			icon={IonIcons.checkmarkCircle}
			showLabel={includeAdditionalData}
		/>,
		<NotificationActionButton
			key="reject"
			label="Reject"
			icon={IonIcons.closeCircle}
			showLabel={includeAdditionalData}
		/>,
		<NotificationActionButton
			key="view-exchange"
			label="View exchange"
			icon={IonIcons.eye}
			showLabel={includeAdditionalData}
		/>,
	];

	const children: ReactNode = (
		<>
			<Text style={{fontSize: 14}}>
				You received an exchange from user{" "}
				{JSON.parse(notification.data).fromUserId}.
			</Text>
		</>
	)
	

	return { actions, children }
}