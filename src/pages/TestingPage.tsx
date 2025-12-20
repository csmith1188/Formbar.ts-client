import FormbarHeader from "../components/FormbarHeader";
import { Typography, Row, Col, Tooltip, Button, Flex } from "antd";
const { Title } = Typography;
import { useState } from "react";
import * as IonIcons from "ionicons/icons";

import AccordionCollapse from "../components/AccordionCollapse";
import FullCircularPoll from "../components/CircularPoll";
import PollButton from "../components/PollButton";
import StudentObject from "../components/StudentObject";
import type { UserData } from "../types";
import Log from "../debugLogger";

export default function TestingPage({ userData }: { userData: UserData | null }) {
	const [enableCategory3, setEnableCategory3] = useState(false);

	Log({ message: "User Data in TestingPage:", data: userData, level: 'debug' });
	

	const components = [
		<Flex vertical gap={10} align="center" justify="center">
		<Button onClick={() => setEnableCategory3(!enableCategory3)}>Toggle Category 3</Button>
		<AccordionCollapse 
			categories={
				[
					{
						icon: IonIcons.helpCircleOutline,
						content: (<p>This is category 1.</p>),
						enabled: true
					},
					{
						icon: IonIcons.informationCircleOutline,
						content: (<p>This is category 2.</p>),
						enabled: true
					},
					{
						icon: IonIcons.settingsOutline,
						content: (<p>This is category 3.</p>),
						enabled: enableCategory3
					}
				]
			}
		/></Flex>,

		<FullCircularPoll pollAnswers={[
			{
				responses: 202,
				color: "#FF0000",
				answer: "sdf",
				weight: 0
			},
			{
				responses: 223,
				color: "#00FF00",
				answer: "sdf",
				weight: 0
			},
			{
				responses: 225,
				color: "#0000FF",
				answer: "sdf",
				weight: 0
			},
			{
				responses: 252,
				color: "#FFFF00",
				answer: "ss",
				weight: 0
			},
		]} size={150} />,

		<PollButton answerData={{
			answer: 'PollButton',
			color: '#0099ffff',
		}} Respond={() => {}} />,

		<StudentObject student={{
			id: 1,
			displayName: 'John Doe',
			help: true,
			break: false,
			isGuest: false,
			pollRes: { buttonRes: 'Yes', textRes: 'I agree' },
			tags: ['Offline']
		}} openModalId={null} setOpenModalId={() => {}} />,
	]

	return (
		<>
			<FormbarHeader />

			<Title style={{margin: '10px'}}>
				Components
			</Title>

			<Row gutter={[16, 16]} style={{ margin: '20px' }}>
				{Array.from({ length: 30 }).map((_, index) => (
					<Col key={index} xs={24} sm={12} md={8} lg={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
						<Tooltip title={components[index]?.type.name} color='purple'>
							<div style={{
								height: '200px',
								width: '100%',
								borderRadius: '8px',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								fontSize: '18px',
								fontWeight: 'bold',
								border: '1px solid #ddd',
								backgroundColor: '#fff2',
							}}>
								{components[index]}
							</div>
						</Tooltip>
					</Col>
				))}
			</Row>
		</>
	);
}