import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import {
	Badge,
	Button,
	Card,
	Descriptions,
	Divider,
	Flex,
	Input,
	Modal,
	Popconfirm,
	Spin,
	Tooltip,
	Typography,
} from "antd";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import type {
	NotificationData,
	NotificationPayload,
} from "@/types";
import {
	markNotificationAsRead,
	markNotificationAsUnread,
} from "@/api/notificationApi";
import {
	acceptExchange,
	getExchangeById,
	rejectExchange,
} from "@/api/exchangeApi";
import Log from "@/utils/debugLogger";
import { useNotiData } from "@/main";
import { useUserData } from "@/main";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Ribbon } = Badge;

type Notification = NotificationData["notifications"][number];
type NotificationRenderer = (
	notification: NotificationProps,
) => NotificationRenderResult;

type NotificationProps = {
	notification: Notification;
	includeAdditionalData?: boolean;
	hideInteractables?: boolean;
	showUnread?: boolean;
	onSelect?: (notification: Notification) => void;
	selected?: boolean;
	exchangeStatus?: string;
	onAccept?: () => void;
	onReject?: () => void;
	exchangeActionLoading?: boolean;
	onView?: () => void;
};

type NotificationRenderResult = {
	actions: ReactNode[];
	children: ReactNode;
};

const NotificationTitles: Record<string, string> = {
	exchange_received: "Exchange Received",
	exchange_completed: "Exchange Completed",
	exchange_failed: "Exchange Failed",
	exchange_canceled: "Exchange Cancelled",
	exchange_rejected: "Exchange Rejected",
	trade_received: "Trade Received",
	trade_completed: "Trade Completed",
	trade_failed: "Trade Failed",
	trade_rejected: "Trade Rejected",
	trade_canceled: "Trade Cancelled",
};

function getNotificationTitle(notification: Notification) {
	return NotificationTitles[notification.type] || notification.type;
}

function getNotificationData(notification: Notification): NotificationPayload {
	if (!notification.data) return {};
	if (typeof notification.data === "object") return notification.data;

	try {
		const parsed: unknown = JSON.parse(notification.data);
		return parsed !== null && typeof parsed === "object"
			? (parsed as NotificationPayload)
			: {};
	} catch {
		return {};
	}
}

function getNotificationReference(data: NotificationPayload, type: string) {
	const reference = type.startsWith("exchange")
		? data.exchangeId
		: data.tradeId;
	return reference === undefined ? undefined : ` #${reference}`;
}

function getActor(data: NotificationPayload) {
	return data.fromUserId === undefined ? "another user" : `user ${data.fromUserId}`;
}

type ExchangeParty = {
	id?: number | string;
	type?: string;
	request?: Record<string, unknown>;
	offer?: Record<string, unknown>;
};

type ExchangeDetails = {
	status?: string;
	reason?: string;
	created?: string;
	updated?: string;
	from?: ExchangeParty;
	to?: ExchangeParty;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getExchangeDetails(value: unknown): ExchangeDetails | null {
	if (!isRecord(value)) return null;
	const details = isRecord(value.data) ? value.data : value;
	return details as ExchangeDetails;
}

function formatExchangeItems(items?: Record<string, unknown>) {
	if (!items) return "None";
	const entries = Object.entries(items);
	if (entries.length === 0) return "None";

	return entries
		.map(([itemId, quantity]) => `Item ${itemId} x${String(quantity)}`)
		.join(", ");
}

function formatExchangeDate(value?: string) {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

async function performExchangeAction(
	exchangeId: string,
	action: "accept" | "reject",
	pin: string,
) {
	const response =
		action === "accept"
			? await acceptExchange(exchangeId, pin)
			: await rejectExchange(exchangeId, pin);

	if (response.error) {
		Log({
			message: `Error ${action}ing exchange`,
			data: response.error,
			level: "error",
		});
	}

	return response;
}

export default function NotificationObject({
	notification,
	includeAdditionalData = false,
	hideInteractables = false,
	showUnread = false,
	onSelect,
	selected = false,
}: NotificationProps) {
	const navigate = useNavigate();
	const { userData } = useUserData();
	const [exchangePin, setExchangePin] = useState("");
	const [pendingExchangeAction, setPendingExchangeAction] = useState<
		"accept" | "reject" | null
	>(null);
	const [exchangeActionLoading, setExchangeActionLoading] = useState(false);
	const { refreshNotifications } = useNotiData();
	const isRead = notification.is_read !== 0;
	const toggleReadState = async () => {
		const response = isRead
			? await markNotificationAsUnread(String(notification.id))
			: await markNotificationAsRead(String(notification.id));
		if (response.error) {
			Log({
				message: `Error marking notification as ${isRead ? "unread" : "read"}`,
				data: response.error,
				level: "error",
			});
			return;
		}
		await refreshNotifications();
	};
	const requestExchangeAction = (action: "accept" | "reject") => {
		setExchangePin("");
		setPendingExchangeAction(action);
	};
	const handleExchangeAction = async () => {
		const exchangeId = getNotificationData(notification).exchangeId;
		if (
			exchangeId === undefined ||
			!pendingExchangeAction ||
			!exchangePin.trim()
		) {
			return;
		}

		setExchangeActionLoading(true);
		const response = await performExchangeAction(
			String(exchangeId),
			pendingExchangeAction,
			exchangePin,
		);
		if (!response.error) {
			setPendingExchangeAction(null);
			setExchangePin("");
			await refreshNotifications();
		}
		setExchangeActionLoading(false);
	};
	const { actions, children } = getNotificationObjectType({
		notification,
		includeAdditionalData,
		onAccept: notification.type.startsWith("exchange")
			? () => requestExchangeAction("accept")
			: undefined,
		onReject: notification.type.startsWith("exchange")
			? () => requestExchangeAction("reject")
			: undefined,
		exchangeActionLoading,
		onView: notification.type.startsWith("exchange")
			? () => {
					const exchangeId = getNotificationData(notification).exchangeId;
					if (exchangeId === undefined || !userData) return;
					navigate(
						`/profile/${userData.id}/exchanges?exchangeId=${encodeURIComponent(String(exchangeId))}`,
					);
				}
			: undefined,
	});
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
	const showUnreadRibbon = showUnread && notification.is_read === 0;

	return (
		<Ribbon
			styles={{ root: { width: "100%" }, indicator: { opacity: showUnreadRibbon ? 1 : 0 } }}
			text={showUnreadRibbon ? "Unread" : undefined}
		>
			<Card
				title={getNotificationTitle(notification)}
				className="notiCard"
				onClick={() => onSelect?.(notification)}
				onKeyDown={handleKeyDown}
				tabIndex={onSelect ? 0 : undefined}
				style={{
					borderColor: selected ? "var(--ant-color-primary)" : undefined,
					boxShadow: selected ? "0 0 0 2px var(--ant-color-primary-bg)" : undefined,
					cursor: onSelect ? "pointer" : undefined,
				}}
				styles={{
					header: { fontSize: 14, minHeight: 0, padding: 10 },
					body: { fontSize: 12, padding: 10 },
					extra: { padding: 0, display: "flex" },
				}}
				extra={
					includeAdditionalData ? (
						<Tooltip title={dateString} placement="bottom">
							<IonIcon icon={IonIcons.timeOutline} />
						</Tooltip>
					) : undefined
				}
			>
				<Modal
					title={`${pendingExchangeAction === "accept" ? "Accept" : "Reject"} exchange`}
					open={pendingExchangeAction !== null}
					okText={pendingExchangeAction === "accept" ? "Accept" : "Reject"}
					onCancel={() => {
						if (!exchangeActionLoading) setPendingExchangeAction(null);
					}}
					onOk={() => void handleExchangeAction()}
					confirmLoading={exchangeActionLoading}
					okButtonProps={{
						danger: pendingExchangeAction === "reject",
						disabled: !exchangePin.trim(),
					}}
				>
					<Flex vertical gap={8}>
						<Text>Enter your PIN to continue.</Text>
						<Input.Password
							autoFocus
							value={exchangePin}
							onChange={(event) => setExchangePin(event.target.value)}
							placeholder="PIN"
							disabled={exchangeActionLoading}
						/>
					</Flex>
				</Modal>
				{children}
				{!hideInteractables && (
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
							label={isRead ? "Mark as Unread" : "Mark as Read"}
							icon={isRead ? IonIcons.mailUnread : IonIcons.mailOpen}
							onClick={() => void toggleReadState()}
						/>
					</Flex>
				)}
			</Card>
		</Ribbon>
	);
}

export function NotificationDetails({
	notification,
	onDelete,
	onReadStateChange,
}: {
	notification: Notification;
	onDelete?: () => void;
	onReadStateChange?: (isRead: boolean) => void;
}) {
	const navigate = useNavigate();
	const [exchangeData, setExchangeData] = useState<unknown>(null);
	const { userData } = useUserData();
	const [isExchangeLoading, setIsExchangeLoading] = useState(false);
	const [exchangeError, setExchangeError] = useState<string | null>(null);
	const [exchangeActionLoading, setExchangeActionLoading] = useState(false);
	const [exchangePin, setExchangePin] = useState("");
	const [pendingExchangeAction, setPendingExchangeAction] = useState<
		"accept" | "reject" | null
	>(null);
	const { refreshNotifications } = useNotiData();
	const [isRead, setIsRead] = useState(notification.is_read !== 0);
	const formattedDate = new Date(notification.created_at).toLocaleString("en-US", {
		dateStyle: "long",
		timeStyle: "short",
	});
	const notificationData = getNotificationData(notification);
	const exchangeId = notificationData.exchangeId;

	useEffect(() => {
		setIsRead(notification.is_read !== 0);
	}, [notification.id, notification.is_read]);

	async function toggleReadState() {
		const nextIsRead = !isRead;
		const response = nextIsRead
			? await markNotificationAsRead(String(notification.id))
			: await markNotificationAsUnread(String(notification.id));
		if (response.error) {
			Log({
				message: `Error marking notification as ${nextIsRead ? "read" : "unread"}`,
				data: response.error,
				level: "error",
			});
			return;
		}
		setIsRead(nextIsRead);
		onReadStateChange?.(nextIsRead);
		await refreshNotifications();
	}

	const isExchangeNotification = notification.type.startsWith("exchange");
	const exchangeDetails = getExchangeDetails(exchangeData);
	function requestExchangeAction(action: "accept" | "reject") {
		setExchangePin("");
		setPendingExchangeAction(action);
	}

	async function handleExchangeAction() {
		if (!exchangeId || !pendingExchangeAction || !exchangePin.trim()) return;

		setExchangeActionLoading(true);
		const response = await performExchangeAction(
			String(exchangeId),
			pendingExchangeAction,
			exchangePin,
		);
		if (!response.error) {
			const refreshed = await getExchangeById(String(exchangeId));
			if (!refreshed.error) setExchangeData(refreshed.data);
			setPendingExchangeAction(null);
			setExchangePin("");
			await refreshNotifications();
		}
		setExchangeActionLoading(false);
	}

	const { actions, children } = getNotificationObjectType({
		notification,
		includeAdditionalData: true,
		exchangeStatus: exchangeDetails?.status,
		onAccept: isExchangeNotification
			? () => requestExchangeAction("accept")
			: undefined,
		onReject: isExchangeNotification
			? () => requestExchangeAction("reject")
			: undefined,
		exchangeActionLoading: exchangeActionLoading,
		onView: notification.type.startsWith("exchange")
			? () => {
					const exchangeId = getNotificationData(notification).exchangeId;
					if (exchangeId === undefined || !userData) return;
					navigate(
						`/profile/${userData.id}/exchanges?exchangeId=${encodeURIComponent(String(exchangeId))}`,
					);
				}
			: undefined,
	});

	useEffect(() => {
		if (!isExchangeNotification || exchangeId === undefined) {
			setExchangeData(null);
			setExchangeError(null);
			setIsExchangeLoading(false);
			return;
		}

		let isActive = true;
		setIsExchangeLoading(true);
		setExchangeError(null);

		getExchangeById(String(exchangeId))
			.then((response) => {
				if (!isActive) return;
				if (response.error) {
					const message =
						typeof response.error === "string"
							? response.error
							: response.error.message || "Unable to load exchange details.";
					setExchangeError(message);
					setExchangeData(null);
					return;
				}
				setExchangeData(response.data);
			})
			.catch((error) => {
				if (!isActive) return;
				Log({
					message: "Error fetching exchange details",
					data: error,
					level: "error",
				});
				setExchangeData(null);
				setExchangeError("Unable to load exchange details.");
			})
			.finally(() => {
				if (isActive) setIsExchangeLoading(false);
			});

		return () => {
			isActive = false;
		};
	}, [exchangeId, isExchangeNotification]);

	return (
		<Flex vertical style={{ height: "100%" }}>
			<Modal
				title={`${pendingExchangeAction === "accept" ? "Accept" : "Reject"} exchange`}
				open={pendingExchangeAction !== null}
				okText={pendingExchangeAction === "accept" ? "Accept" : "Reject"}
				onCancel={() => {
					if (!exchangeActionLoading) setPendingExchangeAction(null);
				}}
				onOk={handleExchangeAction}
				confirmLoading={exchangeActionLoading}
				okButtonProps={{
					danger: pendingExchangeAction === "reject",
					disabled: !exchangePin.trim(),
				}}
			>
				<Flex vertical gap={8}>
					<Text>Enter your PIN to continue.</Text>
					<Input.Password
						autoFocus
						value={exchangePin}
						onChange={(event) => setExchangePin(event.target.value)}
						onPressEnter={() => {
							if (exchangePin.trim()) void handleExchangeAction();
						}}
						placeholder="PIN"
						disabled={exchangeActionLoading}
					/>
				</Flex>
			</Modal>
			<Title level={3} style={{ margin: 0 }}>{getNotificationTitle(notification)}</Title>
			<Divider />
			<Descriptions column={1} size="small">
				<Descriptions.Item label="Notification ID">{notification.id}</Descriptions.Item>
				<Descriptions.Item label="Date">{formattedDate}</Descriptions.Item>
			</Descriptions>
			<Divider />
			<div>{children}</div>
			{isExchangeNotification && (
				<>
					<Divider />
					<Flex vertical gap={8}>
						<Title level={5} style={{ margin: 0 }}>
							Exchange details
						</Title>
						{isExchangeLoading ? (
							<Flex justify="center">
								<Spin size="small" />
							</Flex>
						) : exchangeError ? (
							<Text type="danger">{exchangeError}</Text>
						) : exchangeDetails === null ? (
							<Text type="secondary">
								Exchange details are unavailable.
							</Text>
						) : (
							<Descriptions column={1} size="small">
								{exchangeDetails.status && (
									<Descriptions.Item label="Status">
										{exchangeDetails.status}
									</Descriptions.Item>
								)}
								{exchangeDetails.reason && (
									<Descriptions.Item label="Reason">
										{exchangeDetails.reason}
									</Descriptions.Item>
								)}
								{exchangeDetails.from && (
									<Descriptions.Item label="From">
										User {exchangeDetails.from.id ?? "unknown"} (
										{exchangeDetails.from.type ?? "unknown"})
										<br />
										Offer: {formatExchangeItems(exchangeDetails.from.offer)}
									</Descriptions.Item>
								)}
								{exchangeDetails.to && (
									<Descriptions.Item label="To">
										User {exchangeDetails.to.id ?? "unknown"} (
										{exchangeDetails.to.type ?? "unknown"})
										<br />
										Request: {formatExchangeItems(exchangeDetails.to.request)}
									</Descriptions.Item>
								)}
								{formatExchangeDate(exchangeDetails.created) && (
									<Descriptions.Item label="Created">
										{formatExchangeDate(exchangeDetails.created)}
									</Descriptions.Item>
								)}
								{formatExchangeDate(exchangeDetails.updated) && (
									<Descriptions.Item label="Updated">
										{formatExchangeDate(exchangeDetails.updated)}
									</Descriptions.Item>
								)}
							</Descriptions>
						)}
					</Flex>
				</>
			)}
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
				<NotificationActionButton
					showLabel
					label={isRead ? "Mark as Unread" : "Mark as Read"}
					icon={isRead ? IonIcons.mailUnread : IonIcons.mailOpen}
					onClick={() => void toggleReadState()}
				/>
				{onDelete && (
					<Popconfirm
						title="Delete this notification?"
						description="This action cannot be undone."
						okText="Delete"
						okButtonProps={{ danger: true }}
						onConfirm={onDelete}
					>
						<Button
							danger
							type="text"
							size="small"
							style={{ fontSize: 16,marginLeft: 'auto' }}
							icon={<IonIcon icon={IonIcons.trashOutline} />}
							aria-label="Delete notification"
						>
							Delete
						</Button>
					</Popconfirm>
				)}
			</Flex>
		</Flex>
	);
}

function getNotificationObjectType(props: NotificationProps): NotificationRenderResult {
	const renderer = notificationRenderers[props.notification.type];
	return renderer ? renderer(props) : unknownNotification();
}

function action(
	label: string,
	icon: string,
	showLabel: boolean,
	key: string,
	disabled = false,
	onClick?: () => void,
	loading = false,
) {
	return (
		<NotificationActionButton
			key={key}
			label={label}
			icon={icon}
			showLabel={showLabel}
			disabled={disabled}
			onClick={onClick}
			loading={loading}
		/>
	);
}

function receivedActions(props: NotificationProps): ReactNode[] {
	const isCompleted = props.exchangeStatus?.toLowerCase() === "completed" || props.exchangeStatus?.toLowerCase() === "rejected" || props.exchangeStatus?.toLowerCase() === "canceled";
	return [
		action(
			`Accept`,
			IonIcons.checkmarkCircle,
			!!props.includeAdditionalData,
			"accept",
			isCompleted,
			props.onAccept,
			props.exchangeActionLoading,
		),
		action(
			`Reject`,
			IonIcons.closeCircle,
			!!props.includeAdditionalData,
			"reject",
			isCompleted,
			props.onReject,
			props.exchangeActionLoading,
		),
		action(`View`, IonIcons.eye, !!props.includeAdditionalData, "view", false, props.onView),
	];
}

function eventMessage(
	notification: Notification,
	message: string,
): ReactNode {
	const data = getNotificationData(notification);
	const reference = getNotificationReference(data, notification.type);
	const detail = data.reason || data.error;

	return (
		<Text style={{ fontSize: 14 }}>
			{message}{reference}.{detail ? ` ${detail}` : ""}
		</Text>
	);
}

export function ExchangeReceived(props: NotificationProps): NotificationRenderResult {
	const data = getNotificationData(props.notification);
	return {
		actions: receivedActions(props),
		children: eventMessage(props.notification, `You received an exchange from ${getActor(data)}`),
	};
}

export function ExchangeCompleted(props: NotificationProps): NotificationRenderResult {
	return {
		actions: [action(`View`, IonIcons.eye, !!props.includeAdditionalData, "view", false, props.onView)],
		children: eventMessage(props.notification, "Your exchange was completed"),
	};
}

export function ExchangeFailed(props: NotificationProps): NotificationRenderResult {
	return {
		actions: [action(`View`, IonIcons.eye, !!props.includeAdditionalData, "view", false, props.onView)],
		children: eventMessage(props.notification, "Your exchange failed"),
	};
}

export function ExchangeCanceled(props: NotificationProps): NotificationRenderResult {
	return {
		actions: [action(`View`, IonIcons.eye, !!props.includeAdditionalData, "view", false, props.onView)],
		children: eventMessage(props.notification, "Your exchange was cancelled"),
	};
}

export function ExchangeRejected(props: NotificationProps): NotificationRenderResult {
	return {
		actions: [action(`View`, IonIcons.eye, !!props.includeAdditionalData, "view", false, props.onView)],
		children: eventMessage(props.notification, "Your exchange was rejected"),
	};
}

export function TradeReceived(props: NotificationProps): NotificationRenderResult {
	const data = getNotificationData(props.notification);
	return {
		actions: receivedActions(props),
		children: eventMessage(props.notification, `You received a trade from ${getActor(data)}`),
	};
}

export function TradeCompleted(props: NotificationProps): NotificationRenderResult {
	return {
		actions: [action(`View`, IonIcons.eye, !!props.includeAdditionalData, "view")],
		children: eventMessage(props.notification, "Your trade was completed"),
	};
}

export function TradeFailed(props: NotificationProps): NotificationRenderResult {
	return {
		actions: [action(`View`, IonIcons.eye, !!props.includeAdditionalData, "view")],
		children: eventMessage(props.notification, "Your trade failed"),
	};
}

export function TradeRejected(props: NotificationProps): NotificationRenderResult {
	return {
		actions: [action(`View`, IonIcons.eye, !!props.includeAdditionalData, "view")],
		children: eventMessage(props.notification, "Your trade was rejected"),
	};
}

export function TradeCanceled(props: NotificationProps): NotificationRenderResult {
	return {
		actions: [action(`View`, IonIcons.eye, !!props.includeAdditionalData, "view")],
		children: eventMessage(props.notification, "Your trade was cancelled"),
	};
}

function unknownNotification(): NotificationRenderResult {
	return {
		actions: [],
		children: <Text style={{ fontSize: 14 }}>You have a new notification.</Text>,
	};
}

const notificationRenderers: Record<string, NotificationRenderer> = {
	exchange_received: ExchangeReceived,
	exchange_completed: ExchangeCompleted,
	exchange_failed: ExchangeFailed,
	exchange_canceled: ExchangeCanceled,
	exchange_rejected: ExchangeRejected,
	trade_received: TradeReceived,
	trade_completed: TradeCompleted,
	trade_failed: TradeFailed,
	trade_rejected: TradeRejected,
	trade_canceled: TradeCanceled,
};

function NotificationActionButton({
	label,
	icon,
	showLabel,
	onClick,
	disabled = false,
	loading = false,
}: {
	label: string;
	icon: string;
	showLabel: boolean;
	onClick?: () => void;
	disabled?: boolean;
	loading?: boolean;
}) {
	return (
		<Tooltip title={label} placement="bottom">
			<Button
				type="text"
				size="small"
				icon={<IonIcon icon={icon} />}
				style={{ fontSize: 16 }}
				aria-label={label}
				onClick={onClick}
				disabled={disabled}
				loading={loading}
			>
				{showLabel && label}
			</Button>
		</Tooltip>
	);
}
