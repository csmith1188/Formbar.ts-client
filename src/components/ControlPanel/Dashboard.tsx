import { Flex, Typography } from 'antd';
const { Title } = Typography;

import StudentObject from '../StudentObject';


// classData.students are expected in an object like this:
// {
//     1: {
//         id: 1,
//         name: "Student Name",
//         email: ...
//     }
// }

export default function Dashboard({ classData, openModalId, setOpenModalId }: { classData: any, openModalId: number | null, setOpenModalId: React.Dispatch<React.SetStateAction<number | null>> }) {

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
                                student.id !== classData.owner ? (
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
        </>
    );
}