import { type Transaction } from "../types"
import { Flex, Typography, Statistic } from "antd"
const { Text } = Typography;

import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useUserData } from "../main";

export default function TransactionItem({ transaction, userId }: { transaction: Transaction, userId: number | undefined }) {
    const { userData } = useUserData();

    return (
        <Flex gap={10} style={{width:'100%', backgroundColor:'#1b1b1b3b', padding:'10px 20px', borderRadius: 10 }} justify="space-between" align="center">
            <Flex vertical gap={5}>
                <Text style={{display:'flex', justifyContent:'start', alignItems:'center', gap:'10px'}}>{determineTransactionType(transaction).from} <IonIcon icon={IonIcons.arrowForward} /> {determineTransactionType(transaction).to}</Text>

                <Text>{transaction.reason}</Text>
                <Text type="secondary" style={{fontSize:'16px'}}>{formatDate(transaction.date)}</Text>
            </Flex>
            <Statistic
                title="Amount"
                value={transaction.amount}
                precision={2}
                styles={{ 
                    title: { fontSize:'16px', color:'#888888', textAlign:'right' },
                    content: { fontSize:'24px', fontWeight:'bolder', color: transaction.from_user === userId ? '#e93241ff' : '#9be65aff' } }}
                prefix={<Text style={{fontSize:'24px', fontWeight:'bolder', color: transaction.from_user === userId ? '#e93241ff' : '#9be65aff'}}>{transaction.from_user === userId ? '-' : '+'}</Text>}
                suffix=""
            />
        </Flex>
    )
}

function determineTransactionType(transaction: Transaction): { to: string, from: string } {
    if (transaction.from_user === null && transaction.pool !== null) {
        // Incoming from pool
        return { to: `User ${transaction.to_user}`, from: `Pool ${transaction.pool}` };
    }
    else if (transaction.to_user === null && transaction.pool !== null) {
        // Outgoing to pool
        return { to: `Pool ${transaction.pool}`, from: `User ${transaction.from_user}` };
    }
    else if (transaction.from_user !== null && transaction.to_user !== null) {
        // User to user
        return { to: `User ${transaction.to_user}`, from: `User ${transaction.from_user}` };
    }
    return { to: "N/A", from: "N/A" };
}

function formatDate(dateString: string): string {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const date = new Date(Number(dateString));
    
    return `${daysOfWeek[date.getDay()]}, ${monthsOfYear[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}