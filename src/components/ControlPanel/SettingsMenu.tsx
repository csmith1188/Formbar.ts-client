import { QRCode } from "antd";
import { useClassData } from "../../main";

export default function SettingsMenu() {
    const { classData } = useClassData();

    return (
        <>
            <QRCode
                value={classData ? `${window.location.origin}/student/join/${classData.key}` : ''}
                size={200}
                iconSize={50}
                type="canvas"
                color="black"
                icon="/img/FormbarLogo2-Circle.png"
                bordered={false}
            />
        </>
    );
}