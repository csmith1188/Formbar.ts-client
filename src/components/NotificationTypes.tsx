import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { Card, Tooltip, Typography } from "antd";
const { Text } = Typography;
import type { ReactNode } from "react";
import type { NotificationData } from "@/types";

type NotificationObjectProps = {
	notification: NotificationData["notifications"][number]
}

const NotificationTitles: Record<string, string> = {
	"exchange_received": "Exchange Received",
    "exchange_completed": "Exchange Completed",
    "exchange_failed": "Exchange Failed",
    "exchange_canceled": "Exchange Cancelled",
    "exchange_rejected": "Exchange Rejected",
    "trade_received": "Trade Received",
    "trade_completed": "Trade Completed",
    "trade_failed": "Trade Failed",
    "trade_rejected": "Trade Rejected",
    "trade_canceled": "Trade Cancelled",
}

export default function NotificationObject({
	notification
}: NotificationObjectProps) {
	const { actions, children } = getNotificationObjectType({ notification });


	return (
        <Card title={NotificationTitles[notification.type] || notification.type} className="notiCard" styles={{
			header: {
				fontSize: 14,
				minHeight: 0,
				padding: 10
			},
			body: {
				fontSize: 12,
				padding: 10
			},
			actions: {
				padding: 4
			}
		}}
		
		actions={[...(actions || []), 
			<Tooltip placement="bottom" mouseEnterDelay={0.25} title="Mark as Read" style={{width: '100%'}}>
				<IonIcon icon={IonIcons.mailOpen}/>
			</Tooltip>,
		]}

		>
			{ children }
		</Card>
	)
}

function getNotificationObjectType({notification}: NotificationObjectProps): {
	actions: ReactNode[] | null,
	children: ReactNode | null,
} {
	switch (notification.type) {
		case "exchange_received":
			return ExchangeRecieved({ notification });
		default:
			return {
				actions: null,
				children: (
					<Text style={{ fontSize: 14 }}>
						You have a new notification.
					</Text>
				),
			};
	}
}

function ExchangeRecieved({notification}: NotificationObjectProps) {
	const actions: ReactNode[] = [
		<Tooltip placement="bottom" mouseEnterDelay={0.25} title="Accept" style={{width: '100%'}}>
			<IonIcon icon={IonIcons.checkmarkCircle}/>
		</Tooltip>,
		<Tooltip placement="bottom" mouseEnterDelay={0.25} title="Reject" style={{width: '100%'}}>
			<IonIcon icon={IonIcons.closeCircle}/>
		</Tooltip>,
		<Tooltip placement="bottom" mouseEnterDelay={0.25} title="View Exchange" style={{width: '100%'}}>
			<IonIcon icon={IonIcons.eye}/>
		</Tooltip>
	]

	const children: ReactNode = (
		<>
			<Text style={{fontSize: 14}}>
				You received an exchange from user {JSON.parse(notification.data).fromUserId}.
			</Text>
		</>
	)
	

	return { actions, children }
}