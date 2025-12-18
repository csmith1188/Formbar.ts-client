import { Menu, Flex, Col, Row, Typography, Card, Statistic, Splitter, Button } from "antd";
const { Title } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { isMobile, useClassData, useTheme } from "../main";
import { Activity, useEffect, useState, useRef } from "react";

import Dashboard from "../components/ControlPanel/Dashboard";
import PollsMenu from "../components/ControlPanel/PollsMenu";
import SettingsMenu from "../components/ControlPanel/SettingsMenu";

import { themeColors } from "../../themes/GlobalConfig";
import { socket } from "../socket";
import Log from "../debugLogger";


const items = [
	{
		key: "1",
		icon: <IonIcon icon={IonIcons.pieChart} />,
		deselectedicon: <IonIcon icon={IonIcons.pieChartOutline} />,
		selectedicon: <IonIcon icon={IonIcons.pieChart} />,
		label: "Dashboard",
	},
	{
		key: "2",
		icon: <IonIcon icon={IonIcons.barChartOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.barChartOutline} />,
		selectedicon: <IonIcon icon={IonIcons.barChart} />,
		label: "Polls",
	},
	{
		key: "3",
		icon: <IonIcon icon={IonIcons.timerOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.timerOutline} />,
		selectedicon: <IonIcon icon={IonIcons.timer} />,
		label: "Timer",
	},
	{
		key: "4",
		icon: <IonIcon icon={IonIcons.lockClosedOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.lockClosedOutline} />,
		selectedicon: <IonIcon icon={IonIcons.lockClosed} />,
		label: "Permissions",
	},
	{
		key: "5",
		icon: <IonIcon icon={IonIcons.settingsOutline} />,
		deselectedicon: <IonIcon icon={IonIcons.settingsOutline} />,
		selectedicon: <IonIcon icon={IonIcons.settings} />,
		label: "Settings",
	},
];

export default function ControlPanel() {
    const { classData, setClassData } = useClassData();

    const statsPanelRef = useRef<HTMLDivElement>(null);
    const [panelWidth, setPanelWidth] = useState(480);

    useEffect(() => {
        const panel = statsPanelRef.current;
        if (!panel) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setPanelWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(panel);
        return () => resizeObserver.disconnect();
    }, []);
    
    const isSingleColumn = panelWidth < 380;

    useEffect(() => {

        function classUpdate(classData: any) {
            setClassData(classData);
            Log({ message: "Class Update received.", data: classData, level: 'info' });

            Log({ message: "Total Voters: " + classData.poll.totalResponders, level: 'info' });
        }

        socket.on('classUpdate', classUpdate);
        
        socket.emit('classUpdate', '');
        return () => {
            socket.off('classUpdate', classUpdate);
        };
    }, []);

	const { isDark } = useTheme();

	const [currentMenu, setCurrentMenu] = useState("1");
	const [menuItems, setMenuItems] = useState(items);
	const [openModalId, setOpenModalId] = useState<number | null>(null);

    const [ responseTime, setResponseTime ] = useState<number>(0);
    const [ responses, setResponses ] = useState<number>(0);
    const [ studentsOnBreak, setStudentsOnBreak ] = useState<number>(0);
    const [ helpTickets, setHelpTickets ] = useState<number>(0);

    const [ classActive, setClassActive ] = useState<boolean>(() => !!classData?.isActive);
    //const [allStudents, setAllStudents] = useState<Student[]>(students);

    function startClass() {
        socket.emit('startClass')
        setClassActive(true);
    }

    function endClass() {
        socket.emit('endClass')
        setClassActive(false);
    }

    // Keep `classActive` synced with incoming `classData.isActive` updates
    useEffect(() => {
        setClassActive(!!classData?.isActive);
    }, [classData?.isActive]);

    const infoDivs = {
        background: isDark 
            ? themeColors.dark.information.background
            : themeColors.light.information.background,
    };

	function openMenu(key: string) {
		if (key === currentMenu) return;
		setCurrentMenu(key);

		const updatedItems = menuItems.map((item) => {
			if (item && item.key === key && "icon" in item) {
				// Set selected icon
				return { ...item, icon: item.selectedicon };
			} else if (item && "icon" in item) {
				// Set deselected icon
				return { ...item, icon: item.deselectedicon };
			}
			return item;
		});
		setMenuItems(updatedItems);
	}

    const students = classData && classData.students ? Object.values(classData.students) as any[] : [];

    useEffect(() => {
        let totalResponseTimes: number[] = [];
        
        students.forEach((student) => {
            if (student.pollRes && student.pollRes.time) {
                // Convert ISO string to milliseconds
                const studentResponseTimeMs = new Date(student.pollRes.time).getTime();
                
                // Poll start time is already in milliseconds
                const pollStartTimeMs = classData?.poll.startTime;
                
                // Calculate difference in seconds (student time - poll start time)
                const timeDifferenceMs = studentResponseTimeMs - (pollStartTimeMs ?? 0);
                const timeDifferenceSeconds = timeDifferenceMs / 1000;
                
                // Only include if positive and reasonable (less than 1 hour)
                if (timeDifferenceSeconds > 0) {
                    totalResponseTimes.push(timeDifferenceSeconds);
                }
            }
        });
        
        // Calculate average response time
        const averageResponseTime = totalResponseTimes.length > 0 
            ? totalResponseTimes.reduce((a, b) => a + b, 0) / totalResponseTimes.length 
            : 0;
            
        if(classData?.poll.startTime !== undefined) setResponseTime(averageResponseTime);
        else setResponseTime(0);

        setResponses(totalResponseTimes.length);
        setStudentsOnBreak(students.filter((s: any) => s.break).length);
        setHelpTickets(students.filter((s: any) => s.help).length);
    }, [students, classData]);

	return (
		<>
			<FormbarHeader />
			<Menu
				defaultSelectedKeys={["1"]}
				defaultOpenKeys={["sub1"]}
				mode="inline"
				inlineCollapsed={false}
				items={menuItems}
				theme={isDark ? "dark" : "light"}
				style={{
					position: "absolute",
					height: "100%",
					width: "250px",
					padding: "0 10px",
					paddingTop: "15px",
				}}
                styles={{
                    itemIcon: {
                        marginRight: '18px'
                    }
                }}
				onClick={(e) => openMenu(e.key)}
			/>

            <Flex style={{position:'absolute', bottom:'30px', left:'10px', gap:'10px', width:'230px'}} vertical>
                
                <Activity mode={classActive ? "hidden" : "visible"}>
                    <Button color="green" variant="solid" type="default" onClick={startClass}>
                        Start Class
                    </Button>
                </Activity>
                
                <Activity mode={classActive ? "visible" : "hidden"}>
                    <Button color="red" variant="solid" type="default" onClick={endClass}>
                        End Class
                    </Button>
                </Activity>
            </Flex>
            
            <Splitter style={{height:'100%', width:'100%'}}>

                <Splitter.Panel min={'520'}>
                    <div style={{ marginLeft: '250px', padding: '20px', height: '100%', flex: '1 1 auto'}}>
                        <Activity mode={currentMenu == "1" ? "visible" : "hidden"}>
                            <Dashboard openModalId={openModalId} setOpenModalId={setOpenModalId}/>
                        </Activity>
                        <Activity mode={currentMenu == "2" ? "visible" : "hidden"}>
                            <PollsMenu openModalId={openModalId} setOpenModalId={setOpenModalId} />
                        </Activity>
                        <Activity mode={currentMenu == "5" ? "visible" : "hidden"}>
                            <SettingsMenu />
                        </Activity>
                    </div>
                </Splitter.Panel>

                <Splitter.Panel defaultSize={'480'}>
                    {
                        !isMobile() ? <Flex
                        ref={statsPanelRef}
                        style={{
                            background: infoDivs.background,
                            padding:'20px',
                            width: 'calc(100% - 40px)',
                            height: 'calc(100% - 40px)',
                            borderRadius:'10px',
                            margin: '20px',
                            overflow: 'auto'
                        }} vertical  justify='start' align='center' gap={20}>
                            <Title style={{ marginBottom: 'auto' }}>Statistics</Title>
                            <Row gutter={[16, 8]}>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic.Timer
                                            
                                            type="countup"
                                            title="Poll Runtime"
                                            value={classData?.poll.startTime == undefined ? Date.now() : classData?.poll.startTime}
                                            format="H:mm:ss"
                                        />
                                    </Card>
                                </Col>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic
                                        title="Allowed to Vote"
                                        value={students.filter((s: any) => !s.tags.includes('Offline')).length}
                                        />
                                    </Card>
                                </Col>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic
                                        title="Response Time"
                                        value={responseTime}
                                        precision={2}
                                        styles={{ content: { color: '#3f8600' } }}
                                        prefix={<><IonIcon icon={IonIcons.arrowUp} style={{marginTop:'2px'}}/></>}
                                        suffix="s"
                                        />
                                    </Card>
                                </Col>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic
                                        title="Responses"
                                        value={responses}
                                        suffix={`/ ${students.length}`}
                                        />
                                    </Card>
                                </Col>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic
                                        title="Help Tickets"
                                        value={helpTickets}
                                        />
                                    </Card>
                                </Col>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic
                                        title="On Break"
                                        value={studentsOnBreak}
                                        />
                                    </Card>
                                </Col>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic
                                        title="Other Statistic"
                                        value={"N/A"}
                                        />
                                    </Card>
                                </Col>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic
                                        title="Other Statistic"
                                        value={"N/A"}
                                        />
                                    </Card>
                                </Col>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic
                                        title="Other Statistic"
                                        value={"N/A"}
                                        />
                                    </Card>
                                </Col>
                                <Col span={isSingleColumn ? 24 : 12}>
                                    <Card variant="borderless">
                                        <Statistic
                                        title="Other Statistic"
                                        value={"N/A"}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </Flex> : null
                    }
                </Splitter.Panel>
            </Splitter>
		</>
	);
}