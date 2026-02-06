import { Button, Card, Flex, Input, Select, Typography } from "antd";
const { Title, Text } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import Log from "../debugLogger";
import { useUserData } from "../main";
import type { CardStylesType } from "antd/es/card/Card";
import { useMobileDetect } from "../main";
import { accessToken, formbarUrl, socket } from "../socket";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ClassesPage() {
    const navigate = useNavigate();
    const { userData, setUserData } = useUserData();
    const isMobileView = useMobileDetect();

    const [joinClassCode, setJoinClassCode] = useState<string>("");

    const [joinedClasses, setJoinedClasses] = useState<Array<{ id: number; name: string }>>([]);
    const [ownedClasses, setOwnedClasses] = useState<Array<{ id: number; name: string }>>([]);

    const [selectedClass, setSelectedClass] = useState<number | null>(null);

    const [createClassName, setCreateClassName] = useState<string>("");

    let cardStyle = { width: '350px', height: '230px' };
    if (isMobileView) {
        cardStyle = { width: '300px', height: '200px' };
    }

    useEffect(() => {
        if(!userData) return;

        fetch(`${formbarUrl}/api/v1/selectClass`, {
            method: 'GET',
            headers: {
                'Authorization': `${accessToken}`,
            }
        })
        .then(res => res.json())
        .then(data => {
            Log({ message: 'Classes data', data });
            setJoinedClasses(data.joinedClasses);
        })
        .catch(err => {
            Log({ message: 'Error fetching classes data', data: err, level: 'error' });
        });


        fetch(`${formbarUrl}/api/v1/user/${userData?.id}/ownedClasses`, {
            method: 'GET',
            headers: {
                'Authorization': `${accessToken}`,
            }
        })
        .then(res => res.json())
        .then(data => {
            Log({ message: 'Owned classes data', data });
            setOwnedClasses(data);
        })
        .catch(err => {
            Log({ message: 'Error fetching owned classes data', data: err, level: 'error' });
        });
    }, [userData]);

    function enterClass() {
        if (selectedClass === null) {
            Log({ message: 'No class selected', level: 'error' });
            return;
        }
        Log({ message: 'Selected class', data: { selectedClass } });
        fetch(`${formbarUrl}/api/v1/class/${selectedClass}/join`, {
            method: 'POST',
            headers: {
                'Authorization': `${accessToken}`,
            }
        })
        .then(res => res.json())
        .then(data => {
            Log({ message: 'Entered class', data });
            // Handle successful class entry (e.g., navigate to class page)
            if(data.success) {
                fetch(`${formbarUrl}/api/v1/user/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `${accessToken}`,
                    }
                })
                .then(res => res.json())
                .then(data => {
                    Log({ message: 'User data fetched successfully after joining class.', data, level: 'info' });
                    // Update user data in context or state
                    // For example, if you have a setUserData function from context:
                    setUserData(data);
                    if(data.classPermissions >= 4) navigate('/panel')
                    else navigate('/student');
                })
                .catch(err => {
                    Log({ message: 'Error fetching user data after joining class:', data: err, level: 'error' });
                });
            }
        })
        .catch(err => {
            Log({ message: 'Error entering class', data: err, level: 'error' });
        });
    }

    function createClass() {
        if (createClassName.trim() === "") {
            Log({ message: 'Class name cannot be empty', level: 'error' });
            return;
        }
        fetch(`${formbarUrl}/api/v1/class/create`, {
            method: 'POST',
            headers: {
                'Authorization': `${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: createClassName }),
        })
        .then(res => res.json())
        .then(data => {
            Log({ message: 'Created class', data });
            // Handle successful class creation (e.g., update ownedClasses state)
        })
        .catch(err => {
            Log({ message: 'Error creating class', data: err, level: 'error' });
        });
    }

    function joinClass() {
        if (joinClassCode.trim() === "") {
            Log({ message: 'Class code cannot be empty', level: 'error' });
            return;
        }
        fetch(`${formbarUrl}/api/v1/room/${joinClassCode}/join`, {
            method: 'POST',
            headers: {
                'Authorization': `${accessToken}`,
                'Content-Type': 'application/json',
            },
        })
        .then(res => res.json())
        .then(data => {
            Log({ message: 'Joined class with code', data });
            // Handle successful class join (e.g., navigate to class page)
            if(data.success) {
                
                    
            }
        })
        .catch(err => {
            Log({ message: 'Error joining class with code', data: err, level: 'error' });
        });
    }

    return (
        <>
            <FormbarHeader />

            <Flex vertical align="center" justify="center" style={{ padding: '20px', height: '100%', width: '100%' }} gap={!isMobileView ? 50 : 30}>
                <div style={{position: 'static', textAlign:'center', }}>
                    <Title>{!isMobileView ? "Manage " : ""}Your Classes</Title>
                    <Text>Enter{userData?.permissions && userData.permissions >= 4 ? ", create," : ""} or join a class quickly</Text>
                </div>
                <Flex align="center" justify="center" gap={20} style={{width:'100%'}} wrap="wrap">
                    <Card title="Enter a Class" style={cardStyle} styles={cardStyles} loading={!(userData)}>
                        <Flex vertical gap={20} align="center" justify="center" style={{height:'100%'}}>
                            <Select style={{width:'100%', padding:'6px'}} placeholder="Select a class to enter" value={selectedClass} onChange={(value) => setSelectedClass(value)}>
                                
                                    {
                                        ownedClasses.length > 0 && (
                                            <Select.OptGroup label="Owned Classes">
                                                {
                                                    ownedClasses.length > 0 && ownedClasses.map((cls) => (
                                                        <Select.Option key={cls.id} value={cls.id}>{cls.name}</Select.Option>
                                                    ))
                                                }
                                            </Select.OptGroup>
                                        )
                                    }

                                    {
                                        joinedClasses.length > 0 && (
                                            <Select.OptGroup label="Joined Classes">
                                                {
                                                    joinedClasses.length > 0 && joinedClasses.map((cls) => (
                                                        <Select.Option key={cls.id} value={cls.id}>{cls.name}</Select.Option>
                                                    ))
                                                }

                                            </Select.OptGroup>
                                        )
                                    }
                            </Select>
                            <Flex align="center" justify="center" gap={10} wrap="wrap" style={{ width:'100%'}}>
                                <Button type="primary" onClick={() => enterClass()}>Enter{isMobileView ? "" : " Class"}</Button>
                                <Button type='default' color="danger" variant="solid">Delete{isMobileView ? "" : " Class"}</Button>
                            </Flex>
                        </Flex>
                    </Card>
                    <Card title="Create a Class" style={cardStyle} styles={cardStyles} loading={!(userData && userData.permissions && userData.permissions >= 4)} hidden={!(userData && userData.permissions && userData.permissions >= 4)}>
                        <Flex vertical gap={20} align="center" justify="center" style={{height:'100%'}}>
                            <Input style={{width:'100%'}} placeholder="Class Name" value={createClassName} onChange={(e) => setCreateClassName(e.target.value)} />
                            <Button type="primary" style={{ width:'100%'}} onClick={() => createClass()}>Create{isMobileView ? "" : " Class"}</Button>
                        </Flex>
                    </Card>
                    <Card title="Join a Class" style={cardStyle} styles={cardStyles} loading={!(userData)}>
                        <Flex vertical gap={20} align="center" justify="center" style={{height:'100%'}}>
                            <Input style={{width:'100%'}} placeholder="Class Code" value={joinClassCode} onChange={(e) => setJoinClassCode(e.target.value)} />
                            <Button type="primary" style={{ width:'100%'}} onClick={joinClass}>Join{isMobileView ? "" : " Class"}</Button>
                        </Flex>
                    </Card>
                </Flex>
            </Flex>
        </>
    )
}

const cardStyles = {
    title: {
        width:'100%',
        textAlign:"center"
    },
    body: {
        height:'calc(100% - 64px)',
    }
} as CardStylesType;