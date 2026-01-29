import FormbarHeader from "../components/FormbarHeader";
import { Segmented, Typography, Row, Col, Card, Button, Flex, Select, Tooltip, Input, Spin, Skeleton } from "antd";
import { type UserData } from "../types";
import { LoadingOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;

import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { Activity, useEffect, useState } from "react";
import { accessToken, formbarUrl } from "../socket";

const bannedUsers: UserData[] = [
    { displayName: 'George', email: 'george@example.com', id: 7, permissions: 1, verified: 0 },
    { displayName: 'Hannah', email: 'hannah@example.com', id: 8, permissions: 2, verified: 1 },
    { displayName: 'Ivan', email: 'ivan@example.com', id: 9, permissions: 3, verified: 0 },
    { displayName: 'Julia', email: 'julia@example.com', id: 10, permissions: 2, verified: 1 },
    { displayName: 'Kevin', email: 'kevin@example.com', id: 11, permissions: 1, verified: 0 },
    { displayName: 'Laura', email: 'laura@example.com', id: 12, permissions: 4, verified: 1 },
    { displayName: 'Kevin', email: 'kevin@example.com', id: 11, permissions: 1, verified: 0 },
    { displayName: 'Laura', email: 'laura@example.com', id: 12, permissions: 4, verified: 1 },
]

export default function ManagerPanel() {
    const [listCategory, setListCategory] = useState<"Users" | "IP Addresses" | "Banned Users">("Users");
    const [users, setUsers] = useState<Record<string, UserData>>({});
    const [classrooms, setClassrooms] = useState<any[]>([]);

    useEffect(() => {
        if (!accessToken) return;
        
        fetch(`${formbarUrl}/api/v1/manager/`, {
            method: 'GET',
            headers: {
                'Authorization': `${accessToken}`,
            }
        })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            setUsers(data.users);
            setClassrooms(data.classrooms);
            console.log(data)
        })
        .catch(err => {
            console.error('Error fetching manager panel data:', err);
        });
    }, [accessToken])

    return (
        <>
            <FormbarHeader />

            <Title style={{textAlign:'center', marginTop:'20px', marginBottom:'20px'}}>Manager Panel</Title>

            <Flex justify="center" style={{marginTop:'20px', marginBottom:'20px'}}>
                <Segmented options={
                        [
                            'Users',
                            'IP Addresses',
                            'Banned Users',
                        ]
                    } 
                    onChange={(value) => setListCategory(value as "Users" | "IP Addresses" | "Banned Users")}
                    value={listCategory}
                />
            </Flex>

            <Flex gap={20} style={{position:'absolute', bottom: '20px', left: '20px'}}>
                <Button type="primary">View Logs</Button>
                <Button type="primary">Download Database</Button>
            </Flex>

            <Activity mode={listCategory === "Users" ? "visible" : "hidden"}>
                <Flex gap={10} justify="center" align="center" style={{marginBottom:'20px', height:'40px'}}>
                    <Title level={3} style={{margin: 0}}>Sort by:</Title>
                    <Button variant="solid" style={{padding: '0 20px', height:'100%'}}>Name</Button>
                    <Button variant="solid" style={{padding: '0 20px', height:'100%'}}>Permission</Button>
                    <Input placeholder="Search users..." style={{width:'40%'}} />
                </Flex>


                <Row gutter={[8, 8]} style={{ margin: '10px' }}>
                    {
                        Object.keys(users).length > 0 ? Object.values(users).map((user) => (
                            <Col span={4} key={user.id}>
                                <Card 
                                    title={user.displayName}

                                    styles={
                                        {
                                            title: {
                                                textAlign: 'center',
                                            },
                                            body: {
                                                textAlign: 'center',
                                            },
                                            root: {
                                                height: '100%',
                                            }
                                        }
                                    }
                                    
                                    

                                    >
                                    <Flex vertical style={{marginBottom:'10px'}}>
                                        <Text type='secondary' style={{fontSize:'16px'}}>{user.email}</Text>
                                        <Text type='secondary' style={{fontSize:'16px'}}>ID: {user.id}</Text>
                                    </Flex>
                                    <Select style={{width: '100%'}} defaultValue={user.permissions}>
                                        <Select.Option value={5}>Manager</Select.Option>
                                        <Select.Option value={4}>Teacher</Select.Option>
                                        <Select.Option value={3}>Mod</Select.Option>
                                        <Select.Option value={2}>Student</Select.Option>
                                        <Select.Option value={1}>Guest</Select.Option>
                                    </Select>
                                    <Flex gap={10} justify="space-evenly" style={{marginTop:'10px'}} wrap>
                                        {
                                            user.verified === 0 ? (
                                                <Tooltip title={"Verify User"} color="green">
                                                    <Button variant="solid" color='green' size='large' style={{padding: '0 20px',}}>
                                                        <IonIcon icon={IonIcons.checkmarkCircle} size='large' />
                                                    </Button>
                                                </Tooltip>
                                            ) : null
                                        }
                                        <Tooltip title={"Ban User"} color="red">
                                            <Button variant="solid" color='red' size='large' style={{padding: '0 20px',}}>
                                                <IonIcon icon={IonIcons.ban} size='large' />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={"Delete User"} color="red">
                                            <Button variant="solid" color='red' size='large' style={{padding: '0 20px',}}>
                                                <IonIcon icon={IonIcons.trash} size='large' />
                                            </Button>
                                        </Tooltip>
                                    </Flex>
                                </Card>
                            </Col>
                        )) : (
                            <Flex justify="center" style={{width: '100%'}}>
                                <Skeleton>
                                    
                                </Skeleton>
                            </Flex>
                        )
                    }
                </Row>
            </Activity>
            <Activity mode={listCategory === "IP Addresses" ? "visible" : "hidden"}>
                <div style={{textAlign:'center'}}>IP Addresses Management Coming Soon!</div>
            </Activity>
            <Activity mode={listCategory === "Banned Users" ? "visible" : "hidden"}>
                <Row gutter={[8, 8]} style={{ margin: '10px' }}>
                {
                    bannedUsers.map((user) => (
                        <Col span={3} key={user.id}>
                            <Card 
                                title={user.displayName}

                                styles={
                                    {
                                        title: {
                                            textAlign: 'center',
                                        },
                                        body: {
                                            textAlign: 'center',
                                        },
                                        root: {
                                            height: '100%',
                                        }
                                    }
                                }
                                
                                

                                >
                                <Flex vertical style={{marginBottom:'10px'}}>
                                    <Text type='secondary' style={{fontSize:'16px'}}>{user.email}</Text>
                                </Flex>
                                <Flex gap={10} justify="space-evenly" style={{marginTop:'10px'}} wrap>
                                    <Tooltip title={"Unban User"} color="unban">
                                        <Button variant="solid" color='green' size='large' style={{padding: '0 20px',}}>
                                            <IonIcon icon={IonIcons.checkmarkCircle} size='large' />
                                        </Button>
                                    </Tooltip>
                                </Flex>
                            </Card>
                        </Col>
                    ))
                }
                </Row>
            </Activity>
        </>
    )
}