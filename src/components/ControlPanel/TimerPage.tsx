import {
    Flex, Button, Tooltip, Typography, Card, Row, Col, Progress
} from 'antd';

const { Text, Title } = Typography;

const defaultTimers = [
    {
        name: "Timer 1",
        duration: 60,
        isRunning: false,
    },
    {
        name: "Timer 2",
        duration: 120,
        isRunning: false,
    },
    {
        name: "Timer 3",
        duration: 180,
        isRunning: false,
    }
]

export default function TimerPage() {
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
                                    <Title level={5} style={{margin:0}}>{timer.name}</Title>
                                    <Progress 
                                        type="dashboard"
                                        percent={100}
                                        size={70}
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
                                    <Button style={{cursor:'not-allowed', opacity: 0.5}} type='primary'>Start Timer</Button>
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
            <Flex gap={20}>
                <Row gutter={[16, 16]} style={{width: '100%'}}>
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