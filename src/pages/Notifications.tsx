import FormbarHeader from "@/components/FormbarHeader";
import CustomPagination from "@/components/CustomPagination";
import NotificationObject from "@/components/NotificationTypes";
import { getNotifications } from "@/api/notificationApi";
import { useMobileDetect, useUserData } from "@/main";
import Log from "@/utils/debugLogger";
import { Col, Flex, Row, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NotificationData } from "@/types";

const DEFAULT_PAGE_SIZE = 20;

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
				align="center"
				gap={16}
				style={{
					height: "calc(100% - 64px)",
					padding: isMobile ? "20px 12px 0" : "20px 20% 0",
				}}
			>
				<Typography.Title style={{ margin: 0 }}>
					Notifications
				</Typography.Title>

				<Row
					gutter={[16, 16]}
					style={{
						width: "100%",
						maxWidth: 1000,
						flex: 1,
						overflowY: "auto",
						alignContent: "start",
						padding: "4px 4px 16px",
					}}
				>
					{isLoading ? (
						<Col span={24}>
							<Flex justify="center" style={{ padding: 32 }}>
								<Spin />
							</Flex>
						</Col>
					) : error ? (
						<Col span={24}>
							<Typography.Text
								type="danger"
								style={{ display: "block", textAlign: "center" }}
							>
								{error}
							</Typography.Text>
						</Col>
					) : notifications.length > 0 ? (
						notifications.map((notification) => (
							<Col key={notification.id} xs={24} md={12}>
								<NotificationObject notification={notification} />
							</Col>
						))
					) : (
						<Col span={24}>
							<Typography.Text
								type="secondary"
								style={{ display: "block", textAlign: "center" }}
							>
								You have no notifications.
							</Typography.Text>
						</Col>
					)}
				</Row>

				{!isLoading && !error && totalNotifications > 0 && (
					<CustomPagination
						currentPage={currentPage}
						pageSize={pageSize}
						total={totalNotifications}
						onChange={(page, size) => {
							setCurrentPage(page);
							setPageSize(size);
						}}
						style={{ marginBottom: 8 }}
					/>
				)}
			</Flex>
		</>
	);
}