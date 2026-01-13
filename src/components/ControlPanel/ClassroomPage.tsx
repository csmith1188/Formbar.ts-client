import { useClassData } from "../../main";
import type { Student } from "../../types";

const xAxis = 10;
const yAxis = 5;

export default function ClassroomPage() {
    const { classData } = useClassData();
    const students = classData && classData.students ? Object.values(classData.students) as any[] : [];

    return (
        <>
            <div style={gridStyle}>
                {
                    Array.from({ length: yAxis }).map((_, rowIndex) => (
                        <div key={rowIndex} style={{ height: '100%', display: 'flex', gap: '10px', marginBottom: '10px', width: '100%' }}>
                            {
                                Array.from({ length: xAxis }).map((_, colIndex) => {
                                    const studentIndex = rowIndex * xAxis + colIndex;
                                    const student = students[studentIndex];
                                    return (
                                        <div key={colIndex} style={student ? studentStyle : emptySlotStyle}>
                                            {
                                                student ? (
                                                    <>
                                                        <div><strong>{`${student.displayName}`}</strong></div>
                                                    </>
                                                ) : (
                                                    <div style={{ height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#999' }}>
                                                        <br/>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ))
                }
            </div>
        </>
    );
}

const gridStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '10px',
    boxSizing: 'border-box' as const,
    overflowY: 'auto' as const,
}

const studentStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '10px',
    textAlign: 'center' as const,
    height: '100%',
    aspectRatio: '1 / 1',

    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
}

const emptySlotStyle = {
    border: '1px dashed #ccc',
    borderRadius: '8px',
    height: '100%',
    aspectRatio: '1 / 1',
}