import FormbarHeader from "../components/FormbarHeader";
import CircularPoll from "../components/CircularPoll";
import StudentMenu from "../components/StudentMenu"

import { useState } from "react";

import { Flex, Slider, Switch } from "antd";

const initialPollAnswers = [
	{ percentage: 25, color: '#0f0' },
	{ percentage: 25, color: '#f00' },
	{ percentage: 25, color: '#ff0' },
	{ percentage: 25, color: '#f0f' }
];

export default function TestingPage() {
	const [pollAnswers, setPollAnswers] = useState(initialPollAnswers);

	const handlePercentChange = (value: number, index: number) => {
		const updated = [...pollAnswers];
		const total = updated.reduce((sum, answer) => sum + answer.percentage, 0) - updated[index].percentage;
		
		// Prevent total from exceeding 100%
		if (total + value > 100) {
			updated[index].percentage = 100 - total;
		} else {
			updated[index].percentage = value;
		}
		
		setPollAnswers(updated);
	};

	const totalPercent = pollAnswers.reduce((sum, answer) => sum + answer.percentage, 0);

	return (
		<>
			<FormbarHeader />
			<Flex justify="center" align="center" style={{ height: '100%' }}>
				<CircularPoll pollAnswers={pollAnswers} />
				<Switch checkedChildren="Circle" unCheckedChildren="Bar" defaultChecked/>
			</Flex>
			<Flex vertical justify="center" align="center" style={{
				height: '200px',
				position: 'absolute',
				bottom: 0,
				width: '500px',
				margin: '20px',
				borderRadius: '10px',
				padding: '',
				}}>

				{pollAnswers.map((answer, index) => {
					const otherTotal = totalPercent - answer.percentage;
					const maxValue = 100 - otherTotal;
					
					return (
						<Slider 
							key={index}
							value={answer.percentage}
							max={maxValue}
							style={{ width: '400px' }}
							styles={{
								track: { background: answer.color },
								handle: { borderColor: answer.color },
							}}
							onChange={(value) => handlePercentChange(value, index)}
						/>
					);
				})}
			</Flex>
			<StudentMenu />
		</>
	);
}