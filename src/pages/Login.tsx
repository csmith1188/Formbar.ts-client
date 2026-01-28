import { Button, Card, Flex, Input, Segmented, Typography } from "antd";
import FormbarHeader from "../components/FormbarHeader"
import { useState } from "react";
const { Title } = Typography;
import { useEffect } from "react";
import { socket, socketLogin } from '../socket';

import { useMobileDetect, useUserData } from '../main';
import { formbarUrl } from "../socket";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();
    const { userData } = useUserData();

    const [mode, setMode] = useState('Login');
    const isMobileView = useMobileDetect();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    async function handleSubmit() {
        // Handle form submission based on mode
        switch (mode) {
            case 'Login':
                console.log('Logging in with:', { email, password });
                
                const formData = new URLSearchParams();
                formData.append('email', email);
                formData.append('password', password);
                formData.append('loginType', 'login');

                const loginResponse = await fetch(`${formbarUrl}/api/v1/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (!loginResponse.ok) {
                    throw new Error('Login failed');
                }
                const loginData = await loginResponse.json();
                let { accessToken, refreshToken } = loginData;
                console.log('Login successful:', loginData);

                // 2. Make authenticated requests
                const data = await fetch(`${formbarUrl}/api/v1/user/me`, {
                    headers: { 'Authorization': accessToken }
                })
                .then(res => res.json())
                .then(data => {
                    console.log('User data:', data);

                    socketLogin(refreshToken);

                    return data;
                })
                .catch(err => {
                    console.error('Error fetching user data:', err);
                });
                break;
            case 'Sign Up':
                console.log('Signing up with:', { username, email, password, confirmPassword });
                // Add sign-up logic here
                break;

            case 'Guest':
                console.log('Continuing as guest with username:', { username });
                // Add guest logic here
                break;
        }
    }

    //? Check if user is already logged in and redirect to home page, preventing access to login page if so
    useEffect(() => {
        if(socket?.connected && userData) {
            navigate('/');
        }
    }, []);

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
                            
                            <>
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
                            </>
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