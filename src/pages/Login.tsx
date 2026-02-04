import { Button, Card, Flex, Input, Segmented, Typography, notification } from "antd";
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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Login and Sign Up modes only
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Guest and Sign Up modes only
    const [displayName, setDisplayName] = useState('');

    // Sign Up mode only
    const [confirmPassword, setConfirmPassword] = useState('');

    const [api, contextHolder] = notification.useNotification();

    const showErrorNotification = (message: string) => {
        api['error']({
            title: 'Error',
            description: message,
            placement: 'bottom',
        })
    };

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
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
                    const errorData = await loginResponse.json();
                    showErrorNotification(errorData.error.message || 'Login failed');
                    throw new Error('Login failed');
                }
                const loginData = await loginResponse.json();
                let { accessToken, refreshToken } = loginData;
                console.log('Login successful:', loginData);

                // 2. Make authenticated requests
                await fetch(`${formbarUrl}/api/v1/user/me`, {
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
                console.log('Signing up with:', { displayName, email, password, confirmPassword });

                if(displayName.length < 4) return console.error('displayName must be at least 4 characters long');
                if(!emailRegex.test(email)) return console.error('Invalid email format');
                if(password !== confirmPassword) return console.error('Passwords do not match');


                const signupResponse = await fetch(`${formbarUrl}/api/v1/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, displayName })
                });
                if (!signupResponse.ok) {
                    const errorData = await signupResponse.json();
                    showErrorNotification(errorData.error.message || 'Signup failed');
                    throw new Error('Signup failed', errorData.error.message);
                }
                const signUpData = await signupResponse.json();
                console.log('Signup successful:', signUpData);

                await fetch(`${formbarUrl}/api/v1/user/me`, {
                    headers: { 'Authorization': signUpData.accessToken }
                })
                .then(res => res.json())
                .then(data => {
                    console.log('User data:', data);

                    socketLogin(signUpData.refreshToken);

                    return data;
                })
                .catch(err => {
                    console.error('Error fetching user data:', err);
                });
                break;

            case 'Guest':
                console.log('Continuing as guest with displayName:', { displayName });
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
            {contextHolder}
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
                                // 'Guest'
                            ]
                        } 
                        onChange={setMode}
                        value={mode} 
                    />

                    <Card title={mode}>
                        <form onSubmit={handleSubmit}>
                            {
                                
                                <>
                                    {
                                        (mode === 'Guest' || mode === 'Sign Up') && (
                                            <Input placeholder="Display Name" style={{ marginBottom: '10px', color: 
                                                displayName.length > 3 ? 'white' : 'red'
                                            }} value={displayName} onChange={e => setDisplayName(e.target.value)} />
                                        )
                                    }
                                    
                                    {
                                        mode !== 'Guest' && (
                                            <>
                                                <Input placeholder="Email" style={{ marginBottom: '10px', color: 
                                                    emailRegex.test(email) || email.length === 0 ? 'white' : 'red'
                                                }} value={email} onChange={e => setEmail(e.target.value)} />
                                                <Input.Password placeholder="Password" style={{ marginBottom: '10px', color: 
                                                password.length >= 5 ? 'white' : 'red' }} value={password} onChange={e => setPassword(e.target.value)} />
                                            </>
                                        )
                                    }

                                    {
                                        mode === 'Sign Up' && (
                                            <Input.Password placeholder="Confirm Password" style={{ marginBottom: '10px' }} value={confirmPassword} styles={{
                                                root: {
                                                    color: password == confirmPassword && confirmPassword.length >= 5 ? 'white' : 'red'
                                                }
                                            }} onChange={
                                                (e) => { 
                                                    setConfirmPassword(e.target.value);
                                                    
                                                }
                                            } />
                                        )
                                    }
                                </>
                            }

                            <Button htmlType="submit" type="primary" style={{ marginTop: '10px', width: '100%' }} disabled={
                                mode === 'Login' ? !(email && password && emailRegex.test(email) && password.length >= 5) :
                                mode === 'Sign Up' ? !(displayName && email && emailRegex.test(email) && password && confirmPassword && password === confirmPassword && displayName.length > 3 && password.length >= 5 && confirmPassword.length >= 5) :
                                mode === 'Guest' ? !(displayName && displayName.length > 3) :
                                true
                            }>
                                {mode === "Guest" ? "Continue as Guest" : mode}
                            </Button>
                        </form>
                    </Card>
                </Flex>

            </Flex>
        </>
    );
}