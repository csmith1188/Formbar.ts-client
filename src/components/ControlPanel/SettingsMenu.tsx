import { Flex, QRCode, Typography, Input, Button, Switch, Splitter, Space, Divider, Collapse } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
const { Title, Text } = Typography;
import { useClassData } from "../../main";
import { useEffect, useState } from "react";

export default function SettingsMenu() {
    const { classData } = useClassData();

    const [classLinks, setClassLinks] = useState<{ name: string; url: string }[]>([]);

    useEffect(() => {
        // Fetch class links from server or initialize
        setClassLinks([
            { name: "Formbar", url: "https://formbar.ljharnish.org" },
            { name: "YTech-Formbar", url: "https://formbar.yorktechapps.com" },
            { name: "Formbeta", url: "https://formbeta.yorktechapps.com" },

            { name: "Formbar.js", url: "https://github.com/csmith1188/Formbar.js" },
            { name: "Formbar.ts-client", url: "https://github.com/csmith1188/Formbar.ts-client" },
        ]);
    }, []);

    return (
        <>
            <Flex gap={50} style={{height:'100%', width:'100%', overflowY:'auto',}}>

                        <Flex vertical gap={20} style={{width:'100%', paddingRight:20}}>
                            <Title style={{marginBottom:'0'}}>Settings</Title>
                            <Divider />

                            {/* <QRCode value={"http://172.16.3.100:5000/spotify"} bordered={false} size={100} /> */}

                            <Title level={3} style={{marginTop:0}}>General</Title>

                            <Flex gap={10} style={{width:'400px'}} justify="center" align="center">
                                <Input placeholder="Class Name" defaultValue={classData?.className} />
                                <Button type="primary">Change Class Name</Button>
                            </Flex>

                            <Flex gap={10} style={{width:'400px'}} justify="center" align="center">
                                <Button variant="solid" color="danger">Kick All Students</Button>
                                <Button variant="solid" color="danger">Regenerate Code</Button>
                            </Flex>

                            <Divider />

                            <Title level={3}>Allow Voting</Title>

                            <Flex vertical gap={10}>
                                <Flex align="center" justify="start" gap={10}>
                                    <Switch
                                        checkedChildren={<CheckOutlined />}
                                        unCheckedChildren={<CloseOutlined />}
                                        defaultChecked
                                    />
                                    Guest
                                    <Text type="secondary">(Can vote without an account)</Text>
                                </Flex>
                                <Flex align="center" justify="start" gap={10}>
                                    <Switch
                                        checkedChildren={<CheckOutlined />}
                                        unCheckedChildren={<CloseOutlined />}
                                        defaultChecked
                                    />
                                    Mods
                                    <Text type="secondary">(Mods can access student panel and vote)</Text>
                                </Flex>
                                <Flex align="center" justify="start" gap={10}>
                                    <Switch
                                        checkedChildren={<CheckOutlined />}
                                        unCheckedChildren={<CloseOutlined />}
                                        defaultChecked
                                    />
                                    Teachers
                                    <Text type="secondary">(Teachers can access student panel and vote)</Text>
                                </Flex>
                            </Flex>

                            <Divider />

                            <Title level={3}>Links</Title>


                            <Flex justify="end" align="center" style={{width:'100%'}}>
                                <Input placeholder="Link Name" style={{width:'200px', marginRight:10}} />
                                <Space.Compact style={{width:'100%'}}>
                                    <Space.Addon>https://</Space.Addon>
                                    <Input placeholder="example.com" />
                                </Space.Compact>
                                <Button type="primary" style={{marginLeft:10, width:'100px'}}>Add Link</Button>
                            </Flex>

                            <Collapse
                                bordered={false}
                                items={[{
                                    key: 1,
                                    label: "Added Links",
                                    children: (
                                        <Flex vertical>
                                        {
                                            classLinks.map((link, index) => (
                                                <Flex key={index} justify="space-between" align="center" style={{width:'100%', borderBottom:'1px solid var(--antd-border-color)', paddingBottom:10, marginBottom:10}}>
                                                    <Input style={{width:'200px', marginRight:10}} value={link.name} readOnly />
                                                    <Input style={{width:'100%'}} value={link.url} readOnly />
                                                    <Button variant="solid" color="danger" style={{marginLeft:10, width:'100px'}}>Remove</Button>
                                                </Flex>
                                            ))
                                        }
                                    </Flex>
                                    ),
                                }]}
                                
                            />
                        
                            <Divider />
                        </Flex>
            </Flex>
        </>
    );
}