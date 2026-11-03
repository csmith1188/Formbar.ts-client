import FormbarHeader from "@/components/FormbarHeader";
import CustomPagination from "@/components/CustomPagination";
import NotificationObject, {
	NotificationDetails,
} from "@/components/NotificationTypes";
import {
	getNotifications,
	markNotificationAsRead,
} from "@/api/notificationApi";
import { useMobileDetect, useUserData } from "@/main";
import Log from "@/utils/debugLogger";
import { Card, Empty, Flex, Spin, Typography } from "antd";
const { Title, Text } = Typography;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NotificationData } from "@/types";

const DEFAULT_PAGE_SIZE = 20;

type Notification = NotificationData["notifications"][number];

function getDateGroup(notification: Notification) {
	const date = new Date(notification.created_at);
	const today = new Date();
	const startOfToday = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
	);
	const startOfNotificationDay = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const daysAgo = Math.round(
		(startOfToday.getTime() - startOfNotificationDay.getTime()) /
			(1000 * 60 * 60 * 24),
	);

	if (daysAgo === 0) return "Today";
	if (daysAgo === 1) return "Yesterday";
	if (daysAgo > 1 && daysAgo < 7) {
		return date.toLocaleDateString("en-US", { weekday: "long" });
	}

	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year:
			date.getFullYear() === today.getFullYear() ? undefined : "numeric",
	});
}

function groupNotifications(notifications: Notification[]) {
	const groups = new Map<string, Notification[]>();

	for (const notification of notifications) {
		const label = getDateGroup(notification);
		const group = groups.get(label) ?? [];
		group.push(notification);
		groups.set(label, group);
	}

	return [...groups.entries()];
}

function markNotificationRead(
	notifications: Notification[],
	notificationId: number,
) {
	return notifications.map((notification) =>
		notification.id === notificationId
			? { ...notification, is_read: 1 }
			: notification,
	);
}

export default function NotificationsPage() {
	const { userData } = useUserData();
	const isMobile = useMobileDetect();
	const navigate = useNavigate();
	const [notifications, setNotifications] = useState<
		NotificationData["notifications"]
	>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [totalNotifications, setTotalNotifications] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedNotification, setSelectedNotification] =
		useState<Notification | null>(null);

	const handleNotificationSelect = async (notification: Notification) => {
		setSelectedNotification(notification);

		try {
			const response = await markNotificationAsRead(String(notification.id));
			if (response.error) {
				Log({
					message: "Error marking notification as read",
					data: response.error,
					level: "error",
				});
				return;
			}

			setNotifications((current) =>
				markNotificationRead(current, notification.id),
			);
			setSelectedNotification((current) =>
				current?.id === notification.id
					? { ...current, is_read: 1 }
					: current,
			);
		} catch (err) {
			Log({
				message: "Error marking notification as read",
				data: err,
				level: "error",
			});
		}
	};

	useEffect(() => {
		if (!userData) {
			navigate("/login");
			return;
		}

		let isActive = true;
		const offset = (currentPage - 1) * pageSize;

		setIsLoading(true);
		getNotifications({ limit: pageSize, offset })
			.then((response) => {
				if (!isActive) return;

				if (response.error) {
					const message =
						typeof response.error === "string"
							? response.error
							: response.error.message || "Unable to load notifications.";
					setNotifications([]);
					setSelectedNotification(null);
					setTotalNotifications(0);
					setError(message);
					return;
				}

				const data = response.data as NotificationData | undefined;
				const notificationRows = Array.isArray(data?.notifications)
					? data.notifications
					: [];
				const total =
					typeof data?.pagination?.total === "number"
						? data.pagination.total
						: notificationRows.length;

				setNotifications(notificationRows);
				setSelectedNotification((current) => {
					const currentNotification = current
						? notificationRows.find(
								(notification) => notification.id === current.id,
							)
						: undefined;
					return currentNotification ?? notificationRows[0] ?? null;
				});
				setTotalNotifications(total);
				setError(null);
			})
			.catch((err) => {
				if (!isActive) return;

				Log({
					message: "Error fetching notifications",
					data: err,
					level: "error",
				});
				setNotifications([]);
				setSelectedNotification(null);
				setTotalNotifications(0);
				setError("Unable to load notifications.");
			})
			.finally(() => {
				if (isActive) setIsLoading(false);
			});

		return () => {
			isActive = false;
		};
	}, [currentPage, navigate, pageSize, userData]);

	return (
		<>
			<FormbarHeader />
			<Flex
				vertical
				gap={16}
				style={{
					height: "calc(100vh - 60px)",
					minHeight: 0,
					padding: isMobile ? "16px 12px 8px" : "20px 24px 8px",
				}}
			>
				<Flex
					vertical={isMobile}
					gap={16}
					style={{
						flex: 1,
						minHeight: 0,
						width: "100%",
						flexDirection: isMobile ? "column" : "row",
					}}
				>
					<Flex
						vertical
						gap={20}
						style={{
							flex: "1 1 0",
							minWidth: 0,
							minHeight: 0,
						}}
					>
						<div>
							<Title level={2} style={{ margin: 0 }}>
								Notifications
							</Title>
							<Text type="secondary">
								Stay up to date with your exchanges and trades.
							</Text>
						</div>
						<Card
							style={{
								flex: 1,
								minHeight: 0,
								overflow: "hidden",
							}}
							styles={{ body: { height: "100%", padding: isMobile ? 12 : 20 } }}
						>
							<div
								style={{
									height: "100%",
									overflowY: "auto",
									padding: "0 4px 4px",
								}}
							>
								{isLoading ? (
									<Flex
										justify="center"
										align="center"
										style={{ height: "100%" }}
									>
										<Spin size="large" />
									</Flex>
								) : error ? (
									<Flex
										justify="center"
										align="center"
										style={{ height: "100%" }}
									>
										<Text type="danger">{error}</Text>
									</Flex>
								) : notifications.length > 0 ? (
									<Flex vertical gap={24}>
										{groupNotifications(notifications).map(
											([label, groupedNotifications]) => (
												<section key={label}>
													<Flex
														align="center"
														gap={10}
														style={{ marginBottom: 10 }}
													>
														<Title
															level={5}
															style={{ margin: 0, whiteSpace: "nowrap" }}
														>
															{label}
														</Title>
														<div
															style={{
																height: 1,
																flex: 1,
																background: "var(--ant-color-border)",
															}}
														/>
														<Text type="secondary">
															{groupedNotifications.length}
														</Text>
													</Flex>
													<Flex vertical gap={12} style={{paddingRight: 10}}>
														{groupedNotifications.map((notification) => (
															<NotificationObject
																key={notification.id}
																notification={notification}
																hideInteractables
																showUnread
																selected={
																	selectedNotification?.id === notification.id
																}
																onSelect={handleNotificationSelect}
															/>
														))}
													</Flex>
												</section>
											),
										)}
									</Flex>
								) : (
									<Flex
										justify="center"
										align="center"
										style={{ height: "100%" }}
									>
										<Empty
											description="You’re all caught up"
											image={Empty.PRESENTED_IMAGE_SIMPLE}
										/>
									</Flex>
								)}
							</div>
						</Card>
					</Flex>

					<Card
						style={{
							flex: "1 1 0",
							minWidth: 0,
							minHeight: 0,
							overflow: "auto",
						}}
						title="Notification details"
						styles={{
							body: {
								height: "calc(-64px + 100%)",
								padding: isMobile ? 12 : 20,
							},
						}}
					>
						{selectedNotification ? (
							<NotificationDetails
								notification={selectedNotification}
							/>
						) : (
							<Flex
								vertical
								justify="center"
								align="center"
								gap={8}
								style={{ height: "100%", textAlign: "center" }}
							>
								<Title level={4} style={{ margin: 0 }}>
									Select a notification
								</Title>
								<Text type="secondary">
									Choose a notification to view its details and actions.
								</Text>
							</Flex>
						)}
					</Card>
				</Flex>

				{!isLoading && !error && totalNotifications > 0 && (
					<CustomPagination
						currentPage={currentPage}
						pageSize={pageSize}
						total={totalNotifications}
						onChange={(page, size) => {
							setCurrentPage(page);
							setPageSize(size);
						}}
						style={{ margin: 0 }}
					/>
				)}
			</Flex>
		</>
	);
}