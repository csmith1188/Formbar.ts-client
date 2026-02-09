import { Card, Col, Row, Statistic, Tooltip, Typography } from "antd";
const { Text, Title } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import Log from "../debugLogger";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useUserData } from "../main";
import { useEffect } from "react";
import { accessToken, formbarUrl } from "../socket";

const testPools = [
    {
        id: 0,
        name: 'Community Fund',
        owner: 1,
        members: [1, 2, 3],
        description: 'General community pool for shared initiatives.',
        amount: 5000,
    },
    {
        id: 1,
        name: 'Marketing Pool',
        owner: 2,
        members: [2, 4, 5, 6],
        description: 'Pool dedicated to marketing and promotion efforts.',
        amount: 3500,
    },
    {
        id: 2,
        name: 'Development Rewards',
        owner: 3,
        members: [1, 3, 7, 8, 9],
        description: 'Rewards pool for development contributions.',
        amount: 8750,
    },
    {
        id: 2,
        name: 'Development Rewards',
        owner: 3,
        members: [1, 3, 7, 8, 9],
        description: 'Rewards pool for development contributions.',
        amount: 8750,
    },
    {
        id: 2,
        name: 'Development Rewards',
        owner: 3,
        members: [1, 3, 7, 8, 9],
        description: 'Rewards pool for development contributions.',
        amount: 8750,
    }
]

export default function PogPools() {

    const { userData } = useUserData();

    useEffect(() => {
        if(!userData) return;

        fetch(`${formbarUrl}/api/v1/user/pools`, {
            headers: {
                'Authorization': accessToken,
                'Content-Type': 'application/json',
            },
            method: 'GET',
        })
        .then(res => res.json())
        .then(response => {
            const { data } = response;
            Log({ message: 'Fetched pools', data });
        })
        .catch(err => {
            Log({ message: 'Error fetching pools', data: err, level: 'error' });
        })
    }, [userData]);

    return (
        <>
            <FormbarHeader />

            <Title style={{textAlign:'center', marginTop:'20px'}}>Pog Pools</Title>

            <Row gutter={[16, 16]} style={{ margin: '20px' }}>
                {
                    testPools.map((pool) => (
                        <Col span={8} key={pool.id}>
                            <Card 
                                title={pool.name}

                                styles={
                                    {
                                        title: {
                                            textAlign: 'center',
                                        },
                                        body: {
                                            textAlign: 'center',
                                            height: pool.owner === userData?.id ? undefined : 'calc(100% - 64px)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                        },
                                        root: {
                                            height: '100%',
                                        }
                                    }
                                }

                                actions={pool.owner === userData?.id ? [
                                    <Tooltip title="Payout Funds" key="payout" placement="top">
                                        <IonIcon icon={IonIcons.cashOutline} style={{ fontSize: '32px' }} key="payout" />
                                    </Tooltip>,
                                    <Tooltip title="Add or Remove Members" key="addmember" placement="top">
                                        <IonIcon icon={IonIcons.personOutline} style={{ fontSize: '32px' }} key="addmember" />
                                    </Tooltip>,
                                    <Tooltip title="Delete Pool" key="delete" placement="top" color="red">
                                        <IonIcon icon={IonIcons.trashOutline} style={{ fontSize: '32px' }} key="delete" />
                                    </Tooltip>
                                ] : []}
                                
                                

                                >
                                <p>{pool.description}</p>

                                <Row gutter={[16, 16]} style={{marginTop:'20px'}}>
                                    <Col span={12}>
                                        <Statistic title="Owner" value={pool.owner == userData?.id ? "You" : `${pool.owner}`} styles={{content:{textAlign:'center',display:'flex',justifyContent:'center'}}} />
                                    </Col>
                                    <Col span={12}>
                                        <Statistic title="Balance" value={20} styles={{content:{textAlign:'center',display:'flex',justifyContent:'center'}}} />
                                    </Col>
                                </Row>
                                <Tooltip title={`User ${pool.members.join(', User ')}`} placement="top" style={{width:'100%', marginTop:'10px', textAlign:'center'}} color='blue'>
                                    <Text type='secondary'>Members: {pool.members.length}</Text>
                                </Tooltip>
                            </Card>
                        </Col>
                    ))
                }
            </Row>
        </>
    )
}