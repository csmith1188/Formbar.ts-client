import { Flex, Tooltip } from "antd";
import { useClassData } from "../main"
import { textColorForBackground, calculateFontSize } from "../CustomStyleFunctions";


export default function ControlPanelPoll({ classData, height }: { classData?: any, height?: string }) {
    const contextClassData = useClassData();
    const data = classData || contextClassData?.classData;

    return (
        <>
            <Flex style={{width: '100%', height:height || '20px', background:"#fff3", borderBottom:'2px solid #000', boxSizing:'border-box', overflow:'hidden'}}>
                {
                    data?.poll.responses.map((resp: any, index: number) => (
                        <Tooltip color={resp.color} key={index} title={`${resp.answer}: ${resp.responses} vote${resp.responses !== 1 ? 's' : ''}`} placement="bottom">
                            <Flex key={index} style={{width: resp.responses !== 0 ? `${(resp.responses / data.poll.totalResponders) * 100}%` : '0%', height:'100%', background: resp.color, transition: 'width 0.3s ease', borderLeft: index === 0 ? 'none' : resp.responses > 0 ? '2px solid #000' : 'none', fontSize: calculateFontSize((resp.responses / data.poll.totalResponders) * 100, resp.answer), color: textColorForBackground(resp.color)}} justify="center" align="center">
                                {resp.responses > 0 ? resp.answer : ' '}
                            </Flex>
                        </Tooltip>
                    ))

                    
                }
                {
                    // Show unanswered portion if there are unanswered responses
                    data?.poll.totalResponses < data?.poll.totalResponders ? (
                        <Tooltip title={`Unanswered: ${data.poll.totalResponders - data.poll.totalResponses} student${(data.poll.totalResponders - data.poll.totalResponses) !== 1 ? 's' : ''}`} placement="bottom">
                            <Flex style={{width: `${((data.poll.totalResponders - data.poll.totalResponses) / data.poll.totalResponders) * 100}%`, height:'100%', background: 'rgba(255, 255, 255, 0.2)', transition: 'width 0.3s ease', borderLeft: data?.poll.responses.length === 0 ? 'none' : data.poll.totalResponders - data.poll.totalResponses > 0 ? '2px solid #000' : 'none', fontSize: calculateFontSize(((data.poll.totalResponders - data.poll.totalResponses) / data.poll.totalResponders) * 100, 'Unanswered'), color: textColorForBackground('rgba(255, 255, 255, 0.2)')}} justify="center" align="center">
                                Unanswered
                            </Flex>
                        </Tooltip>
                    ) : null
                }
            </Flex>
        </>
    )
}