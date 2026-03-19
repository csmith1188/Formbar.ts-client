import {
    Flex, Button, Typography, Card, Row, Col, Progress, InputNumber
} from 'antd';
import { useClassData, useMobileDetect } from '../../main';
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { accessToken, formbarUrl } from '../../socket';
import { useState } from 'react';
import Log from '../../debugLogger';

const { Text, Title } = Typography;

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
    const [customMinutes, setCustomMinutes] = useState(1);
    const [customSeconds, setCustomSeconds] = useState(0);

    function getCustomTimerTotalSeconds() {
        const minutes = Math.max(0, Number(customMinutes || 0));
        const seconds = Math.min(59, Math.max(0, Number(customSeconds || 0)));
        return (minutes * 60) + seconds;
    }

    function setCustomFromTotalSeconds(totalSeconds: number) {
        const safeTotal = Math.max(0, Math.floor(totalSeconds));
        setCustomMinutes(Math.floor(safeTotal / 60));
        setCustomSeconds(safeTotal % 60);
    }

    function startTimer(duration: number) {
        if (!classData?.id) {
            Log({ message: "Cannot start timer: no active class.", level: "warn" });
            return;
        }

        fetch(`${formbarUrl}/api/v1/class/${classData.id}/timer/start`, {
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
            Log({ message: "Error starting timer:", data: err, level: "error" });
        });
    }

    const customTotalSeconds = getCustomTimerTotalSeconds();

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
                                    <Button type='primary' variant='solid' onClick={()=> {startTimer(timer.duration)}} color={'green'}>
                                        {
                                            isMobile ? (
                                                <Flex align="center" justify="center" gap={5}>
                                                    <IonIcon icon={IonIcons.play} />
                                                </Flex>
                                            ) : (
                                                "Start"
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
                        <Flex vertical gap={16}>
                            <Flex gap={12} wrap align='end'>
                                <Flex style={{minWidth: isMobile ? '100px' : '140px'}} align='center' gap={10}>
                                    <InputNumber
                                        min={0}
                                        max={120}
                                        step={1}
                                        value={customMinutes}
                                        onChange={(value) => setCustomMinutes(Number(value ?? 0))}
                                        style={{width: '100%'}}
                                        suffix="m"
                                    />
                                    :
                                    <InputNumber
                                        min={0}
                                        max={59}
                                        step={1}
                                        value={customSeconds}
                                        onChange={(value) => setCustomSeconds(Number(value ?? 0))}
                                        style={{width: '100%'}}
                                        suffix="s"

                                    />
                                    <Button disabled type='default'>
                                        {customTotalSeconds}s
                                    </Button>
                                </Flex>
                            </Flex>

                            <Text>Or select a preset:</Text>
                            <Flex gap={8} wrap>
                                <Button onClick={() => setCustomFromTotalSeconds(30)}>30s</Button>
                                <Button onClick={() => setCustomFromTotalSeconds(60)}>1m</Button>
                                <Button onClick={() => setCustomFromTotalSeconds(120)}>2m</Button>
                                <Button onClick={() => setCustomFromTotalSeconds(300)}>5m</Button>
                                <Button onClick={() => setCustomFromTotalSeconds(600)}>10m</Button>
                            </Flex>

                            <Flex gap={10} align="center" justify="center" vertical={isMobile}>
                                <Button
                                    type='primary'
                                    variant='solid'
                                    color='green'
                                    disabled={!classData?.id || customTotalSeconds <= 0}
                                    onClick={() => startTimer(customTotalSeconds)}
                                >
                                    Start Custom Timer
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>
                </Flex>
            </Flex>
        </>
    )
}