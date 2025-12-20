import { useEffect, useState } from "react";
import { useClassData } from "../../main";
import { Card, Flex, Statistic, Tooltip, Typography } from "antd";
const { Title } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";

export default function Statistics() {
    const { classData } = useClassData();

    const students = classData && classData.students ? Object.values(classData.students) as any[] : [];
    
    const [ responseTime, setResponseTime ] = useState<number>(0);
    const [ responses, setResponses ] = useState<number>(0);
    const [ studentsOnBreak, setStudentsOnBreak ] = useState<number>(0);
    const [ helpTickets, setHelpTickets ] = useState<number>(0);

    useEffect(() => {
        let totalResponseTimes: number[] = [];
        
        students.forEach((student) => {
            if (student.pollRes && student.pollRes.time) {
                // Convert ISO string to milliseconds
                const studentResponseTimeMs = new Date(student.pollRes.time).getTime();
                
                // Poll start time is already in milliseconds
                const pollStartTimeMs = classData?.poll.startTime;
                
                // Calculate difference in seconds (student time - poll start time)
                const timeDifferenceMs = studentResponseTimeMs - (pollStartTimeMs ?? 0);
                const timeDifferenceSeconds = timeDifferenceMs / 1000;
                
                // Only include if positive and reasonable (less than 1 hour)
                if (timeDifferenceSeconds > 0) {
                    totalResponseTimes.push(timeDifferenceSeconds);
                }
            }
        });
        
        // Calculate average response time
        const averageResponseTime = totalResponseTimes.length > 0 
            ? totalResponseTimes.reduce((a, b) => a + b, 0) / totalResponseTimes.length 
            : 0;
            
        if(classData?.poll.startTime !== undefined) setResponseTime(averageResponseTime);
        else setResponseTime(0);

        setResponses(totalResponseTimes.length);
        setStudentsOnBreak(students.filter((s: any) => s.break).length);
        setHelpTickets(students.filter((s: any) => s.help).length);
    }, [students, classData]);

    return (
        <>
        <Flex
            style={{
            }} vertical  justify='start' align='center' gap={20}>
                <Title style={{ marginBottom: 'auto' }}>Statistics</Title>
                <Flex gap={20} wrap='wrap' justify='center' align='center'>
                    <Flex vertical gap={10} style={categoryStyle} justify="center" align="center">
                        <Title level={3} style={{textAlign:'center'}}>Current Poll</Title>
                        <div style={gridStyle}>
                            <Card variant="borderless">
                                <Statistic.Timer
                                    
                                    type="countup"
                                    title="Poll Runtime"
                                    value={classData?.poll.startTime == undefined ? Date.now() : classData?.poll.startTime}
                                    format="H:mm:ss"
                                />
                            </Card>
                        
                        
                            <Card variant="borderless">
                                <Statistic
                                title="Allowed to Vote"
                                value={students.filter((s: any) => !s.tags.includes('Offline')).length}
                                />
                            </Card>
                        
                        
                            <Tooltip title={"Average Response Time: " + responseTime.toFixed(2) + " seconds"} placement="top">
                                <Card variant="borderless">
                                    <Statistic
                                    title="Response Time"
                                    value={responseTime}
                                    precision={2}
                                    styles={{ content: { color: '#3f8600' } }}
                                    style={{overflow:'hidden', textOverflow:'ellipsis'}}
                                        prefix={<><IonIcon icon={IonIcons.arrowUp} style={{marginTop:'2px'}}/></>}
                                    suffix="s"
                                    />
                                </Card>
                            </Tooltip>
                        
                        
                            <Card variant="borderless">
                                <Statistic
                                title="Responses"
                                value={responses}
                                suffix={`/ ${students.length}`}
                                />
                            </Card>
                            
                        </div>
                    </Flex>
                    
                    <Flex vertical gap={10} style={categoryStyle} justify="center" align="center">
                        <Title level={3} style={{textAlign:'center'}}>Current Poll</Title>
                        <div style={gridStyle}>
                            <Card variant="borderless">
                                <Statistic
                                title="Help Tickets"
                                value={helpTickets}
                                />
                            </Card>
                        
                        
                            <Card variant="borderless">
                                <Statistic
                                title="On Break"
                                value={studentsOnBreak}
                                />
                            </Card>
                            
                            <Card variant="borderless">
                                <Statistic
                                title="N/A"
                                value={"N/A"}
                                />
                            </Card>
                        
                            <Card variant="borderless">
                                <Statistic
                                title="N/A"
                                value={"N/A"}
                                />
                            </Card>
                        </div>
                    </Flex>
                    
                    <Flex vertical gap={10} style={categoryStyle} justify="center" align="center">
                        <Title level={3} style={{textAlign:'center'}}>Other Stats</Title>
                        <div style={gridStyle}>
                            <Card variant="borderless">
                                <Statistic
                                title="N/A"
                                value={"N/A"}
                                />
                            </Card>
                        
                            <Card variant="borderless">
                                <Statistic
                                title="N/A"
                                value={"N/A"}
                                />
                            </Card>
                            
                            <Card variant="borderless">
                                <Statistic
                                title="N/A"
                                value={"N/A"}
                                />
                            </Card>
                        
                            <Card variant="borderless">
                                <Statistic
                                title="N/A"
                                value={"N/A"}
                                />
                            </Card>
                        </div>
                    </Flex>
                    
                </Flex>
            </Flex>
        </>
    );
}

const categoryStyle = {
    width: '450px',
    padding: '20px',
    background: '#106ca4',
    borderRadius: '8px',
    boxShadow: '0px 4px 0px #00000017',
}

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
    width: '100%',
}