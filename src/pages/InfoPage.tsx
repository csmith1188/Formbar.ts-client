import FormbarHeader from '../components/FormbarHeader';
import { useUserData, useClassData } from '../main';

export default function InfoPage() {
    const { userData } = useUserData();
    const { classData } = useClassData();


    return (
        <>
        <FormbarHeader />
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            <h1>Info Page</h1>
            
            <section>
                <h2>User Data</h2>
                {userData ? (
                    <pre style={{
                        border: "2px solid gray",
                        borderRadius: "8px",
                        padding: "10px",
                        background: "rgba(0,0,0,0.5)",
                        width: "min-content",
                        fontFamily: 'monospace'
                    }}>{JSON.stringify(userData, null, 4)}</pre>
                ) : (
                    <p>No user data available</p>
                )}
            </section>

            <section>
                <h2>Class Data</h2>
                {classData ? (
                    <pre style={{
                        border: "2px solid gray",
                        borderRadius: "8px",
                        padding: "10px",
                        background: "rgba(0,0,0,0.5)",
                        width: "min-content",
                        fontFamily: 'monospace'
                    }}>{JSON.stringify(classData, null, 4)}</pre>
                ) : (
                    <p>No class data available</p>
                )}
            </section>
        </div>
        </>
    );
};