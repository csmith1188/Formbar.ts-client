import { useNotiData } from "@/main"
import NotificationObject from "./NotificationTypes";
import { Flex } from "antd";

export default function NotificationUI() {
	const { notiData } = useNotiData();
	
	return (
		<Flex vertical style={{
			width: 300,
			height: 400,
			paddingRight: 8,
			overflowY: 'scroll'
		}} gap={8}>
			{
				notiData?.notifications.map((e) => {
					return <NotificationObject key={e.id} notification={e} />;
				})
			}
		</Flex>
	)
}