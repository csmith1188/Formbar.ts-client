import {
    Flex, Button, Typography, Card, Row, Col, Progress
} from 'antd';
import { useClassData, useMobileDetect } from '../../main';
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { accessToken, formbarUrl, socket } from '../../socket';
import { useEffect } from 'react';

const { Title, Text } = Typography;

const defaultTimers = [
    {
        name: "Timer 1",
        duration: 30,
        isRunning: false,
    },
    {
        name: "Timer 2",
        duration: 60,
        isRunning: false,
    },
    {
        name: "Timer 3",
        duration: 90,
        isRunning: false,
    }
]

export default function TimerPage() {
    const isMobile = useMobileDetect();
    const {classData} = useClassData();

    function getActiveTimerDuration() {
        if(!classData?.timer) {
            return 0;
        }
        if(new Date().getTime() < classData?.timer?.startTime || new Date().getTime() > classData?.timer?.endTime) {
            return 0;
        }
        return Math.max(0, (classData?.timer?.endTime - classData?.timer?.startTime) / 1000);
    }

    function startTimer(duration: number) {

        fetch(`${formbarUrl}/api/v1/class/${classData?.id}/timer/start`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ duration: duration * 1000, sound: false })
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to start timer");
            }
        })
        .catch((err) => {
            console.error(err);
        });
    }

    function stopTimer() {
        fetch(`${formbarUrl}/api/v1/class/${classData?.id}/timer/clear`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to clear timer");
            }
        })
        .catch((err) => {
            console.error(err);
        });
    }

    // Create a 5x2 grid using defaultTimers
    const grid = [];
    for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
        for (let colIdx = 0; colIdx < 2; colIdx++) {
            const timerIdx = rowIdx * 2 + colIdx;
            const timer = defaultTimers[timerIdx];
            grid.push(
                <Col span={8} key={`col-${rowIdx}-${colIdx}`}>
                    {
                        timer && (
                            <Card>
                                <Flex justify='center' align='center' vertical gap={10}>
                                    {
                                        !isMobile && (
                                            <Title level={3} style={{margin:0}}>{timer.name}</Title>
                                        )
                                    }
                                    <Progress 
                                        type="dashboard"
                                        percent={100}
                                        size={isMobile ? 50 : 70}
                                        format={() => timer.duration.toString() + "s"}
                                        strokeColor={{
                                            '0%': 'rgb(94, 158, 230)',
                                            '100%': 'rgba(41, 96, 167, 0.9)',
                                        }}
                                        styles={{
                                            indicator: {
                                                color: 'white',
                                            }
                                        }}
                                        strokeLinecap='round'
                                    />
                                    <Button type='primary' variant='solid' onClick={()=> {timer.duration === getActiveTimerDuration() ? stopTimer() : startTimer(timer.duration)}} color={
                                        timer.duration === getActiveTimerDuration() ? "red" : 'green'
                                    }>
                                        {
                                            isMobile ? (
                                                <Flex align="center" justify="center" gap={5}>
                                                    <IonIcon icon={timer.duration === getActiveTimerDuration() ? IonIcons.stop : IonIcons.play } />
                                                </Flex>
                                            ) : (
                                                timer.duration === getActiveTimerDuration() ? "Stop" : "Start"
                                            )
                                        }
                                    </Button>
                                    <Button type='primary' variant='solid' color={"red"} disabled>
                                        {
                                            isMobile ? (
                                                <Flex align="center" justify="center" gap={5}>
                                                    <IonIcon icon={IonIcons.trash} />
                                                </Flex>
                                            ) : (
                                                "Clear"
                                            )
                                        }
                                    </Button>
                                </Flex>
                            </Card>
                        )
                    }
                </Col>
            );
        }
    }
    return (
        <>
            <Title style={{ marginBottom: "10px" }} level={isMobile ? 3 : 1}>Timers</Title>
            <Flex gap={20} vertical={isMobile}>
                <Row gutter={isMobile ? [8, 0] : [16, 16]} style={{width: '100%', marginInline: isMobile ? 0 : 'auto'}}>
                    {grid}
                </Row>
                <Flex gap={20} style={{width: '100%'}}>
                    <Card title="Custom Timer" style={{width: '100%'}}>

                    </Card>
                </Flex>
            </Flex>
        </>
    )
}