import { FloatButton } from "antd"
import { IonIcon } from "@ionic/react"
import * as IonIcons from "ionicons/icons"

export default function StudentMenu() {
    return (
        <>
            <FloatButton.Group
                trigger='click'
                placement='top'
                type='primary'
                style={{insetBlockEnd: 20, insetInlineEnd: 30}}
                icon={<IonIcon icon={IonIcons.grid} size='large' />}
                tooltip={{
                    title: 'Menu',
                    color: 'blue',
                    placement: 'left'
                }}
            >
                <FloatButton
                    shape="square"
                    type="primary"
                    tooltip={{
                        title: 'Request a Break',
                        color: 'blue',
                        placement: 'left'
                    }}
                    icon={<IonIcon icon={IonIcons.umbrella} size='large' />}
                />
                <FloatButton
                    shape="square"
                    type="primary"
                    tooltip={{
                        title: 'Help Ticket',
                        color: 'blue',
                        placement: 'left'
                    }}
                    icon={<IonIcon icon={IonIcons.handLeft} size='large' />}
                />
            </FloatButton.Group>
        </>
    )
}