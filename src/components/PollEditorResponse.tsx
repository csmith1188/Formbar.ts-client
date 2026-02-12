import { Checkbox, Flex, Tooltip, Input, InputNumber, Button, ColorPicker } from "antd";

import { useTheme } from "../main";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";

export default function PollEditorResponse({
    answer,
    setAnswer,
    removeAnswer,
}: {
    answer: { color: string; answer: string; isCorrect: boolean; weight: number };
    setAnswer: (newAnswer: { color: string; answer: string; isCorrect: boolean; weight: number }) => void;
    removeAnswer: () => void;
}) {
    return (
        <Flex align="center" justify="center" style={{ height: "40px" }} gap={10}>
            <ColorPicker value={answer.color} styles={{
                root: {
                    height: '100%',  
                    minWidth: 'unset',
                    width: 'unset',
                    aspectRatio: 1,
                },
                
            }} onChange={(e) => setAnswer({...answer, color: "#" + e.toHex()})}/>

            <Tooltip title="Mark as Correct Answer">
                <Checkbox className="correctAnswer" styles={{
                    root: {
                        height: '100%',
                        aspectRatio: 1,
                    },
                    icon: {
                        height: '100%',
                        aspectRatio: 1
                    }
                }} checked={answer.isCorrect} onChange={(e) => setAnswer({ ...answer, isCorrect: e.target.checked })} />
            </Tooltip>

            <Input placeholder="Answer Text" style={{
                height: '100%'
            }} value={answer.answer} onChange={(e) => setAnswer({ ...answer, answer: e.target.value })} />

            <Tooltip title="Answer Weight">
                <InputNumber styles={{
                    root: {
                        height: '100%',
                        width: 'unset',
                        aspectRatio: 1,
                        flexShrink: 0,
                        padding: 0,
                    },
                    input: {
                        textAlign: 'center'
                    },
                    actions: {
                        display: 'none'
                    }}} value={answer.weight} onChange={(value) => setAnswer({ ...answer, weight: value ?? 1 })} />
            </Tooltip>
            
            <Button variant="solid" color="red" onClick={removeAnswer}
                style={{
                    height: '100%',
                    aspectRatio: 1
                }}>
                <IonIcon icon={IonIcons.trash} />
            </Button>
        </Flex>
    );
}