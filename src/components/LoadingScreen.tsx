import { Flex, Typography, Spin } from 'antd';
const { Title, Text } = Typography;
import { LoadingOutlined } from '@ant-design/icons';
import { IonIcon } from '@ionic/react';
import * as IonIcons from "ionicons/icons";

export default function LoadingScreen({ attempt, isConnected }: { attempt: number, isConnected: boolean }) {

    return (
        <>
            <Flex style={isConnected ? hideLoadingStyle : showLoadingStyle} justify="center" align="center" vertical gap={20}>
                <Title style={{color: '#fff9', fontSize: '120px', fontWeight: 700, marginBottom: '0'}}>
                    <span className="bounce">F</span>
                    <span className="bounce">o</span>
                    <span className="bounce">r</span>
                    <span className="bounce">m</span>
                    <span className="bounce">b</span>
                    <span className="bounce">a</span>
                    <span className="bounce">r</span>
                </Title>
                {
                    isConnected ? (
                        <IonIcon icon={IonIcons.checkmark} style={{ height: '48px', fontSize: '48px', color: '#fff' }} />
                    ) : attempt < 5 ? (
                        <Spin size="large" indicator={<LoadingOutlined />} styles={
                            {
                                indicator: {
                                    color: '#fff'
                                }
                            }
                        }/>
                    ) : (
                        <IonIcon icon={IonIcons.close} style={{ height: '48px', fontSize: '48px', color: '#fff' }} />
                    )
                }

                <Text style={{color: '#fff7', fontSize: '20px', fontWeight: 500, marginTop: '0'}}>
                    {
                        !isConnected ? randomText() : (
                            'Loading panel...'
                        )
                    }
                </Text>

                {
                    isConnected ? null : (
                        <Text style={{color: '#fff5', fontSize: '12px', fontWeight: 400, marginTop: '0'}}>
                            {attempt === 0 ? 'Connecting to server...' : attempt < 5 ? `Re-attempting connection (Attempt ${attempt})` : 'Connection failed. Is the server running?'}
                        </Text>
                    )
                }
            </Flex>
        </>
    );
}

function randomText() {
    const texts = [
        "Printing Digipogs...",
        "Building Classrooms...",
        "Forming the Bar...",
        "While you wait, why not watch \"Hundreds of Beavers\"?",
        "Filling Pog Meters...",
        "Releasing Half-Life 3..."
    ];

    return texts[Math.floor(Math.random() * texts.length)];
}

const hideLoadingStyle = {
    width:'100vw',
    height: '100vh',
    position: 'absolute',
    top: 0,
    left: 0, 
    background: 'linear-gradient(rgba(95, 122, 158, 1) 0%, rgba(28, 68, 124, 1) 100%)',
    zIndex: 9000,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.5s ease-out'
} as React.CSSProperties;


const showLoadingStyle = {
    width:'100vw',
    height: '100vh',
    position: 'absolute',
    top: 0,
    left: 0, 
    background: 'linear-gradient(rgba(95, 122, 158, 1) 0%, rgba(28, 68, 124, 1) 100%)',
    zIndex: 9000
} as React.CSSProperties;