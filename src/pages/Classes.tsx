import { Button, Card, Flex, Input, Select, Typography } from "antd";
const { Title, Text } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import { useUserData } from "../main";
import type { CardStylesType } from "antd/es/card/Card";
import { useMobileDetect } from "../main";

export default function ClassesPage() {
    const { userData } = useUserData();
    const isMobileView = useMobileDetect();

    let cardStyle = { width: '350px', height: '230px' };
    if (isMobileView) {
        cardStyle = { width: '300px', height: '200px' };
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
                    <Card title="Enter a Class" style={cardStyle} styles={cardStyles}>
                        <Flex vertical gap={20} align="center" justify="center" style={{height:'100%'}}>
                            <Select style={{width:'100%', padding:'6px'}} placeholder="Select a class to enter">
                                <Select.Option value="class1">Class 1</Select.Option>
                                <Select.Option value="class2">Class 2</Select.Option>
                            </Select>
                            <Flex align="center" justify="center" gap={10} wrap="wrap" style={{ width:'100%'}}>
                                <Button type="primary" >Enter{isMobileView ? "" : " Class"}</Button>
                                <Button type='default' color="danger" variant="solid">Delete{isMobileView ? "" : " Class"}</Button>
                            </Flex>
                        </Flex>
                    </Card>
                    <Card title="Create a Class" style={cardStyle} styles={cardStyles}>
                        <Flex vertical gap={20} align="center" justify="center" style={{height:'100%'}}>
                            <Input style={{width:'100%'}} placeholder="Class Name" />
                            <Button type="primary" style={{ width:'100%'}}>Create{isMobileView ? "" : " Class"}</Button>
                        </Flex>
                    </Card>
                    <Card title="Join a Class" style={cardStyle} styles={cardStyles}>
                        <Flex vertical gap={20} align="center" justify="center" style={{height:'100%'}}>
                            <Input style={{width:'100%'}} placeholder="Class Code" />
                            <Button type="primary" style={{ width:'100%'}}>Join{isMobileView ? "" : " Class"}</Button>
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