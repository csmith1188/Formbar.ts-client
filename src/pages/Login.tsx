import { Button, Card, Flex, Input, Segmented, Typography } from "antd";
import FormbarHeader from "../components/FormbarHeader"
import { useState } from "react";
const { Title } = Typography;

import { useMobileDetect } from '../main';
import { url } from "../socket";

export default function LoginPage() {
    const [mode, setMode] = useState('Login');
    const isMobileView = useMobileDetect();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    function handleSubmit() {
        // Handle form submission based on mode
        if (mode === 'Login') {
            console.log('Logging in with:', { email, password });
            
            const formData = new URLSearchParams();
            formData.append('email', email);
            formData.append('password', password);
            formData.append('loginType', 'login');

            fetch(`${url}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
                redirect: 'manual'
            })
            .then(response => {
                if(response.status === 0) {
                    console.log('Login successful, redirecting...');
                } else {
                    console.error('Login failed with status:', response.status);
                }
            })
            .catch(error => {
                console.error('Error during login:', error);
                // Handle login error (e.g., show error message)
            });

        } else if (mode === 'Sign Up') {
            console.log('Signing up with:', { username, email, password, confirmPassword });
            // Add sign-up logic here
        } else if (mode === 'Guest') {
            console.log('Continuing as guest with username:', { username });
            // Add guest logic here
        }
    }

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
                                <Input placeholder="Username" style={{ marginBottom: '10px' }} value={username} onChange={e => setUsername(e.target.value)} />
                            )
                        }
                        
                        {
                            mode !== 'Guest' && (
                                <>
                                    <Input placeholder="Email" style={{ marginBottom: '10px' }} value={email} onChange={e => setEmail(e.target.value)} />
                                    <Input.Password placeholder="Password" style={{ marginBottom: '10px' }} value={password} onChange={e => setPassword(e.target.value)} />
                                </>
                            )
                        }

                        {
                            mode === 'Sign Up' && (
                                <Input.Password placeholder="Confirm Password" style={{ marginBottom: '10px' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            )
                        }

                        <Button type="primary" style={{ marginTop: '10px', width: '100%' }} onClick={handleSubmit}>
                            {mode === "Guest" ? "Continue as Guest" : mode}
                        </Button>
                    </Card>
                </Flex>

            </Flex>
        </>
    );
}