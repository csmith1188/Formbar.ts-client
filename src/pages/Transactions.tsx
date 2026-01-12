import FormbarHeader from "../components/FormbarHeader";
import { Flex, Typography } from "antd";
const { Title } = Typography;

import TransactionItem from "../components/TransactionItem";
import type { Transaction } from "../types";

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
    return (
        <>
            <Flex vertical style={{height:'100vh'}}>
                <FormbarHeader />

                <Title style={{textAlign:'center', margin:'20px'}}>Transactions</Title>

                <Flex vertical gap={10} style={{width:'80%', height:'100%', margin:'0px auto',  marginBottom:'64px', padding:'0 20px', paddingBottom: '20px', overflowY:'auto'}}>
                {
                    testTransactions.map((transaction, index) => (
                        <TransactionItem key={index} transaction={transaction} />
                    ))
                }
                </Flex>
                
            </Flex>
        </>
    );
}