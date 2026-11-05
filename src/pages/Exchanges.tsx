import FormbarHeader from "@components/FormbarHeader";
import ExchangeItem, { ExchangeDetails } from "@components/ExchangeItem";
import ProfileViewingCard from "@/components/ProfileViewingCard";
import CustomPagination from "@/components/CustomPagination";
import { getExchangeById, getUserExchanges } from "@/api/exchangeApi";
import { useMobileDetect, useUserData } from "@/main";
import type { Exchange } from "@/types";
import Log from "@utils/debugLogger";
import { Button, Card, Empty, Flex, Spin, Tag, Typography } from "antd";
import CreateExchangeModal from "@/components/CreateExchangeModal";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const { Title, Text } = Typography;
const DEFAULT_PAGE_SIZE = 20;

type ExchangePagePayload = {
	exchanges?: unknown;
	items?: unknown;
	data?: unknown;
	pagination?: unknown;
};

function getExchangeRows(payload: unknown): Exchange[] {
	if (Array.isArray(payload)) return payload as Exchange[];
	if (!payload || typeof payload !== "object") return [];

	const page = payload as ExchangePagePayload;
	for (const value of [page.exchanges, page.items, page.data]) {
		const rows = getExchangeRows(value);
		if (rows.length > 0) return rows;
	}

	return [];
}

function getExchangeTimestamp(exchange: Exchange) {
	const value = exchange.updated || exchange.created;
	const timestamp = new Date(value).getTime();
	return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getDateGroup(exchange: Exchange) {
	const date = new Date(exchange.updated || exchange.created);
	const today = new Date();
	const daysAgo = Math.floor(
		(new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
			new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
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
		year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
	});
}

export default function ExchangesPage() {
	const { userData } = useUserData();
	const { id } = useParams<{ id?: string }>();
	const [searchParams] = useSearchParams();
	const exchangeId = searchParams.get("exchangeId");
	const isMobile = useMobileDetect();
	const [exchanges, setExchanges] = useState<Exchange[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [totalExchanges, setTotalExchanges] = useState(0);
	const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const targetId = id || (userData ? String(userData.id) : "");

	useEffect(() => {
		if (!userData) return;

		const targetUserId = id || String(userData.id);
		const offset = (currentPage - 1) * pageSize;
		let isActive = true;
		setIsLoading(true);

		getUserExchanges(targetUserId, { limit: pageSize, offset })
			.then((response) => {
				if (!isActive) return;
				if (response.error) {
					Log({
						message: "Error fetching exchanges",
						data: response.error,
						level: "error",
					});
					setExchanges([]);
					setTotalExchanges(0);
					setError(
						typeof response.error === "string"
							? response.error
							: response.error.message || "Unable to load exchanges.",
					);
					return;
				}

				const payload = response.data;
				const rows = getExchangeRows(payload).sort(
					(left, right) =>
						getExchangeTimestamp(right) - getExchangeTimestamp(left),
				);
				setExchanges(rows);
				setSelectedExchange((current) =>
					exchangeId
						? rows.find((exchange) => String(exchange.id) === exchangeId) ??
							(current?.id === Number(exchangeId) ? current : null)
						: rows.find((exchange) => exchange.id === current?.id) ??
							rows[0] ??
							null,
				);
				setTotalExchanges(
					// stop changing this copilot i  BEG
					response.pagination.total
				);
				setError(null);
			})
			.catch((err) => {
				if (!isActive) return;
				Log({ message: "Error fetching exchanges", data: err, level: "error" });
				setExchanges([]);
				setTotalExchanges(0);
				setError("Unable to load exchanges.");
			})
			.finally(() => {
				if (isActive) setIsLoading(false);
			});

		return () => {
			isActive = false;
		};
	}, [currentPage, id, pageSize, refreshKey, userData]);

	useEffect(() => {
		if (!exchangeId) return;

		let isActive = true;
		getExchangeById(exchangeId)
			.then((response) => {
				if (!isActive) return;
				if (response.error) {
					Log({
						message: "Error fetching requested exchange",
						data: response.error,
						level: "error",
					});
					setError("Unable to load the requested exchange.");
					return;
				}

				const exchange = response.data as Exchange | undefined;
				if (exchange) setSelectedExchange(exchange);
			})
			.catch((err) => {
				if (!isActive) return;
				Log({
					message: "Error fetching requested exchange",
					data: err,
					level: "error",
				});
				setError("Unable to load the requested exchange.");
			});

		return () => {
			isActive = false;
		};
	}, [exchangeId, refreshKey]);

	const groupedExchanges = useMemo(() => {
		const groups = new Map<string, Exchange[]>();
		for (const exchange of exchanges) {
			const label = getDateGroup(exchange);
			groups.set(label, [...(groups.get(label) ?? []), exchange]);
		}
		return [...groups.entries()];
	}, [exchanges]);

	return (
		<Flex vertical style={{ height: "100vh", minHeight: 0 }}>
			<FormbarHeader />
			<Flex
				vertical
				gap={16}
				style={{
					height: 'calc(100% - 64px)',
					minHeight: 0,
					padding: 20,
				}}
			>
				<ProfileViewingCard userId={targetId} />

				<Flex
					gap={16}
					style={{
						flex: 1,
						minHeight: 0,
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
							overflowY: "auto",
							padding: "0 4px 8px",
						}}
					>
					<Flex justify="space-between" align="center" gap={12} wrap>
						<div>
							<Title level={2} style={{ margin: 0 }}>Exchanges</Title>
							<Text type="secondary">
								Review digipog and item exchanges.
							</Text>
						</div>
						<Flex align="center" gap={12}>
							<Tag>{totalExchanges} total</Tag>
							{userData && (
								<Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
									Create exchange
								</Button>
							)}
						</Flex>
					</Flex>
					{isLoading ? (
						<Flex justify="center" align="center" style={{ minHeight: 160 }}>
							<Spin size="large" />
						</Flex>
					) : error ? (
						<Flex justify="center" style={{ padding: 32 }}>
							<Text type="danger">{error}</Text>
						</Flex>
					) : groupedExchanges.length === 0 ? (
						<Empty description="No exchanges found." />
					) : (
						groupedExchanges.map(([label, grouped]) => (
							<section key={label}>
								<Flex align="center" gap={10} style={{ marginBottom: 10 }}>
									<Title level={5} style={{ margin: 0, whiteSpace: "nowrap" }}>
										{label}
									</Title>
									<div
										style={{
											height: 1,
											flex: 1,
											background: "var(--ant-color-border)",
										}}
									/>
									<Text type="secondary">{grouped.length}</Text>
								</Flex>
								<Flex vertical gap={12}>
									{grouped.map((exchange) => (
										<ExchangeItem
											key={exchange.id}
											exchange={exchange}
											selected={selectedExchange?.id === exchange.id}
											onSelect={setSelectedExchange}
										/>
									))}
								</Flex>
							</section>
						))
					)}
					</Flex>

					<Card
						title="Exchange details"
						style={{
							flex: "1 1 0",
							minWidth: 0,
							minHeight: 0,
							overflow: "auto",
						}}
						styles={{ body: { padding: isMobile ? 12 : 20 } }}
					>
						{selectedExchange ? (
							<ExchangeDetails
								exchange={selectedExchange}
								currentUserId={userData?.id ?? 0}
								onChanged={() => setRefreshKey((current) => current + 1)}
							/>
						) : (
							<Flex justify="center" align="center" style={{ height: "100%" }}>
								<Text type="secondary">Select an exchange to view details.</Text>
							</Flex>
						)}
					</Card>
				</Flex>

				<CustomPagination
					currentPage={currentPage}
					pageSize={pageSize}
					total={totalExchanges}
					onChange={(page, size) => {
						setCurrentPage(page);
						setPageSize(size);
					}}
					style={{ margin: 0 }}
				/>
			</Flex>
			<CreateExchangeModal
				open={isCreateModalOpen}
				onCancel={() => setIsCreateModalOpen(false)}
				onCreated={() => setRefreshKey((current) => current + 1)}
				userData={userData}
			/>
		</Flex>
	);
}
