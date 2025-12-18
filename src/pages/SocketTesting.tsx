import { socket } from "../socket";

import FormbarHeader from "../components/FormbarHeader";
import FullCircularPoll from "../components/CircularPoll";
import { useEffect, useState } from "react";
import Log from "../debugLogger";
import { useClassData } from "../main";

export default function SocketTestingPage() {
    const {classData, setClassData} = useClassData();
    const [betaAnswers, setBetaAnswers] = useState<any>([]);
    classData;

    function Respond(response: string) {
        socket.emit('pollResp', response, '');
        Log({ message: `Responded with: ${response}`, level: 'info' });
    }

    useEffect(() => {

		function classUpdate(classData: any) {
			setClassData(classData);
            Log({ message: "Class Update received.", data: classData, level: 'info' });

            Log({ message: "Total Voters: " + classData.poll.totalResponders, level: 'info' });

            let answers = [];

            for (let answer of classData.poll.responses) {
                let percentage = (answer.responses / classData.poll.totalResponders) * 100;
                answers.push({percentage: percentage, color: answer.color});
            }

            setBetaAnswers(answers);
		}

        socket.on('classUpdate', classUpdate);
        
        socket.emit('classUpdate', '');
        return () => {
            socket.off('classUpdate', classUpdate);
        };
    }, []);

    return (
        <>
            <FormbarHeader />

            <button onClick={ () => socket.emit('getActiveClass') }>Get Active Class</button>
            <button onClick={ () => Respond('Up') }>Up</button>
            <button onClick={ () => Respond('Down') }>Down</button>
            <button onClick={ () => Respond('Wiggle') }>Wiggle</button>
            

            <FullCircularPoll pollAnswers={betaAnswers} size={200} />
        </>
    );
}