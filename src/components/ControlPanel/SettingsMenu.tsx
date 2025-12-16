import { QRCode } from "antd";

export default function SettingsMenu() {
    return (
         <QRCode
            value="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            size={200}
            iconSize={75}
            type="canvas"
            icon="/img/FormbarLogo2-Circle.png"
            bordered={false}
        />
    );
}