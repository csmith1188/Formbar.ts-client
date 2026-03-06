import { type Transaction } from "../types";
import { Flex, Typography, Statistic } from "antd";
const { Text } = Typography;

import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";

export default function TransactionItem({
	transaction,
	userId,
}: {
	transaction: Transaction;
	userId: number | undefined;
}) {
	const isOutgoing = isOutgoingTransaction(transaction, userId);
	const direction = determineTransactionType(transaction);

	return (
		<Flex
			gap={10}
			style={{
				width: "100%",
				backgroundColor: "#1b1b1b3b",
				padding: "10px 20px",
				borderRadius: 10,
			}}
			justify="space-between"
			align="center"
		>
			<Flex vertical gap={5}>
				<Text
					style={{
						display: "flex",
						justifyContent: "start",
						alignItems: "center",
						gap: "10px",
					}}
				>
					{direction.from}{" "}
					<IonIcon icon={IonIcons.arrowForward} />{" "}
					{direction.to}
				</Text>

				<Text>{transaction.reason}</Text>
				<Text type="secondary" style={{ fontSize: "16px" }}>
					{formatDate(transaction.date)}
				</Text>
			</Flex>
			<Statistic
				title="Amount"
				value={transaction.amount}
				styles={{
					title: {
						fontSize: "16px",
						color: "#888888",
						textAlign: "right",
					},
					content: {
						fontSize: "24px",
						fontWeight: "bolder",
						color: isOutgoing ? "#e93241ff" : "#9be65aff",
					},
				}}
				prefix={
					<Text
						style={{
							fontSize: "24px",
							fontWeight: "bolder",
							color: isOutgoing ? "#e93241ff" : "#9be65aff",
						}}
					>
						{isOutgoing ? "-" : "+"}
					</Text>
				}
				suffix=""
			/>
		</Flex>
	);
}

function isOutgoingTransaction(transaction: Transaction, userId: number | undefined): boolean {
	if (typeof userId !== "number") return false;

	if (transaction.from && (transaction.from.type === "user" || transaction.from.type === "award")) {
		return Number(transaction.from.id) === userId;
	}

	return transaction.from_user === userId;
}

function determineTransactionType(transaction: Transaction): {
	to: string;
	from: string;
} {
	if (transaction.from && transaction.to) {
		return {
			from: formatParty(transaction.from),
			to: formatParty(transaction.to),
		};
	}

	if (transaction.from_user === null && transaction.pool != null) {
		return {
			to: `User ${transaction.to_user}`,
			from: `Pool ${transaction.pool}`,
		};
	}

	if (transaction.to_user === null && transaction.pool != null) {
		return {
			to: `Pool ${transaction.pool}`,
			from: `User ${transaction.from_user}`,
		};
	}

	if (transaction.from_user != null && transaction.to_user != null) {
		return {
			to: `User ${transaction.to_user}`,
			from: `User ${transaction.from_user}`,
		};
	}

	return { to: "N/A", from: "N/A" };
}

function formatParty(party: NonNullable<Transaction["from"]>): string {
	if (party.username) return party.username;

	if (party.type === "pool") return `Pool ${party.id}`;
	if (party.type === "class") return `Class ${party.id}`;
	if (party.type === "award") return `Award ${party.id}`;
	return `User ${party.id}`;
}

function formatDate(dateString: string | number): string {
	const daysOfWeek = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const monthsOfYear = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	const date = new Date(Number(dateString));

	return `${daysOfWeek[date.getDay()]}, ${monthsOfYear[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
