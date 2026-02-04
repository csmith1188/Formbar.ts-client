import { Button, Card, Flex, Input, Select, Typography } from "antd";
const { Title, Text } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import { useUserData } from "../main";
import type { CardStylesType } from "antd/es/card/Card";
import { useMobileDetect } from "../main";
import { accessToken, formbarUrl, socket } from "../socket";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ClassesPage() {
    const navigate = useNavigate();
    const { userData } = useUserData();
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
            console.log('Classes data:', data);
            setJoinedClasses(data.joinedClasses);
        })
        .catch(err => {
            console.error('Error fetching classes data:', err);
        });


        fetch(`${formbarUrl}/api/v1/user/${userData?.id}/ownedClasses`, {
            method: 'GET',
            headers: {
                'Authorization': `${accessToken}`,
            }
        })
        .then(res => res.json())
        .then(data => {
            console.log('Owned classes data:', data);
            setOwnedClasses(data);
        })
        .catch(err => {
            console.error('Error fetching classes data:', err);
        });
    }, [userData]);

    function enterClass() {
        if (selectedClass === null) {
            console.error('No class selected');
            return;
        }
        console.log(selectedClass)
        fetch(`${formbarUrl}/api/v1/class/${selectedClass}/join`, {
            method: 'POST',
            headers: {
                'Authorization': `${accessToken}`,
            }
        })
        .then(res => res.json())
        .then(data => {
            console.log('Entered class:', data);
            // Handle successful class entry (e.g., navigate to class page)
            if(data.success) navigate('/student');
        })
        .catch(err => {
            console.error('Error entering class:', err);
        });
    }

    function createClass() {
        if (createClassName.trim() === "") {
            console.error('Class name cannot be empty');
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
            console.log('Created class:', data);
            // Handle successful class creation (e.g., update ownedClasses state)
        })
        .catch(err => {
            console.error('Error creating class:', err);
        });
    }

    function joinClass() {
        if (joinClassCode.trim() === "") {
            console.error('Class code cannot be empty');
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
            console.log('Joined class with code:', data);
            // Handle successful class join (e.g., navigate to class page)
            // if(data.success) navigate('/student');
        })
        .catch(err => {
            console.error('Error joining class with code:', err);
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