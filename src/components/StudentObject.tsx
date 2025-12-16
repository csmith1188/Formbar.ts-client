import { Badge, Button, Modal, Typography } from "antd";
import { socket } from "../socket";
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
                    title={<>{student.displayName}<br/><Text italic type="secondary" style={{fontWeight:300}}>ID: {student.id}</Text></>} 
                    open={openModalId === student.id} 
                    onCancel={() => setOpenModalId(null)} 
                    footer={null}
                >
                    <p>
                        isGuest: {student.isGuest ? "Yes" : "No"}<br/>
                        help: {student.help ? ( <>Yes <Button color='red' type="default" variant="solid" onClick={() => socket.emit("deleteTicket", student.id)}>Delete</Button></> )  : "No"}<br/>
                        break: {typeof student.break === "string" ? (<>{student.break} <Button color='green' type="default" variant="solid" onClick={() => socket.emit("approveBreak", true, student.id)}>Approve</Button><Button color='red' type="default" variant="solid" onClick={() => socket.emit("approveBreak", false, student.id)}>Deny</Button></>) : typeof student.break === "boolean" && student.break ? (<>{"On Break"}<Button color='red' type="default" variant="solid" onClick={() => socket.emit("approveBreak", false, student.id)}>End Break</Button></>) : "No"}<br/>
                    </p>
                </Modal>
            </div>
        </div>
    )
}