import { createExchange } from "@/api/exchangeApi";
import { getUserInventory } from "@/api/inventoryApi";
import { getUser } from "@/api/userApi";
import type { CurrentUserData, InventoryItem, UserData } from "@/types";
import Log from "@/utils/debugLogger";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import {
	Alert,
	Button,
	Card,
	Flex,
	Image,
	Input,
	InputNumber,
	Modal,
	Popconfirm,
	Spin,
	Tag,
	Typography,
} from "antd";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

const { Text } = Typography;
const DIGIPOG_ID = 0;

type TradeQuantity = Record<number, number>;

type CreateExchangeModalProps = {
	open: boolean;
	onCancel: () => void;
	onCreated?: () => void;
	userData: CurrentUserData | null;
};

function getErrorMessage(error: unknown, fallback: string) {
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		const message = (error as { message?: unknown }).message;
		if (typeof message === "string") return message;
	}
	return fallback;
}

function TradeInventory({
	title,
	inventory,
	digipogs,
	type,
	quantities,
	onQuantityChange,
}: {
	title: string;
	inventory: InventoryItem[];
	digipogs: number;
	type: 'offer' | 'request'
	quantities: TradeQuantity;
	onQuantityChange: (itemId: number, quantity: number) => void;
}) {
	const items = useMemo(
		() => [
			{
				id: DIGIPOG_ID,
				name: "Digipogs",
				description: "Digipogs",
				image_url: "https://placehold.co/600x600?text=Digipogs",
				quantity: digipogs,
			},
			...inventory.filter((item) => item.id !== DIGIPOG_ID),
		],
		[digipogs, inventory],
	);

	return (
		<Card
			title={title}
			style={{ flex: "1 1 0", minWidth: 0 }}
			styles={{
				body: {
					maxHeight: 360,
					minHeight: 360,
					overflowY: "auto",
				},
			}}
			extra={
				<Tag color={type === "offer" ? "pink" : "blue"}>{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>
			}
		>
			<Flex vertical gap={12}>
				{items.length === 0 ? (
					<Text type="secondary">No items available.</Text>
				) : (
					items.map((item) => (
						<Flex key={item.id} align="center" gap={10}>
							<Image
								width={48}
								height={48}
								src={item.image_url || undefined}
								fallback="https://placehold.co/600x600?text=No+Image"
								preview={false}
								style={{ borderRadius: 6, objectFit: "cover" }}
								alt={item.name}
							/>
							<Flex vertical style={{ flex: 1, minWidth: 0 }}>
								<Text strong ellipsis>{item.name}</Text>
								<Text type="secondary">Available: {item.quantity}</Text>
							</Flex>
							<InputNumber
								min={0}
								max={item.quantity}
								value={quantities[item.id] || 0}
								onChange={(value) =>
									onQuantityChange(item.id, value || 0)
								}
								disabled={item.quantity <= 0}
								aria-label={`Quantity of ${item.name} to trade`}
							/>
						</Flex>
					))
				)}
			</Flex>
		</Card>
	);
}

export default function CreateExchangeModal({
	open,
	onCancel,
	onCreated,
	userData,
}: CreateExchangeModalProps) {
	const [targetId, setTargetId] = useState("");
	const [ownInventory, setOwnInventory] = useState<InventoryItem[]>([]);
	const [targetUserData, setTargetUserData] = useState<UserData>();
	const [targetInventory, setTargetInventory] = useState<InventoryItem[]>([]);
	const [targetDigipogs, setTargetDigipogs] = useState(0);
	const [hasLoadedTarget, setHasLoadedTarget] = useState(false);
	const [offer, setOffer] = useState<TradeQuantity>({});
	const [request, setRequest] = useState<TradeQuantity>({});
	const [reason, setReason] = useState("");
	const [isLoadingTarget, setIsLoadingTarget] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [pin, setPin] = useState<string>();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open && userData) {
			getUserInventory(String(userData.id))
				.then((response) => {
					if (response.error) throw new Error(
						getErrorMessage(response.error, "Unable to load your inventory."),
					);
					setOwnInventory(response.data ?? []);
				})
				.catch((loadError) => {
					Log({ message: "Error loading your inventory for exchange", data: loadError, level: "error" });
					setError(getErrorMessage(loadError, "Unable to load your inventory."));
				});
		}
		if (!open) {
			setTargetId("");
			setOwnInventory([]);
			setTargetInventory([]);
			setTargetDigipogs(0);
			setHasLoadedTarget(false);
			setOffer({});
			setRequest({});
			setReason("");
			setError(null);
		}
	}, [open, userData]);

	function itemQuantityAmount(quantityState: TradeQuantity) {
		let count = 0;
		Object.values(quantityState).map((e) => count += e);
		return count;
	}

	async function loadTargetInventory() {
		const normalizedId = targetId.trim();
		if (!/^\d+$/.test(normalizedId)) {
			setError("Enter a valid user ID.");
			return;
		}
		if (String(userData?.id) === normalizedId) {
			setError("You cannot create an exchange with yourself.");
			return;
		}

		setIsLoadingTarget(true);
		setError(null);
		try {
			const [inventoryResponse, userResponse] = await Promise.all([
				getUserInventory(normalizedId),
				getUser(normalizedId),
			]);
			if (inventoryResponse.error) throw new Error(
				getErrorMessage(inventoryResponse.error, "Unable to load that user's inventory."),
			);
			if (userResponse.error) throw new Error(
				getErrorMessage(userResponse.error, "Unable to load that user's details."),
			);
			setTargetInventory(inventoryResponse.data ?? []);
			setTargetUserData(userResponse.data);
			setTargetDigipogs(Number(userResponse.data?.digipogs ?? 0));
			setHasLoadedTarget(true);
			setOffer({});
			setRequest({});
		} catch (loadError) {
			Log({ message: "Error loading exchange target inventory", data: loadError, level: "error" });
			setTargetInventory([]);
			setTargetDigipogs(0);
			setHasLoadedTarget(false);
			setError(getErrorMessage(loadError, "Unable to load that user's inventory."));
		} finally {
			setIsLoadingTarget(false);
		}
	}

	function updateQuantity(
		setter: Dispatch<SetStateAction<TradeQuantity>>,
		itemId: number,
		quantity: number,
	) {
		setter((current) => ({ ...current, [itemId]: quantity }));
	}

	async function submitExchange() {
		if (!userData || !hasLoadedTarget) {
			setError("Load a user before creating an exchange.");
			return;
		}
		const hasOffer = Object.values(offer).some((quantity) => quantity > 0);
		const hasRequest = Object.values(request).some((quantity) => quantity > 0);
		if (!hasOffer || !hasRequest) {
			setError("Select at least one item to offer and one item to request.");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			const response = await createExchange({
				from: {
					id: userData.id,
					type: "user",
					offer: Object.fromEntries(
						Object.entries(offer).filter(([, quantity]) => quantity > 0),
					),
					pin: pin || '',
				},
				to: {
					id: Number(targetId),
					type: "user",
					request: Object.fromEntries(
						Object.entries(request).filter(([, quantity]) => quantity > 0),
					),
				},
				reason: reason.trim(),
			});
			if (response.error) throw new Error(
				getErrorMessage(response.error, "Unable to create the exchange."),
			);
			onCreated?.();
			onCancel();
		} catch (submitError) {
			Log({ message: "Error creating exchange", data: submitError, level: "error" });
			setError(getErrorMessage(submitError, "Unable to create the exchange."));
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Modal
			open={open}
			title="Create exchange"
			onCancel={onCancel}
			onOk={() => void submitExchange()}
			footer={(_, { CancelBtn }) => (
				<>
					<CancelBtn />
					
					<Popconfirm
						title="Enter your PIN"
						description={(
							<Input.Password
								autoFocus
								value={pin}
								onChange={(event) => setPin(event.target.value)}
								placeholder="PIN"
							/>
						)}
						showCancel={false}
						okText="Continue"
						onConfirm={() => {
							setPin("");
							submitExchange()
						}}
					>
						<Button type="primary" disabled={!(itemQuantityAmount(offer) > 0 || itemQuantityAmount(request) > 0)}>Create Exchange</Button>
					</Popconfirm>
				</>
			)}
			okText="Create exchange"
			confirmLoading={isSubmitting}
			width={900}
			destroyOnHidden
		>
			<Flex vertical gap={16}>
				<Flex gap={8}>
					<Input
						placeholder="User ID to exchange with"
						value={targetId}
						onChange={(event) => {
							setTargetId(event.target.value);
							setHasLoadedTarget(false);
							setTargetInventory([]);
							setTargetDigipogs(0);
						}}
						onPressEnter={() => void loadTargetInventory()}
						aria-label="Exchange target user ID"
					/>
					<Button
						type="primary"
						onClick={() => void loadTargetInventory()}
						loading={isLoadingTarget}
					>
						Load inventory
					</Button>
				</Flex>
				{error && <Alert type="error" showIcon message={error} />}
				{isLoadingTarget ? (
					<Flex justify="center" style={{ padding: 32 }}>
						<Spin size="large" />
					</Flex>
				) : (
					<Flex
						gap={16}
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							alignItems: "flex-start",
						}}
					>
						<TradeInventory
							title="Your Inventory"
							inventory={ownInventory}
							digipogs={userData?.digipogs ?? 0}
							type={'offer'}
							quantities={offer}
							onQuantityChange={(itemId, quantity) =>
								updateQuantity(setOffer, itemId, quantity)
							}
						/>
						<TradeInventory
							title={`${targetUserData?.displayName || "User"}'s Inventory`}
							inventory={targetInventory}
							digipogs={targetDigipogs}
							type={'request'}
							quantities={request}
							onQuantityChange={(itemId, quantity) =>
								updateQuantity(setRequest, itemId, quantity)
							}
						/>
					</Flex>
				)}
				<Input
					placeholder="Reason (optional)"
					value={reason}
					onChange={(event) => setReason(event.target.value)}
					maxLength={255}
				/> 
				{
					itemQuantityAmount(request) === 0 && (
						<Tag color={"orange"} style={{ width: 'fit-content' }}>This exchange will auto-complete as you have not requested any items.</Tag>
					)
				}
			</Flex>
		</Modal>
	);
}
