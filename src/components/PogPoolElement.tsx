import {
	Card,
	Tooltip,
	Flex,
	Row,
	Col,
	Statistic,
	Modal,
	Typography,
	InputNumber,
	Segmented,
	Input,
} from "antd";
import { updatePoolPIN, payoutPool, deletePool } from "@api/pogPoolsApi";
const { Text } = Typography;
import { IonIcon } from "@ionic/react";
import Log from "@utils/debugLogger";
import { useState } from "react";
import * as IonIcons from "ionicons/icons";
import type { PogPool } from "@/types";
import { currentUserHasScope } from "@/utils/scopeUtils";
import { useUserData } from "@/main";
import { useGlobalMessage } from "@/components/providers/GlobalMessageProvider";
import { messageTemplates } from "@utils/messageTemplates";

export default function PogPoolElement({
	pool,
	refreshPools,
}: {
	pool: PogPool;
	refreshPools: () => void;
}) {
	const { userData } = useUserData();
	const globalMessageAPI = useGlobalMessage();
	const [modal, contextHolder] = Modal.useModal();

	const [payoutModalOpen, setPayoutModalOpen] = useState<boolean>(false);
	const [changePinModalOpen, setChangePinModalOpen] =
		useState<boolean>(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [percentOrSet, setPercentOrSet] = useState<"Percent" | "Digipogs">(
		"Percent",
	);
	const [payoutPercent, setPayoutPercent] = useState<number>(100);
	const [payoutDigipogs, setPayoutDigipogs] = useState<number>(pool.amount);

	const [oldPinInput, setOldPinInput] = useState<string>("");
	const [newPinInput, setNewPinInput] = useState<string>("");

	const [payoutPinInput, setPayoutPinInput] = useState<string>("");

	const handlePayout = (poolId: number) => {
		if (!/^\d{4,6}$/.test(payoutPinInput)) {
			globalMessageAPI.error(messageTemplates.pin_invalid_error);
			return;
		}

		Log({ message: `Payout initiated for pool ${poolId}` });
		setActionLoading(true);

		payoutPool(
			poolId,
			percentOrSet === "Percent" ? payoutPercent : payoutDigipogs,
			percentOrSet,
			payoutPinInput,
		)
			.then((response) => {
				if (response?.success === false || response?.error) {
					globalMessageAPI.error(
						messageTemplates.user_pool_payout_failed,
					);
					return;
				}
				Log({ message: `Payout successful for pool ${poolId}` });
				globalMessageAPI.success(messageTemplates.pool_payout_success);
				setPayoutModalOpen(false);
				setPayoutPinInput("");
				refreshPools();
			})
			.catch((error) => {
			Log({
				message: `Error paying out pool ${poolId}`,
				data: error,
				level: "error",
			});
			globalMessageAPI.error(messageTemplates.user_pool_payout_failed);
			})
			.finally(() => setActionLoading(false));
	};

	const handleChangePin = () => {
		if (
			!/^\d{4,6}$/.test(newPinInput)
		) {
			globalMessageAPI.error(messageTemplates.pin_invalid_error);
			return;
		}
		if (oldPinInput === newPinInput) {
			globalMessageAPI.error(messageTemplates.pin_confirmation_mismatch_error);
			return;
		}

		setActionLoading(true);
		updatePoolPIN(pool.id, oldPinInput, newPinInput)
			.then((response) => {
			if (response?.success === false || response?.error) {
				globalMessageAPI.error(messageTemplates.pin_update_failed);
				return;
			}
			globalMessageAPI.success(messageTemplates.pin_updated_success);
			setChangePinModalOpen(false);
			setOldPinInput("");
			setNewPinInput("");
			})
			.catch((error) => {
			Log({
				message: `Error changing PIN for pool ${pool.id}`,
				data: error,
				level: "error",
			});
			globalMessageAPI.error(messageTemplates.pin_update_failed);
			})
			.finally(() => setActionLoading(false));
	};

	const handleDelete = (poolId: number) => {
		Log({ message: `Delete pool ${poolId}` });

		modal.warning({
			title: "Confirm Pool Deletion",
			content:
				"Are you sure you want to delete this pool? This action cannot be undone.",
			okText: "Delete",
			okType: "danger",
			cancelText: "Cancel",
			okCancel: true,
			onOk: () => {
				deletePool(poolId)
					.then((response) => {
						if (response?.success === false || response?.error) {
							globalMessageAPI.error(
								messageTemplates.pool_delete_failed,
							);
							return;
						}
						Log({ message: `Pool ${poolId} deleted` });
						globalMessageAPI.success(
							messageTemplates.pool_deleted_success,
						);
						refreshPools();
					})
					.catch((error) =>
						Log({
							message: `Error deleting pool ${poolId}`,
							data: error,
							level: "error",
						}),
					);
			},
		});
	};

	const isOwner = pool.topShareholders.some((e) => { return e.id === userData?.id })

	const canManagePools = currentUserHasScope(userData, "global.pools.manage");

	return (
		<>
			{contextHolder}
			<Modal
				open={payoutModalOpen}
				onCancel={() => setPayoutModalOpen(false)}
				closable={false}
				title="Payout Pool"
				okType="primary"
				okText="Payout"
				onOk={() => handlePayout(pool.id)}
				confirmLoading={actionLoading}
				cancelText="Cancel"
			>
				<Input.Password
					placeholder="Pool PIN"
					maxLength={6}
					value={payoutPinInput}
					onChange={(event) =>
						setPayoutPinInput(event.target.value.replace(/\D/g, ""))
					}
				/>

				<Text type="secondary" style={{ fontSize: 14 }}>
					You can payout a set amount of digipogs, or a percentage of
					the full amount.
				</Text>
				<Flex
					align="center"
					justify="space-between"
					gap={10}
					style={{ marginTop: 20 }}
				>
					<Segmented
						options={["Percent", "Digipogs"]}
						onChange={setPercentOrSet}
					/>
					{percentOrSet === "Digipogs" ? (
						<>
							<InputNumber
								suffix="digipogs"
								style={{ width: 200 }}
								max={pool.amount}
								min={0}
								value={payoutDigipogs}
								onChange={(e) => setPayoutDigipogs(e || 0)}
							/>
						</>
					) : (
						<>
							<InputNumber
								suffix="%"
								style={{ width: 200 }}
								max={100}
								min={0}
								value={payoutPercent}
								onChange={(e) => setPayoutPercent(e || 0)}
							/>
						</>
					)}
				</Flex>
			</Modal>

			<Modal
				open={changePinModalOpen}
				onCancel={() => {
					if (!actionLoading) setChangePinModalOpen(false);
				}}
				title="Change Pool PIN"
				okText="Change PIN"
				onOk={handleChangePin}
				confirmLoading={actionLoading}
			>
				<Flex vertical gap={12}>
					<Input.Password
						placeholder="Current PIN"
						maxLength={6}
						value={oldPinInput}
						onChange={(event) =>
							setOldPinInput(event.target.value.replace(/\D/g, ""))
						}
					/>
					<Input.Password
						placeholder="New PIN"
						maxLength={6}
						value={newPinInput}
						onChange={(event) =>
							setNewPinInput(event.target.value.replace(/\D/g, ""))
						}
					/>
				</Flex>
			</Modal>

			<Card
				title={pool.name}
				styles={{
					title: {
						textAlign: "center",
					},
					body: {
						textAlign: "center",
						height: isOwner ? undefined : "calc(100% - 64px)",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						flex: "1 1 0",
					},
					root: {
						height: "100%",
						display: "flex",
						flexDirection: "column",
					},
				}}
				actions={
					isOwner && canManagePools
						? [
								<Tooltip
									mouseEnterDelay={0.5}
									title="Payout Funds"
									key="payout"
									placement="top"
									color="green"
								>
									<IonIcon
										icon={IonIcons.cashOutline}
										style={{ fontSize: "32px" }}
										onClick={() => setPayoutModalOpen(true)}
										key="payout"
									/>
								</Tooltip>,
								<span>
									<Tooltip
										mouseEnterDelay={0.5}
										title="Change Pool PIN"
										key="changePin"
										placement="top"
										color="red"
									>
										<IonIcon
											icon={IonIcons.keyOutline}
											style={{ fontSize: "32px" }}
											onClick={() => setChangePinModalOpen(true)}
											key="changePin"
										/>
									</Tooltip>
								</span>,
								<Tooltip
									mouseEnterDelay={0.5}
									title="Delete Pool"
									key="delete"
									placement="top"
									color="red"
								>
									<IonIcon
										icon={IonIcons.trashOutline}
										style={{ fontSize: "32px" }}
										onClick={() => handleDelete(pool.id)}
										key="delete"
									/>
								</Tooltip>,
							]
						: []
				}
			>
				<p>{pool.description}</p>

				<Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
					<Col span={12}>
						<Statistic
							title="Top Shareholder"
							value={pool.topShareholders.map((e) => e.displayName).join(', ')}
							styles={{
								content: {
									textAlign: "center",
									display: "flex",
									justifyContent: "center",
								},
							}}
						/>
					</Col>
					<Col span={12}>
						<Statistic
							title="Balance"
							value={pool.amount}
							styles={{
								content: {
									textAlign: "center",
									display: "flex",
									justifyContent: "center",
								},
							}}
						/>
					</Col>
				</Row>
			</Card>
		</>
	);
}
