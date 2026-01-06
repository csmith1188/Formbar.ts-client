import { Button, Modal, Typography } from "antd";
const { Text, Title } = Typography;
import { textColorForBackground } from "../../CustomStyleFunctions";
import { socket } from "../../socket";
import { useClassData } from "../../main";

const defaultPolls = [
    {
        id: 1,
        prompt: 'Thumbs?',
        answers: [
            {answer:"Up",weight:0.9,color:"#00FF00"},
            {answer:"Wiggle",weight:1,color:"#00FFFF"},
            {answer:"Down",weight:1.1,color:"#FF0000"}
        ],
        weight: 1,

        blind: false,
        allowVoteChanges: true,
        excludedRespondents: [],
        indeterminate: [],
        allowTextResponses: false,
        allowMultipleResponses: false,
    },
    {
        id: 2,
        prompt: 'True or False',
        answers: [
            {"answer":"True","weight":1,"color":"#00FF00"},
            {"answer":"False","weight":1,"color":"#FF0000"}
        ],
        weight: 1,

        blind: false,
        allowVoteChanges: true,
        excludedRespondents: [],
        indeterminate: [],
        allowTextResponses: false,
        allowMultipleResponses: false,
    },
    {
        id: 3,
        prompt: 'Done/Ready?',
        answers: [
            {"answer":"Yes","weight":1,"color":"#00FF00"}
        ],

        blind: false,
        allowVoteChanges: true,
        excludedRespondents: [],
        indeterminate: [],
        allowTextResponses: false,
        allowMultipleResponses: false,
    },
    {
        id: 4,
        prompt: 'Multiple Choice',
        answers: [
            {"answer":"A","weight":1,"color":"#FF0000"},
            {"answer":"B","weight":1,"color":"#0000FF"},
            {"answer":"C","weight":1,"color":"#FFFF00"},
            {"answer":"D","weight":1,"color":"#00FF00"}
        ],

        blind: false,
        allowVoteChanges: true,
        excludedRespondents: [],
        indeterminate: [],
        allowTextResponses: false,
        allowMultipleResponses: false,
    }
]

export default function PollsMenu({ openModalId, setOpenModalId }: { openModalId: number | null, setOpenModalId: React.Dispatch<React.SetStateAction<number | null>> }) {
    const { classData } = useClassData();

    function startPoll(id: number) {
        const poll = defaultPolls.filter(e => e.id == id)[0];

        if(!classData?.isActive) {
            alert("Cannot start poll when class is not active.");
            return;
        }

        socket?.emit('startPoll', poll);
        setOpenModalId(null);
    }
    
    return (
        <>
            <Title>Default Polls</Title>
            {defaultPolls.map((poll) => {

            return (
                <div key={poll.id} style={{marginTop:'10px', width:'300px'}}>
                    
                    <Button type="primary" style={{padding:'10px', width:'100%'}} onClick={() => {setOpenModalId(poll.id)}}>
                        <Text strong>{poll.prompt}</Text>
                    </Button>
                    <Modal 
                        centered
                        title={poll.prompt} 
                        open={openModalId === poll.id} 
                        onCancel={() => {setOpenModalId(null)}}
                        destroyOnHidden
                        footer={null}
                    >
                        {
                            poll.answers.map((answer, index) => (
                                <Button key={index} style={{backgroundColor: answer.color, color: textColorForBackground(answer.color), marginTop: '5px', width: '100%'}}>
                                    {answer.answer}
                                </Button>
                            ))
                        }

                        <div style={{marginTop:'20px', textAlign:'center', width:'100%'}}>
                            <Button type="primary" onClick={() => startPoll(poll.id)}>Start Poll</Button>
                        
                        </div>
                    </Modal>
                </div>
            );
        })}
        </>
    );
}
