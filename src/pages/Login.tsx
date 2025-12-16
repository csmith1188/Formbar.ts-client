import { Button, Card, Flex, Input, Segmented, Typography } from "antd";
import FormbarHeader from "../components/FormbarHeader"
import { useState } from "react";
const { Title } = Typography;

import { useMobileDetect } from '../main';

export default function LoginPage() {
    const [mode, setMode] = useState('Login');
    const isMobileView = useMobileDetect();

    return (
        <>
            <FormbarHeader />
            <Flex vertical justify="center" align="center" style={{ height: '100%', margin:'auto' }}>
                <Flex
                    vertical
                    align="center"
                    justify="center"
                    style={{
                        width: (isMobileView ? 'calc(100% - 40px)' : '600px'),
                    }}
                    gap={20}
                >
                    {
                        isMobileView ? (
                            <Title style={{fontWeight:400, fontSize: '8vw'}}>
                                Welcome to&nbsp;
                                <span style={{fontWeight:700}}>
                                    <span className="bounce">F</span>
                                    <span className="bounce">o</span>
                                    <span className="bounce">r</span>
                                    <span className="bounce">m</span>
                                    <span className="bounce">b</span>
                                    <span className="bounce">a</span>
                                    <span className="bounce">r</span>
                                </span>
                            </Title>
                        ) : (
                            <Title style={{fontWeight:400}}>
                                Welcome to&nbsp;
                                <span style={{fontWeight:700}}>
                                    <span className="bounce">F</span>
                                    <span className="bounce">o</span>
                                    <span className="bounce">r</span>
                                    <span className="bounce">m</span>
                                    <span className="bounce">b</span>
                                    <span className="bounce">a</span>
                                    <span className="bounce">r</span>
                                </span>
                            </Title>
                        )
                    }
                    
                    <Segmented options={
                            [
                                'Login',
                                'Sign Up',
                                'Guest'
                            ]
                        } 
                        onChange={setMode}
                        value={mode} 
                    />

                    <Card title={mode}>
                        {
                            (mode === 'Guest' || mode === 'Sign Up') && (
                                <Input placeholder="Username" style={{ marginBottom: '10px' }} />
                            )
                        }
                        
                        {
                            mode !== 'Guest' && (
                                <>
                                    <Input placeholder="Email" style={{ marginBottom: '10px' }} />
                                    <Input.Password placeholder="Password" style={{ marginBottom: '10px' }} />
                                </>
                            )
                        }

                        {
                            mode === 'Sign Up' && (
                                <Input.Password placeholder="Confirm Password" style={{ marginBottom: '10px' }} />
                            )
                        }

                        <Button type="primary" style={{ marginTop: '10px', width: '100%' }}>
                            {mode === "Guest" ? "Continue as Guest" : mode}
                        </Button>
                    </Card>
                </Flex>

            </Flex>
        </>
    );
}