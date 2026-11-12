import FormbarHeader from "@components/FormbarHeader";
import { Flex, Spin, Typography } from "antd";
import Log from "@utils/debugLogger";
const { Title, Text } = Typography;

import TransactionItem from "@components/TransactionItem";
import type { Transaction } from "@/types";
import { useMobileDetect, useUserData } from "@/main";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserTransactions } from "@api/userApi";
import ProfileViewingCard from "@/components/ProfileViewingCard";
import CustomPagination from "@/components/CustomPagination";

const DEFAULT_PAGE_SIZE = 20;

export default function Transactions() {
	const { userData } = useUserData();
	const { id } = useParams<{ id?: string }>();

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [totalTransactions, setTotalTransactions] = useState(0);
	const [targetId, setTargetId] = useState<string>("");
	const isMobile = useMobileDetect();

	useEffect(() => {
		// Fetch transactions from API when userData is available
		if (!userData) return;

		const offset = (currentPage - 1) * pageSize;
		const targetUserId = id ? id : String(userData.id);
		setTargetId(targetUserId);
		const abortController = new AbortController();

		getUserTransactions(targetUserId, pageSize, offset)
			.then((response) => {
				const { data } = response;
				Log({ message: "Transactions data", data });
				if (response.error) {
					Log({
						message: "Error fetching transactions",
						data: response.error,
						level: "error",
					});
					setTransactions([]);
					setError(
						typeof response.error === "string"
							? response.error
							: response.error.message || "Unknown error",
					);
					return;
				}

				const transactionRows = Array.isArray(data?.transactions)
					? data.transactions
					: [];
				const total =
					typeof data?.pagination?.total === "number"
						? data.pagination.total
						: transactionRows.length;

				setTransactions(transactionRows);
				setTotalTransactions(total);
				setError(null);
			})
			.catch((err) => {
				if (err?.name === "AbortError") {
					return;
				}

				Log({
					message: "Error fetching transactions data",
					data: err,
					level: "error",
				});
				setError("Failed to fetch transactions.");
			})
			.finally(() => {
				setIsLoading(false);
			});

		return () => abortController.abort();
	}, [userData, id, currentPage, pageSize]);

	return (
		<>
			<Flex vertical style={{ height: "100vh" }}>
				<FormbarHeader />

				<Title style={{ textAlign: "center", margin: "20px" }}>
					Transactions
				</Title>

				<ProfileViewingCard userId={targetId} />

				<Flex
					vertical
					gap={10}
					style={{
						width: isMobile ? "100%" : "80%",
						height: "100%",
						margin: isMobile ? "0" : "0px auto",
						marginBottom: "64px",
						padding: "0 20px",
						paddingBottom: "48px",
						overflowY: "auto",
					}}
				>
					{isLoading ? (
						<Flex justify="center" style={{ marginTop: "20px" }}>
							<Spin />
						</Flex>
					) : (
						transactions &&
						transactions.map((transaction, index) => (
							<TransactionItem
								key={index}
								transaction={transaction}
								userId={id ? Number(id) : Number(userData?.id)}
							/>
						))
					)}

					{!isLoading &&
						transactions &&
						!error &&
						transactions.length === 0 && (
							<Text
								style={{
									textAlign: "center",
									marginTop: "20px",
									color: "#888",
								}}
							>
								No transactions found.
							</Text>
						)}

					{error && (
						<Text
							style={{
								textAlign: "center",
								marginTop: "20px",
								color: "red",
							}}
						>
							Error: {error}
						</Text>
					)}
				</Flex>

				{totalTransactions > 0 && (
					<Flex
						justify="center"
						style={{
							width: "100%",
							margin: 0,
							position: "absolute",
							bottom: 8,
						}}
					>
						<CustomPagination
							currentPage={currentPage}
							pageSize={pageSize}
							total={totalTransactions}
							
							onChange={(page, size) => {
								setIsLoading(true);
								setCurrentPage(page);
								setPageSize(size);
							}}
						/>
					</Flex>
				)}
			</Flex>
		</>
	);
}
