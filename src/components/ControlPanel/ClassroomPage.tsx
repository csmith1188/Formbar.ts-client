import type { Student } from "../../types";

const xAxis = 10;
const yAxis = 5;

export default function ClassroomPage() {
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
                                                        <div><strong>{`${student.displayName.split(' ')[0]} ${student.displayName.split(' ')[1][0]}.`}</strong></div>
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


const students: Student[] = [
    { id: 1, displayName: "Alice Johnson", activeClass: "Class A", permissions: 7, classPermissions: 3, tags: ["Active"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567890 }, help: false, break: false, pogMeter: 85, isGuest: false },
    { id: 2, displayName: "Bob Smith", activeClass: "Class A", permissions: 5, classPermissions: 2, tags: ["Participating"], pollRes: { buttonRes: "No", textRes: "Disagree", time: 1234567891 }, help: false, break: false, pogMeter: 72, isGuest: false },
    { id: 3, displayName: "Carol White", activeClass: "Class B", permissions: 7, classPermissions: 3, tags: ["Active", "Helper"], pollRes: { buttonRes: "Maybe", textRes: "Neutral", time: 1234567892 }, help: false, break: false, pogMeter: 90, isGuest: false },
    { id: 4, displayName: "David Brown", activeClass: "Class A", permissions: 3, classPermissions: 1, tags: ["Quiet"], pollRes: { buttonRes: "Yes", textRes: "", time: 1234567893 }, help: true, break: false, pogMeter: 45, isGuest: false },
    { id: 5, displayName: "Emma Davis", activeClass: "Class C", permissions: 6, classPermissions: 2, tags: ["Engaged"], pollRes: { buttonRes: "No", textRes: "Strong disagreement", time: 1234567894 }, help: false, break: false, pogMeter: 88, isGuest: false },
    { id: 6, displayName: "Frank Miller", activeClass: "Class B", permissions: 5, classPermissions: 2, tags: ["Active"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567895 }, help: false, break: true, pogMeter: 65, isGuest: false },
    { id: 7, displayName: "Grace Wilson", activeClass: "Class A", permissions: 7, classPermissions: 3, tags: ["Leader"], pollRes: { buttonRes: "Yes", textRes: "Strongly agree", time: 1234567896 }, help: false, break: false, pogMeter: 95, isGuest: false },
    { id: 8, displayName: "Henry Moore", activeClass: "Class C", permissions: 4, classPermissions: 1, tags: ["Observer"], pollRes: { buttonRes: "Maybe", textRes: "", time: 1234567897 }, help: true, break: false, pogMeter: 50, isGuest: false },
    { id: 9, displayName: "Iris Taylor", activeClass: "Class B", permissions: 6, classPermissions: 2, tags: ["Participating"], pollRes: { buttonRes: "No", textRes: "No opinion", time: 1234567898 }, help: false, break: false, pogMeter: 75, isGuest: false },
    { id: 10, displayName: "Jack Anderson", activeClass: "Class A", permissions: 5, classPermissions: 2, tags: ["Active"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567899 }, help: false, break: false, pogMeter: 70, isGuest: false },
    { id: 11, displayName: "Karen Thomas", activeClass: "Class C", permissions: 7, classPermissions: 3, tags: ["Leader", "Active"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567900 }, help: false, break: false, pogMeter: 92, isGuest: false },
    { id: 12, displayName: "Leo Jackson", activeClass: "Class B", permissions: 3, classPermissions: 1, tags: ["Quiet"], pollRes: { buttonRes: "Maybe", textRes: "", time: 1234567901 }, help: true, break: true, pogMeter: 40, isGuest: false },
    { id: 13, displayName: "Megan White", activeClass: "Class A", permissions: 6, classPermissions: 2, tags: ["Engaged"], pollRes: { buttonRes: "No", textRes: "Disagree", time: 1234567902 }, help: false, break: false, pogMeter: 82, isGuest: false },
    { id: 14, displayName: "Nathan Harris", activeClass: "Class C", permissions: 5, classPermissions: 2, tags: ["Participating"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567903 }, help: false, break: false, pogMeter: 68, isGuest: false },
    { id: 15, displayName: "Olivia Martin", activeClass: "Class B", permissions: 7, classPermissions: 3, tags: ["Leader"], pollRes: { buttonRes: "Yes", textRes: "Strongly agree", time: 1234567904 }, help: false, break: false, pogMeter: 93, isGuest: false },
    { id: 16, displayName: "Peter Thompson", activeClass: "Class A", permissions: 4, classPermissions: 1, tags: ["Observer"], pollRes: { buttonRes: "Maybe", textRes: "Not sure", time: 1234567905 }, help: true, break: false, pogMeter: 55, isGuest: false },
    { id: 17, displayName: "Quinn Garcia", activeClass: "Class C", permissions: 6, classPermissions: 2, tags: ["Active"], pollRes: { buttonRes: "No", textRes: "Disagree", time: 1234567906 }, help: false, break: false, pogMeter: 77, isGuest: false },
    { id: 18, displayName: "Rachel Martinez", activeClass: "Class B", permissions: 5, classPermissions: 2, tags: ["Participating"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567907 }, help: false, break: true, pogMeter: 73, isGuest: false },
    { id: 19, displayName: "Sam Robinson", activeClass: "Class A", permissions: 7, classPermissions: 3, tags: ["Leader"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567908 }, help: false, break: false, pogMeter: 87, isGuest: false },
    { id: 20, displayName: "Tina Clark", activeClass: "Class C", permissions: 3, classPermissions: 1, tags: ["Quiet"], pollRes: { buttonRes: "Maybe", textRes: "", time: 1234567909 }, help: true, break: false, pogMeter: 42, isGuest: false },
    { id: 21, displayName: "Uma Rodriguez", activeClass: "Class B", permissions: 6, classPermissions: 2, tags: ["Engaged"], pollRes: { buttonRes: "No", textRes: "No", time: 1234567910 }, help: false, break: false, pogMeter: 80, isGuest: false },
    { id: 22, displayName: "Victor Lewis", activeClass: "Class A", permissions: 5, classPermissions: 2, tags: ["Active"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567911 }, help: false, break: false, pogMeter: 69, isGuest: false },
    { id: 23, displayName: "Wendy Lee", activeClass: "Class C", permissions: 7, classPermissions: 3, tags: ["Leader"], pollRes: { buttonRes: "Yes", textRes: "Strongly agree", time: 1234567912 }, help: false, break: false, pogMeter: 94, isGuest: false },
    { id: 24, displayName: "Xavier Walker", activeClass: "Class B", permissions: 4, classPermissions: 1, tags: ["Observer"], pollRes: { buttonRes: "Maybe", textRes: "", time: 1234567913 }, help: true, break: true, pogMeter: 48, isGuest: false },
    { id: 25, displayName: "Yara Hall", activeClass: "Class A", permissions: 6, classPermissions: 2, tags: ["Participating"], pollRes: { buttonRes: "No", textRes: "Disagree", time: 1234567914 }, help: false, break: false, pogMeter: 76, isGuest: false },
    { id: 26, displayName: "Zoe Allen", activeClass: "Class C", permissions: 5, classPermissions: 2, tags: ["Active"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567915 }, help: false, break: false, pogMeter: 71, isGuest: false },
    { id: 27, displayName: "Alex Young", activeClass: "Class B", permissions: 7, classPermissions: 3, tags: ["Leader"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567916 }, help: false, break: false, pogMeter: 89, isGuest: false },
    { id: 28, displayName: "Bailey King", activeClass: "Class A", permissions: 3, classPermissions: 1, tags: ["Quiet"], pollRes: { buttonRes: "Maybe", textRes: "", time: 1234567917 }, help: true, break: false, pogMeter: 44, isGuest: false },
    { id: 29, displayName: "Casey Scott", activeClass: "Class C", permissions: 6, classPermissions: 2, tags: ["Engaged"], pollRes: { buttonRes: "No", textRes: "Disagree", time: 1234567918 }, help: false, break: false, pogMeter: 81, isGuest: false },
    { id: 30, displayName: "Dana Green", activeClass: "Class B", permissions: 5, classPermissions: 2, tags: ["Participating"], pollRes: { buttonRes: "Yes", textRes: "Agree", time: 1234567919 }, help: false, break: false, pogMeter: 74, isGuest: false },
];