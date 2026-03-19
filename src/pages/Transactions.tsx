import FormbarHeader from "../components/FormbarHeader";
import { Flex, Pagination, Spin, Typography } from "antd";
import Log from "../debugLogger";
const { Title, Text } = Typography;

import TransactionItem from "../components/TransactionItem";
import type { Transaction } from "../types";
import { useMobileDetect, useUserData } from "../main";
import { useEffect, useState } from "react";
import { accessToken, formbarUrl } from "../socket";
import { useParams } from "react-router-dom";

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
    const isMobile = useMobileDetect();

	useEffect(() => {
		// Fetch transactions from API when userData is available
		if (!userData) return;

		const offset = (currentPage - 1) * pageSize;
		const targetUserId = id ? id : String(userData.id);
		const abortController = new AbortController();

		fetch(
			`${formbarUrl}/api/v1/user/${targetUserId}/transactions?limit=${pageSize}&offset=${offset}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				signal: abortController.signal,
			},
		)
			.then((res) => res.json())
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

				<Flex
					vertical
					gap={10}
					style={{
						width: isMobile ? "100%" : "80%",
						height: "100%",
						margin: isMobile ? "0" : "0px auto",
						marginBottom: "64px",
						padding: "0 20px",
						paddingBottom: "20px",
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
								userId={id ? Number(id) : userData?.id}
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

					{totalTransactions > 0 && (
						<Flex justify="center" style={{ marginTop: "12px" }}>
							<Pagination
								current={currentPage}
								pageSize={pageSize}
								total={totalTransactions}
								showSizeChanger
								pageSizeOptions={[10, 20, 50, 100]}
								onChange={(page, size) => {
									setIsLoading(true);
									setCurrentPage(page);
									setPageSize(size);
								}}
							/>
						</Flex>
					)}
				</Flex>
			</Flex>
		</>
	);
}
