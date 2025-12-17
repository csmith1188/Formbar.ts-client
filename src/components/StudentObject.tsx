import { Badge, Button, Flex, Modal, Typography } from "antd";
import { StudentAccordion } from "./AccordionCollapse";
const { Text } = Typography;

export default function StudentObject({ student, openModalId, setOpenModalId }: { student: any, openModalId: number | null, setOpenModalId: React.Dispatch<React.SetStateAction<number | null>> }) {
    const getStatusText = () => {
        if (student.help) return "Help Ticket";
        if (typeof student.break === "string") return "Requesting Break";
        if (typeof student.break === "boolean" && student.break) return "On Break";
        if (student.isGuest) return "Guest";
        return "";
    };
        
    const statusText = getStatusText();

    return (
        <div key={student.id}>
            <div>
                {
                    statusText ? (
                        <Badge.Ribbon color={
                            statusText === "Help Ticket" ? "red" :
                            statusText === "On Break" ? "yellow" : "gray"
                        } style={{position:'absolute',top:'-20px'}} text={statusText}>
                            <Button type="primary" style={{padding:'10px', width:'100%'}} onClick={() => setOpenModalId(student.id)}>
                                <Text strong>{student.displayName}</Text>
                            </Button>
                        </Badge.Ribbon>
                    ) : (
                        <Button type="primary" style={{padding:'10px', width:'100%'}} onClick={() => setOpenModalId(student.id)}>
                            <Text strong>{student.displayName}</Text>
                        </Button>
                    )
                }
                <Modal 
                    centered
                    title={
                        <Flex vertical>{student.displayName}
                            <Text italic type="secondary" style={{fontWeight:300, fontSize:'16px'}}>ID: {student.id}</Text>
                        </Flex>
                    } 
                    open={openModalId === student.id} 
                    onCancel={() => setOpenModalId(null)} 
                    footer={null}
                >
                    <Flex justify="center">
                        <StudentAccordion studentData={student} />
                    </Flex>
                </Modal>
            </div>
        </div>
    )
}