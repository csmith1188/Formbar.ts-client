import FormbarHeader from "../components/FormbarHeader";
import { Collapse, Card, Flex, Progress, Tooltip, Modal, InputNumber, Typography, Button } from "antd";
const { Text, Link } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData, isMobile } from "../main";

const correctPin = 1243;

export default function Profile() {
    const { userData } = useUserData();
    const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
    const [sensModalOpen, setSensModalOpen] = useState(false);
    const [enteredPin, setEnteredPin] = useState<string | number | null>(null);
    const navigate = useNavigate();

    const profileProps = {
        // "Display Name": userData?.displayName || "N/A",
        "Email": userData?.email || "N/A",
        // "Digipogs": userData?.digipogs || 0,
        "ID": userData?.id || "N/A",

        "Pog Meter": userData?.pogMeter && userData.pogMeter > 0 ? userData.pogMeter / 5 : 0,
    }

    return (
        <>
            <FormbarHeader />
            
            <Flex align="center" justify="center" style={{ padding: '20px', height: '100%', width: '100%' }}>

                {
                    <Card style={{ width: '300px', position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)' }}>
                        {
                            profileProps["Pog Meter"] !== undefined && (
                                <Flex vertical gap={10} style={{ textAlign: 'center' as 'center' }}>
                                    <strong>Pog Meter:</strong>
                                    <p style={infoStyle}>
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
                                    </p>
                                </Flex>
                            )
                        }
                    </Card>
                }

                <Card style={{ margin: '20px', width: '600px' }}>
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
                                key == "Pog Meter" ? null :
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