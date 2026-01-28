import { Button, Flex, Segmented, Tooltip, Typography, Input, Modal, Popover, Select } from 'antd';
const { Title } = Typography;

import StudentObject from '../StudentObject';

import { useClassData, useUserData } from '../../main';
import { useState } from 'react';
import ClassroomPage from '../ControlPanel/ClassroomPage';
import * as IonIcons from 'ionicons/icons';
import { IonIcon } from '@ionic/react';


export default function Dashboard({ openModalId, setOpenModalId }: { openModalId: number | null, setOpenModalId: React.Dispatch<React.SetStateAction<number | null>> }) {
    const [allResponseModalOpen, setAllResponseModalOpen] = useState<boolean>(false);
    const [currentView, setView] = useState<'dash' | 'class'>('dash');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [sortState, setSortState] = useState<
        'Name ▲'       | 'Name ▼' |
        'Permissions ▲'| 'Permissions ▼' | 
        'Response Order ▲'       | 'Response Order ▼' |
        'Response Time ▲'       | 'Response Time ▼' |
        'Response Text ▲'    | 'Response Text ▼' |
        'Help Time ▲'       | 'Help Time ▼'
    >('Name ▲');

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

    return (
        <>
            <Segmented options={
                    [
                        'Dashboard',
                        // 'Classroom View',
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
                        <Flex align='center' gap={10} style={{paddingBottom:'10px', borderBottom: '1px solid var(--border-color)'}}>
                            <Title style={{margin:'0'}}>Dashboard</Title>
                            <Tooltip title="All Responses">
                                <Button type='primary' style={{height:'60%'}} onClick={() => setAllResponseModalOpen(true)}><IonIcon icon={IonIcons.barChart} /></Button>
                            </Tooltip>
                            <Modal title="All User Responses"
                                open={allResponseModalOpen}
                                onCancel={() => setAllResponseModalOpen(false)}
                                footer={null}
                            >
                                {
                                    classData.poll ? (
                                        <div>
                                            {
                                                students.filter((e) => e.id !== userData?.id).map((student: any) => {
                                                    const matchingResponse = classData.poll.responses.find((e: any) => e.answer === student.pollRes?.buttonRes);
                                                    return (
                                                        <div key={student.id} style={{marginBottom:'10px', paddingBottom:'10px', borderBottom:'1px solid var(--border-color)'}}>
                                                            <strong>{student.displayName}:</strong> <span style={{color: matchingResponse?.color}}>{student.pollRes?.buttonRes ? student.pollRes.buttonRes : 'No Response'}</span> | {student.pollRes?.textRes ? student.pollRes.textRes : 'No Text'}
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    ) : <p>No active poll.</p>
                                }
                            </Modal>
                            <Tooltip title="Sort & Filter">
                                <Popover placement='bottomLeft' trigger={'click'} title="Sort & Filter Options" content={
                                    <Select style={{width:'100%'}} value={sortState} onChange={(value) => setSortState(value)}>
                                        <Select.Option value="Name ▲">Name ▲</Select.Option>
                                        <Select.Option value="Name ▼">Name ▼</Select.Option>
                                        <Select.Option value="Permissions ▲">Permissions ▲</Select.Option>
                                        <Select.Option value="Permissions ▼">Permissions ▼</Select.Option>
                                        <Select.Option value="Response Order ▲">Response Order ▲</Select.Option>
                                        <Select.Option value="Response Order ▼">Response Order ▼</Select.Option>
                                        <Select.Option value="Response Time ▲">Response Time ▲</Select.Option>
                                        <Select.Option value="Response Time ▼">Response Time ▼</Select.Option>
                                        <Select.Option value="Response Text ▲">Response Text ▲</Select.Option>
                                        <Select.Option value="Response Text ▼">Response Text ▼</Select.Option>
                                        <Select.Option value="Help Time ▲">Help Time ▲</Select.Option>
                                        <Select.Option value="Help Time ▼">Help Time ▼</Select.Option>
                                    </Select>
                                }>
                                    <Button type='primary' style={{height:'60%'}}><IonIcon icon={IonIcons.swapVertical} /></Button>
                                </Popover>
                            </Tooltip>
                            <Input placeholder="Search students" style={{height:'60%', width:'300px'}} size='large' onChange={(e) => setSearchQuery(e.target.value)} />
                        </Flex>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '16px',
                            width: '100%'
                        }}>
                            {
                                students.filter(student => student.displayName.toLowerCase().includes(searchQuery.toLowerCase())).map((student: any) => (
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