import { Flex, Segmented, Typography } from 'antd';
const { Title } = Typography;

import StudentObject from '../StudentObject';

import { useClassData, useUserData } from '../../main';
import { useState } from 'react';
import ClassroomPage from '../ControlPanel/ClassroomPage';

export default function Dashboard({ openModalId, setOpenModalId }: { openModalId: number | null, setOpenModalId: React.Dispatch<React.SetStateAction<number | null>> }) {

    const { classData } = useClassData();
    const { userData } = useUserData();

    const students = classData && classData.students ? Object.values(classData.students) as any[] : [];

    if (!classData || !classData.students) {
        return (
            <Flex style={{ width:'100%', height: '100%'}} justify="center" align="center">
                <Title>Loading...</Title>
            </Flex>
        );
    }

    const [currentView, setView] = useState<'dash' | 'class'>('dash');

    return (
        <>
            <Segmented options={
                    [
                        'Dashboard',
                        'Classroom View',
                    ]
                } 
                onChange={(e) => {
                    e === 'Dashboard' ? setView('dash') : setView('class');
                }}
                style={{position:'absolute', left:'270px', bottom: '20px', opacity:0.85}}
            />
            { currentView === 'class' && 
                <ClassroomPage />
            }
            { currentView === 'dash' &&
                <Flex style={{ width:'100%', height: '100%'}} gap={20} justify="space-between">
                    <Flex style={{flex: 1}} vertical gap={10}>
                        <Title>Dashboard</Title>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '16px',
                            width: '100%'
                        }}>
                            {
                                students.map((student: any) => (
                                    student.id !== userData?.id ? (
                                        <StudentObject 
                                            key={student.id}
                                            student={student}
                                            openModalId={openModalId}
                                            setOpenModalId={setOpenModalId}
                                        />
                                    ) : null
                                ))
                            }
                        </div>
                    </Flex>
                </Flex>
            }
        </>
    );
}