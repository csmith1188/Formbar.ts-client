import FormbarHeader from "../components/FormbarHeader";
import { Flex, Typography } from "antd";
import Log from "../debugLogger";
const { Title, Text } = Typography;

import TransactionItem from "../components/TransactionItem";
import type { Transaction } from "../types";
import { useUserData } from "../main";
import { useEffect, useState } from "react";
import { accessToken, formbarUrl } from "../socket";
import { useParams } from "react-router-dom";

const testTransactions: Transaction[] = [
    {from_user: 1, to_user: 2, amount: 100, date: '2024-01-15', reason: 'completed', pool: null},
    {from_user: 3, to_user: 1, amount: 50, date: '2024-01-16', reason: 'completed', pool: null},
    {from_user: 1, to_user: 4, amount: 75, date: '2024-01-17', reason: 'pending', pool: null},
    {from_user: 5, to_user: 1, amount: 200, date: '2024-01-18', reason: 'completed', pool: null},
    {from_user: 1, to_user: 6, amount: 125, date: '2024-01-19', reason: 'completed', pool: null},
    {from_user: 7, to_user: 1, amount: 300, date: '2024-01-20', reason: 'pending', pool: null},
    {from_user: 1, to_user: 8, amount: 85, date: '2024-01-21', reason: 'completed', pool: null},
    {from_user: 9, to_user: 1, amount: 150, date: '2024-01-22', reason: 'completed', pool: null},
    {from_user: 1, to_user: 10, amount: 220, date: '2024-01-23', reason: 'failed', pool: null},
    {from_user: 11, to_user: 1, amount: 95, date: '2024-01-24', reason: 'completed', pool: null}
]
    

export default function Transactions() {
    const { userData } = useUserData();
    const { id } = useParams<{ id?: string }>();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch transactions from API when userData is available
        if(!userData) return;

        fetch(`${formbarUrl}/api/v1/profile/transactions/${id ? id : userData?.id}`, {

            method: 'GET',
            headers: {
                'Authorization': `${accessToken}`,
            }
        })
        .then(res => res.json())
        .then(data => {
            Log({ message: 'Transactions data', data });
            if(data.error) {
                Log({ message: 'Error fetching transactions', data: data.error, level: 'error' });
                setTransactions([]);
                setError(typeof data.error === 'string' ? data.error : data.error.message || 'Unknown error');
                return;
            }

            setTransactions(data.transactions);
            setError(null);
        })
        .catch(err => {
            Log({ message: 'Error fetching transactions data', data: err, level: 'error' });
        });

    }, [userData]);

    return (
        <>
            <Flex vertical style={{height:'100vh'}}>
                <FormbarHeader />

                <Title style={{textAlign:'center', margin:'20px'}}>Transactions</Title>

                <Flex vertical gap={10} style={{width:'80%', height:'100%', margin:'0px auto',  marginBottom:'64px', padding:'0 20px', paddingBottom: '20px', overflowY:'auto'}}>
                {
                    transactions && transactions.map((transaction, index) => (
                        <TransactionItem key={index} transaction={transaction} userId={id ? Number(id) : userData?.id} />
                    ))
                }

                {
                    transactions && !error && transactions.length === 0 && (
                        <Text style={{textAlign:'center', marginTop:'20px', color:'#888'}}>No transactions found.</Text>
                    )
                }

                {
                    error && (
                        <Text style={{textAlign:'center', marginTop:'20px', color:'red'}}>Error: {error}</Text>
                    )
                }
                </Flex>
                
            </Flex>
        </>
    );
}