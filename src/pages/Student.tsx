import { accessToken, formbarUrl, socket } from "../socket";

import FormbarHeader from "../components/FormbarHeader";
import FullCircularPoll from "../components/CircularPoll";
import { useEffect, useState, useRef } from "react";
import { useMobileDetect, useUserData } from "../main";
import { Typography, Flex, Input } from "antd";
import PollButton from "../components/PollButton";
import Log from "../debugLogger";
import StudentMenu from "../components/StudentMenu";
import { useNavigate } from "react-router-dom";
const { Title, Text } = Typography;

export default function Student() {
    const navigate = useNavigate();
    const { userData: initialUserData } = useUserData();
    const [userData, setUserData] = useState<any>(null);
    const [classData, setClassData] = useState<any>(null);
    const [answerState, setAnswerState] = useState<any>([]);
    const isMobileView = useMobileDetect();
    const [lastPollData, setLastPollData] = useState<any>(null);

    const [textResponse, setTextResponse] = useState<string>("");
    const lastPollDataRef = useRef<any>(null);

    const [pollWidth, setPollWidth] = useState<number>(!isMobileView ? Math.min(window.innerWidth / 2 - 20, window.innerHeight - 200) : Math.min(window.innerWidth - 40, window.innerHeight / 2 - 100));

    function Respond(response: string) {
        if (!socket || !socket.connected) {
            Log({ message: 'Socket not connected, cannot send response', level: 'warn' });
            return;
        }
        let resTextResponse = classData?.poll.allowTextResponses ? textResponse.trim() : '';
        socket.emit('pollResp', response, resTextResponse);
        Log({ message: `Responded with: ${response}`, level: 'info' });
        socket.emit('classUpdate', ''); // Request updated class data after responding
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
        if(!initialUserData) return;

        // if(initialUserData.activeClass === null) navigate('/classes');

    }, [initialUserData]);

    useEffect(() => {
        if (!socket) return; // Don't set up listener if socket isn't ready

        function classUpdate(classData: any) {
            Log({ message: 'Poll data', data: classData.poll });
            Log({ message: 'Last poll data ref', data: lastPollDataRef.current });
            if(classData.poll.startTime !== lastPollDataRef.current?.startTime) {
                setTextResponse("");
            }

            setClassData(classData);
            lastPollDataRef.current = classData.poll;
            setLastPollData(classData.poll);
            Log({ message: "Class Update received.", data: classData, level: 'info' });

            fetch(`${formbarUrl}/api/v1/user/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `${accessToken}`,
                }
            })
            .then(res => res.json())
            .then(data => {
                Log({ message: 'User data fetched successfully.', data, level: 'info' });
                setUserData(data);
            })
            .catch(err => {
                Log({ message: 'Error fetching user data:', data: err, level: 'error' });
            })

            setAnswerState(classData.poll.responses);
        }

        socket.on('classUpdate', classUpdate);
        
        socket.emit('classUpdate', ''); // Initial request for class data
        return () => {
            socket.off('classUpdate', classUpdate);
        };
    }, [socket, setClassData]);

    return (
        <>
            <FormbarHeader />

            <Title style={{position:'absolute',transform:'translate(-50%)',left:'50%',top:'90px',width:'100%', textAlign:'center'}}>{classData?.poll.prompt}</Title>

            {
            userData?.break !== true ? (
                <>
                    <Flex 
                        style={!isMobileView ? {width:'100%', height:'100%'} : {width:'100%', height:'100%'}}
                        justify={classData?.poll.status ? "space-around" : "center"}
                        align="center"
                        vertical={isMobileView || !classData?.poll.status}
                        >

                        {
                            (classData?.poll.responses.length > 0) ? (
                                <Flex justify="center" align="center" vertical style={isMobileView ? {width:'100%', height:'50%', paddingTop:'120px', paddingBottom: '120px'} : {width:'50%', paddingTop:'120px', paddingBottom: '120px'}}>
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
                                    {
                                        classData?.poll.allowTextResponses ? (
                                            <Input.TextArea style={{width:'50%', resize:'none', height:'200px',textAlign:'center'}} value={textResponse} onChange={e => setTextResponse(e.target.value)}></Input.TextArea>
                                        ) : null
                                    }
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
                            ) : (
                                <Title>There is no current poll.</Title>
                            )
                        }

                        {
                            !classData?.isActive ? (
                                <Title>Class is not active.</Title>
                            ) : null
                        }                
                        
                    </Flex>

                    <StudentMenu />
                </>
            ) : (
                <Flex 
                justify="center" 
                align="center"
                style={{width:'100%', height:'80vh', flexDirection:'column', textAlign:'center'}}
                >
                    <Title>You are currently on a break.</Title>
                    <Text>Please wait until your break is over to participate in polls.</Text>
                </Flex>
            )
        }

            
        </>
    );
}