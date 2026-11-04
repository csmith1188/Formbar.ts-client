import { getItemByID } from "@/api/inventoryApi";
import {
	acceptExchange,
	cancelExchange,
	rejectExchange,
} from "@/api/exchangeApi";
import type { Exchange, RegistryItem } from "@/types";
import {
	Card,
	Button,
	Descriptions,
	Divider,
	Flex,
	Image,
	Input,
	Modal,
	Popconfirm,
	Spin,
	Tag,
	Tooltip,
	Typography,
} from "antd";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useEffect, useState } from "react";
import Log from "@/utils/debugLogger";

const { Text, Title } = Typography;

function formatParty(party: Pick<Exchange["from"], "id" | "type">) {
	return `${party.type === "pool" ? "Pool" : "User"} ${party.id}`;
}

function formatDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function getStatusColor(status: string) {
	return status === "completed"
		? "success"
		: status === "rejected" || status === "canceled"
			? "error"
			: "processing";
}

function getItemDetails(itemId: string, registry: Map<number, RegistryItem>) {
	if (itemId === "0") {
		return {
			name: "Digipogs",
			description: "Digipogs",
			imageUrl: "https://placehold.co/100x100?text=Pogs",
		};
	}

	const item = registry.get(Number(itemId));
	return {
		name: item?.name ?? `Item ${itemId}`,
		description: item?.description ?? "Item details unavailable",
		imageUrl:
			item?.image_url ?? "https://placehold.co/100x100?text=No+Image",
	};
}

function ItemList({
	items,
	registry,
}: {
	items: Record<string, number>;
	registry: Map<number, RegistryItem>;
}) {
	const entries = Object.entries(items);
	if (entries.length === 0) return <Text type="secondary">None</Text>;

	return (
		<Flex gap={8} wrap>
			{entries.map(([itemId, quantity]) => (
				<ItemTile
					key={itemId}
					itemId={itemId}
					quantity={quantity}
					registry={registry}
				/>
			))}
		</Flex>
	);
}

function ItemTile({
	itemId,
	quantity,
	registry,
}: {
	itemId: string;
	quantity: number;
	registry: Map<number, RegistryItem>;
}) {
	const item = getItemDetails(itemId, registry);

	return (
		<Flex vertical gap={4} style={{ width: 100, position: "relative" }}>
			<Tooltip title={item.name} mouseEnterDelay={0.5}>
				<Image
					width={100}
					height={100}
					src={item.imageUrl}
					alt={item.name}
					preview={false}
					fallback="https://placehold.co/100x100?text=No+Image"
					style={{ borderRadius: 8, objectFit: "cover" }}
				/>
				<Text
					strong
					style={{
						position: "absolute",
						right: 6,
						top: 76,
						color: "#fff",
						filter: "drop-shadow(0 0 3px #000)",
					}}
				>
					x{quantity}
				</Text>
			</Tooltip>
		</Flex>
	);
}

export default function ExchangeItem({
	exchange,
	onSelect,
	selected = false,
}: {
	exchange: Exchange;
	onSelect?: (exchange: Exchange) => void;
	selected?: boolean;
}) {
	return (
		<Card
			size="small"
			title={
				<Flex align="center" gap={8}>
					<Text strong>{formatParty(exchange.from)}</Text>
					<IonIcon icon={IonIcons.arrowForward} />
					<Text strong>{formatParty(exchange.to)}</Text>
				</Flex>
			}
			onClick={() => onSelect?.(exchange)}
			style={{
				width: "100%",
				cursor: onSelect ? "pointer" : undefined,
				borderColor: selected ? "var(--ant-color-primary)" : undefined,
			}}
			styles={{ body: { padding: "8px 12px" } }}
			extra={<Tag color={getStatusColor(exchange.status)}>{exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}</Tag>}
		>
			<Flex justify="space-between" gap={12} wrap>
				<Text ellipsis style={{ maxWidth: "70%" }}>
					{exchange.reason || "Exchange"}
				</Text>
				<Text type="secondary">{formatDate(exchange.updated)}</Text>
			</Flex>
		</Card>
	);
}

export function ExchangeDetails({
	exchange,
	currentUserId,
	onChanged,
}: {
	exchange: Exchange;
	currentUserId: number;
	onChanged?: () => void;
}) {
	const [registry, setRegistry] = useState<Map<number, RegistryItem>>(new Map());
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pin, setPin] = useState("");
	const [pinAction, setPinAction] = useState<
		"accept" | "reject" | "cancel" | null
	>(null);
	const [isActionLoading, setIsActionLoading] = useState(false);

	const isPending = exchange.status.toLowerCase() === "pending";
	const isCreator = exchange.from.type === "user" && exchange.from.id === currentUserId;
	const isRecipient = exchange.to.type === "user" && exchange.to.id === currentUserId;

	const runPinAction = async () => {
		if (!pinAction || !pin.trim()) return;

		setIsActionLoading(true);
		const response =
			pinAction === "accept"
				? await acceptExchange(String(exchange.id), pin)
				: pinAction === "reject"
					? await rejectExchange(String(exchange.id), pin)
					: await cancelExchange(String(exchange.id), pin);

		if (response.error) {
			Log({
				message: `Error performing ${pinAction} action on exchange`,
				data: response.error,
				level: "error",
			});
			setIsActionLoading(false);
		} else {
			setPin("");
			setPinAction(null);
			onChanged?.();
		}
		setIsActionLoading(false);
	};

	useEffect(() => {
		let isActive = true;
		const itemIds = new Set([
			...Object.keys(exchange.from.offer),
			...Object.keys(exchange.to.request),
		]);
		const fetchItems = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const fetchedItems = await Promise.all(
					[...itemIds]
						.filter((itemId) => itemId !== "0")
						.map(async (itemId) => {
							const response = await getItemByID(Number(itemId));
							if (response.error) {
								throw new Error(
									typeof response.error === "string"
										? response.error
										: response.error.message || `Unable to load item ${itemId}.`,
								);
							}
							return response.data as RegistryItem;
						}),
				);

				if (!isActive) return;
				setRegistry(new Map(fetchedItems.map((item) => [item.id, item])));
			} catch (err) {
				if (!isActive) return;
				Log({ message: "Error fetching exchange items", data: err, level: "error" });
				setError(
					err instanceof Error ? err.message : "Unable to load exchange items.",
				);
			} finally {
				if (isActive) setIsLoading(false);
			}
		};

		void fetchItems();

		return () => {
			isActive = false;
		};
	}, [exchange.from.offer, exchange.to.request]);

	return (
		<Flex vertical gap={12}>
			<Flex justify="space-between" align="center" gap={12}>
				<Title level={3} style={{ margin: 0 }}>Exchange #{exchange.id}</Title>
				<Tag color={getStatusColor(exchange.status)}>{exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}</Tag>
			</Flex>
			<Descriptions column={1} size="small">
				<Descriptions.Item label="From">{formatParty(exchange.from)}</Descriptions.Item>
				<Descriptions.Item label="To">{formatParty(exchange.to)}</Descriptions.Item>
				<Descriptions.Item label="Reason">{exchange.reason || "None"}</Descriptions.Item>
				<Descriptions.Item label="Created">{formatDate(exchange.created)}</Descriptions.Item>
				<Descriptions.Item label="Updated">{formatDate(exchange.updated)}</Descriptions.Item>
			</Descriptions>
			<Divider style={{ margin: "4px 0" }} />
			{isLoading ? (
				<Flex justify="center"><Spin size="small" /></Flex>
			) : error ? (
				<Text type="danger">{error}</Text>
			) : (
				<Flex
					gap={16}
					style={{ flexDirection: "row" }}
					wrap="wrap"
				>
					<Flex vertical gap={8} style={{ flex: "1 1 220px", minWidth: 0 }}>
						<Text strong>Offer</Text>
						<ItemList items={exchange.from.offer} registry={registry} />
					</Flex>
					<Flex vertical gap={8} style={{ flex: "1 1 220px", minWidth: 0 }}>
						<Text strong>Request</Text>
						<ItemList items={exchange.to.request} registry={registry} />
					</Flex>
				</Flex>
			)}
			{isPending && (isRecipient || isCreator) && (
				<>
					<Divider style={{ margin: "4px 0" }} />
					<Flex gap={8} wrap>
						{isRecipient && (
							<>
								<Button
									type="primary"
									icon={<IonIcon icon={IonIcons.checkmarkCircle} />}
									onClick={() => {
										setPin("");
										setPinAction("accept");
									}}
									disabled={isActionLoading}
								>
									Accept
								</Button>
								<Button
									danger
									icon={<IonIcon icon={IonIcons.closeCircle} />}
									onClick={() => {
										setPin("");
										setPinAction("reject");
									}}
									disabled={isActionLoading}
								>
									Reject
								</Button>
							</>
						)}
						{isCreator && (
							<Popconfirm
								title="Cancel this exchange?"
								description="Canceling an exchange requires your PIN."
								okText="Continue"
								onConfirm={() => {
									setPin("");
									setPinAction("cancel");
								}}
							>
								<Button
									danger
									icon={<IonIcon icon={IonIcons.closeCircle} />}
									loading={isActionLoading}
								>
									Cancel
								</Button>
							</Popconfirm>
						)}
					</Flex>
				</>
			)}
			<Modal
				title={`${pinAction === "accept" ? "Accept" : pinAction === "reject" ? "Reject" : "Cancel"} exchange`}
				open={pinAction !== null}
				okText={
					pinAction === "accept"
						? "Accept"
						: pinAction === "reject"
							? "Reject"
							: "Cancel"
				}
				okButtonProps={{
					danger: pinAction !== "accept",
					disabled: !pin.trim(),
				}}
				confirmLoading={isActionLoading}
				onCancel={() => {
					if (!isActionLoading) setPinAction(null);
				}}
				onOk={() => void runPinAction()}
			>
				<Flex vertical gap={8}>
					<Text>Enter your PIN to continue.</Text>
					<Input.Password
						autoFocus
						value={pin}
						onChange={(event) => setPin(event.target.value)}
						disabled={isActionLoading}
						placeholder="PIN"
					/>
				</Flex>
			</Modal>
		</Flex>
	);
}
