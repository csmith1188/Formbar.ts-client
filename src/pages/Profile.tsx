import FormbarHeader from "../components/FormbarHeader";
import { Collapse, Card, Flex, Progress, Tooltip, Modal, InputNumber, Typography, Button } from "antd";
const { Text, Link } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserData, isMobile } from "../main";
import { accessToken, formbarUrl } from "../socket";

const correctPin = 1243;

export default function Profile() {
    const { userData } = useUserData();
    const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
    const [sensModalOpen, setSensModalOpen] = useState(false);
    const [enteredPin, setEnteredPin] = useState<string | number | null>(null);
    const navigate = useNavigate();

    const [profileProps, setProfileProps] = useState<{ [key: string]: string | number | undefined }>({});
    
    const { id } = useParams<{ id?: string }>();

    useEffect(() => {
        if (!userData?.id && !id) return;
        
        fetch(`${formbarUrl}/api/v1/user/${id ? id : userData?.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `${accessToken}`
            }
        })
        .then(res => res.json())
        .then(data => {
            setProfileProps({
                "Display Name": data.displayName || "N/A",
                "Email": id === String(userData?.id) || !id ? userData?.email : "N/A",
                "Digipogs": data.digipogs || data.digipogs == 0 ? data.digipogs : "N/A",
                "ID": data.id || "N/A",

                "Pog Meter": data.pogMeter && data.pogMeter > 0 ? data.pogMeter / 5 : 0,
            });
        })
        .catch(err => {
            console.error('Error fetching profile data:', err);
        });
    }, [userData, id, accessToken]);

    return (
        <>
            <FormbarHeader />
            
            <Flex align="center" justify="center" style={{ padding: '20px', height: '100%', width: '100%' }}>

                {
                    <Card style={{ width: '300px', position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)' }} loading={profileProps["Pog Meter"] === undefined}>
                        {
                            profileProps["Pog Meter"] !== undefined && (
                                <Flex vertical gap={10} style={{ textAlign: 'center' as 'center' }}>
                                    <strong>Pog Meter:</strong>
                                    <div style={infoStyle}>
                                    <Tooltip title={`${profileProps["Pog Meter"]}%`} placement="top" color="#aa68d0">
                                        <Progress
                                            percent={profileProps["Pog Meter"] as number}
                                            strokeColor={{'0%': '#108ee9', '100%': '#aa68d0'}}
                                            size={["", 40]}
                                            styles={{
                                                rail: {
                                                    borderRadius: '10px',
                                                    padding: '3px',
                                                },
                                                track: {
                                                    position: 'relative',
                                                    height: '100%',
                                                    borderRadius: '7px',
                                                }
                                            }}
                                            showInfo={false}
                                            
                                        />
                                    </Tooltip>
                                    </div>
                                </Flex>
                            )
                        }
                    </Card>
                }

                <Card style={{ margin: '20px', width: '600px' }} loading={!profileProps["Display Name"]}>
                    <Flex vertical align="center" justify="center" style={{ padding: '10px', minWidth: isMobile() ? '300px' : '500px' }} gap={15}>
                        <h2 style={{display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:'10px', width:'100%'}}>
                            <Button variant="solid" color="blue" onClick={() => navigate('/profile/transactions')} style={{ width:'130px'}}>
                                Transactions
                            </Button>
                            Your Profile
                            <Button variant="solid" color="blue" onClick={() => navigate('/pools')} style={{ width:'130px'}}>
                                Pog Pools
                            </Button>
                        </h2>

                        {
                            Object.entries(profileProps).map(([key, value]) => (
                                key == "Pog Meter" || value == 'N/A' ? null :
                                (
                                    <p key={key} style={infoStyle}>
                                        <strong>{key}:</strong>
                                        {value}
                                    </p>
                                )
                            ))
                        }

                        <div style={{width:'100%'}} onClick={() => { if(!showSensitiveInfo) setSensModalOpen(true); }}>
                            <Collapse 
                                style={{width:'100%'}} 
                                expandIcon={({isActive}) => <IonIcon icon={isActive ? IonIcons.lockOpen : IonIcons.lockClosed}/>} 
                                collapsible={showSensitiveInfo ? "header" : "disabled"}
                                size="small"
                                items={
                                    [
                                        {
                                            children: (
                                                <p>
                                                    uhh pin and api  here!
                                                    not added yhet
                                                </p>
                                            ),
                                            key: '1',
                                            label: 'Sensitive Information',
                                        }
                                    ]
                                }
                                
                            />
                    
                    </div>

                        <Modal
                            title="Show sensitive information."
                            okText="Show"
                            cancelText="Cancel"
                            open={sensModalOpen}
                            onCancel={() => setSensModalOpen(false)}
                            onOk={() => {
                                if(Number(enteredPin) === correctPin) setShowSensitiveInfo(true);
                                setSensModalOpen(false);

                                return;
                            }}
                            closeIcon={<IonIcon icon={IonIcons.close} />}
                        >
                            <Flex vertical gap={10} justify="start" align="start">
                                <Text>Please enter your PIN to view sensitive information.<br/>If you have no PIN yet, continue.</Text>
                                <InputNumber controls={false} placeholder="PIN" onChange={setEnteredPin} max={9999}/>
                                <Link href='/forgot-pin' style={{fontSize:'12px'}}>Forgot PIN?</Link>
                            </Flex>
                        </Modal>
                    </Flex>
                </Card>
            </Flex>
        </>
    );
}

const infoStyle: React.CSSProperties = {
    display: 'flex', 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
}