import { socket } from "../socket";

import FormbarHeader from "../components/FormbarHeader";
import FullCircularPoll from "../components/CircularPoll";
import { useEffect, useState } from "react";
import { useMobileDetect } from "../main";
import { Typography, Flex } from "antd";
import PollButton from "../components/PollButton";
import Log from "../debugLogger";
const { Title } = Typography;

export default function Student() {
    const [classData, setClassData] = useState<any>(null);
    const [answerState, setAnswerState] = useState<any>([]);
    const isMobileView = useMobileDetect();

    const [pollWidth, setPollWidth] = useState<number>(!isMobileView ? Math.min(window.innerWidth / 2 - 20, window.innerHeight - 200) : Math.min(window.innerWidth - 40, window.innerHeight / 2 - 100));

    function Respond(response: string) {
        socket.emit('pollResp', response, '');
        Log({ message: `Responded with: ${response}`, level: 'info' });
    }

    useEffect(() => {
        function handleResize() {
            if(!isMobileView) {
                setPollWidth(Math.min(window.innerWidth / 2 - 20, window.innerHeight - 200));
            } else {
                setPollWidth(Math.min(window.innerWidth - 40, window.innerHeight / 2 - 100));
            }
        }    
    
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [isMobileView])

    useEffect(() => {

		function classUpdate(classData: any) {
			setClassData(classData);
            Log({ message: "Class Update received.", data: classData, level: 'info' });

            let answers = [];

            for (let answer of classData.poll.responses) {
                let percentage = (answer.responses / classData.poll.totalResponders) * 100;
                answers.push({percentage: percentage, color: answer.color});
            }

            setAnswerState(answers);
		}

        socket.on('classUpdate', classUpdate);
        
        socket.emit('classUpdate', '');
        return () => {
            socket.off('classUpdate', classUpdate);
        };
    }, []);

    return (
        <>
            <FormbarHeader />

            <Title style={{position:'absolute',transform:'translate(-50%)',left:'50%',top:'90px',width:'100%', textAlign:'center'}}>{classData?.poll.prompt}</Title>

            <Flex 
                style={!isMobileView ? {width:'100%', height:'100%'} : {width:'100%', height:'calc(100% - 120px)', marginTop:'120px'}}
                justify="space-around"
                align="center"
                vertical={isMobileView}
                >

                {
                    (classData?.poll.responses.length > 0) ? (
                        <Flex justify="center" align="center" vertical style={isMobileView ? {width:'100%', height:'50%'} : {width:'50%'}}>
                            <FullCircularPoll pollAnswers={answerState} size={pollWidth} />
                        </Flex>
                    ) : null
                }
                

                {
                    classData?.poll.status ? (
                        <Flex 
                            justify="center" 
                            align="center" 
                            vertical
                            style={isMobileView ? {width:'100%', height:'50%'} : {width:'50%', padding:'0 20px'}}
                            gap={10}
                        >
                            <Flex 
                                gap={10}
                                style={{width:'100%'}}
                                justify="center"
                                align="center"
                            >
                                {
                                    classData?.poll.responses.map((resp: any, index: number) => (
                                        <PollButton key={index} answerData={{
                                            answer: resp.answer,
                                            color: resp.color
                                        }} Respond={Respond} />
                                    ))
                                }
                            </Flex>
                            { 
                                classData?.poll.allowVoteChanges ? (
                                    <PollButton answerData={{
                                        answer: 'remove',
                                        color: '#ff0000'
                                    }} Respond={Respond} />
                                ) : null
                            }
                        </Flex>
                    ) : null
                }

                
                
            </Flex>

            
        </>
    );
}