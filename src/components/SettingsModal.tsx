import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";

import {
    Flex,
    Menu,
    Switch,
    type MenuProps,
    Typography
} from "antd";

const { Text } = Typography;

import { useState } from "react";
import { useMobileDetect, useSettings, useTheme } from "../main";

type MenuItem = Required<MenuProps>['items'][number] & {
    selectedicon?: React.ReactNode;
    deselectedicon?: React.ReactNode;
};

const items: MenuItem[] = [
    {
        key: "0",
        icon: <IonIcon icon={IonIcons.settingsOutline} />,
        deselectedicon: <IonIcon icon={IonIcons.settingsOutline} />,
        selectedicon: <IonIcon icon={IonIcons.settings} />,
        label: "General",
    },
    {
        key: "1",
        icon: <IonIcon icon={IonIcons.colorPaletteOutline} />,
        deselectedicon: <IonIcon icon={IonIcons.colorPaletteOutline} />,
        selectedicon: <IonIcon icon={IonIcons.colorPalette} />,
        label: "Appearance",
    },
    {
        key: "2",
        icon: <IonIcon icon={IonIcons.accessibility} />,
        deselectedicon: <IonIcon icon={IonIcons.accessibilityOutline} />,
        selectedicon: <IonIcon icon={IonIcons.accessibility} />,
        label: "Accessibility",
    },
];



export default function SettingsModal() {
    const [currentMenu, setCurrentMenu] = useState("1");
    const [menuItems, setMenuItems] = useState(items);
    const { settings, updateSettings } = useSettings();
    const { isDark, toggleTheme } = useTheme();

    function openMenu(key: string) {
		if (key === currentMenu) return;
		setCurrentMenu(key);

        const updatedItems = menuItems.map((item) => {
                if(item?.type === "divider") return item;
    
                if (item && item.key === key && "icon" in item) {
                    // Set selected icon
                    return { ...item, icon: item.selectedicon } as typeof item;
                } else if (item && "icon" in item) {
                    // Set deselected icon
                    return { ...item, icon: item.deselectedicon } as typeof item;
                }
                return item;
            });
		setMenuItems(updatedItems);
	}

    const isMobile = useMobileDetect()

    return (
        <Flex style={{ width: "100%", height: "100%" }}>
            <Menu
                defaultSelectedKeys={["1"]}
                defaultOpenKeys={["sub1"]}
                mode="inline"
                items={menuItems}
                inlineCollapsed={isMobile}
                theme={"dark"}
                style={{
                    height: "100%",
                    minWidth: isMobile ? "80px" : "250px",
                    maxWidth: isMobile ? "80px" : "250px",
                    padding: "0 10px",
                    paddingTop: "15px",
                }}
                className={settings.disableAnimations ? "" : "animMenu"}
                styles={{
                    itemIcon: {
                        marginRight: "18px",
                    },
                }}
                onClick={(e) => openMenu(e.key)}
            />
            <Flex style={{padding: 20, width:'100%', height: '100%'}}>
                {
                    currentMenu === "0" && (
                        <Flex vertical gap={15}>
                            <Text>General settings will go here. You can change your name, email, and other account details.</Text>
                        </Flex>
                    )
                }
                {currentMenu === "1" && (
                    <Flex vertical gap={15}>
                        <Flex gap={10} align="center">
                            <Switch
                                checkedChildren={<IonIcon icon={IonIcons.moon} />}
                                unCheckedChildren={<IonIcon icon={IonIcons.sunny} />}
                                checked={isDark}
                                onChange={toggleTheme}
                            />
                            <Text>{isDark ? "Dark Mode" : "Light Mode"}</Text>
                        </Flex>
                    </Flex>
                )}
                {currentMenu === "2" && (
                    <Flex vertical gap={15}>
                        <Flex gap={10} align="center">
                            <Switch checked={settings.disableAnimations} onChange={(checked) => {
                                updateSettings({ disableAnimations: checked });
                            }} />
                            <Text>Disable Animations</Text>
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
}