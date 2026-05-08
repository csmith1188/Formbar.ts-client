import {
	Button,
	Flex,
	Tooltip,
	Typography,
	Input,
	Modal,
	Popover,
	Select,
    Switch,
} from "antd";
const { Title } = Typography;

import StudentObject from "@components/StudentObject";

import { useClassData, useUserData, useSettings, getAppearAnimation, useMobileDetect } from "@/main";
import { useEffect, useState } from "react";
import * as IonIcons from "ionicons/icons";
import { IonIcon } from "@ionic/react";

import { useTheme } from "@/main";
import type { Student } from "@/types";
import { currentUserHasScope, getStudentClassScopeCount } from "@utils/scopeUtils";

export default function Dashboard({
	openModalId,
	setOpenModalId,
}: {
	openModalId: number | null;
	setOpenModalId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
	const { isDark } = useTheme();
    const isMobile = useMobileDetect();

	const [allResponseModalOpen, setAllResponseModalOpen] =
		useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>("");

	const [sortType, setSortType] = useState<
		"Name" | "Permissions" | "Response Order" | "Response Time" | "Response Text" | "Help Time"
	>("Name");

	const [sortDirection, setSortDirection] = useState<"▲" | "▼">("▲");

	const [filterState, setFilterState] = useState<{
		answeredPoll: boolean;
		needsHelp: boolean;
		onBreak: boolean;
		canVote: boolean;
	}>({
		answeredPoll: false,
		needsHelp: false,
		onBreak: false,
		canVote: false,
	});

    const [matchAllFilters, setMatchAllFilters] = useState<boolean>(false);

	const { classData } = useClassData();
	const { userData } = useUserData();
	const { settings } = useSettings();

    const [excludedRespondents, setExcludedRespondents] = useState<string[]>([]);

	const canSeeUsers = currentUserHasScope(userData, "class.students.read");

    useEffect(() => {
        if(!classData?.poll) return;
        setExcludedRespondents(classData.poll.excludedRespondents || []);
    }, [classData])

	const students =
		classData && classData.students
			? (Object.values(classData.students) as Student[])
			: [];

	if (!classData || !classData.students) {
		return (
			<Flex
				style={{ width: "100%", height: "100%" }}
				justify="center"
				align="center"
			>
				<Title>Loading...</Title>
			</Flex>
		);
	}

    function sortStudents(students: Student[]) {
		const sorted = [...students];
		switch (sortType) {
			case "Name":
				sortDirection === "▲"
					? sorted.sort((a, b) => a.displayName.localeCompare(b.displayName))
					: sorted.sort((a, b) => b.displayName.localeCompare(a.displayName));
				break;
			case "Permissions":
				sorted.sort((a, b) => {
                    const aScopeCount = getStudentClassScopeCount(a, classData);
                    const bScopeCount = getStudentClassScopeCount(b, classData);

                    if (aScopeCount === bScopeCount) {
						return a.displayName.localeCompare(b.displayName);
					}
                    if (sortDirection === "▲") return aScopeCount > bScopeCount ? 1 : -1;
                    else return aScopeCount < bScopeCount ? 1 : -1;
				});
				break;
            case "Response Order":
                sorted.sort((a, b) => {
                    const aIndex = classData?.poll.responses.findIndex((r: any) => r.answer === a.pollRes?.buttonRes) || 0;
                    const bIndex = classData?.poll.responses.findIndex((r: any) => r.answer === b.pollRes?.buttonRes) || 0;
                    if (sortDirection === "▲") return aIndex - bIndex;
                    else return bIndex - aIndex;
                })
                break;
            case "Response Time":
				sorted.sort((a, b) => {
					const aTimeRaw = a.pollRes?.time;
					const bTimeRaw = b.pollRes?.time;
					// If aTimeRaw is empty string, force to bottom

                    if(sortDirection === "▲") {
                        if (aTimeRaw === "" && bTimeRaw !== "") return -1;
                        if (bTimeRaw === "" && aTimeRaw !== "") return 1;
                        if (aTimeRaw === "" && bTimeRaw === "") return 0;
                        const aTime = new Date(aTimeRaw).getTime() || 0;
                        const bTime = new Date(bTimeRaw).getTime() || 0;
                        return aTime - bTime;
                    } else {
                        if (aTimeRaw === "" && bTimeRaw !== "") return 1;
                        if (bTimeRaw === "" && aTimeRaw !== "") return -1;
                        if (aTimeRaw === "" && bTimeRaw === "") return 0;
                        const aTime = new Date(aTimeRaw).getTime() || 0;
                        const bTime = new Date(bTimeRaw).getTime() || 0;
                        return bTime - aTime;
                    }
				});
                break;
            case "Response Text":
                sorted.sort((a, b) => {
                    const aText = a.pollRes?.textRes || "";
                    const bText = b.pollRes?.textRes || "";
                
                    if (sortDirection === "▲") return aText.localeCompare(bText);
                    else return bText.localeCompare(aText);
                });
                break;
            case "Help Time":
                if(sortDirection === "▲") sorted.sort((a, b) => (a.help || 0) - (b.help || 0));
                else sorted.sort((a, b) => (b.help || 0) - (a.help || 0));
                break;
        }
        return sorted;
    }

     const filteredStudents = canSeeUsers ? students.filter((student) => {
		// Filters stack: student must match ALL enabled filters
        if(matchAllFilters) {
            if (filterState.answeredPoll && !student.pollRes?.buttonRes) return false;
            if (filterState.needsHelp && !student.help) return false;
            if (filterState.onBreak && !student.break) return false;
            if (filterState.canVote && student.isGuest) return false;
            // Add more filters as needed
            return true;
        }
        // Filters OR: student must match at least one enabled filter
         if (
            !filterState.answeredPoll &&
            !filterState.needsHelp &&
            !filterState.onBreak &&
            !filterState.canVote
        ) {
            return true; // No filters enabled, show all students
        }

        if (filterState.answeredPoll && student.pollRes?.buttonRes) return true;
        if (filterState.needsHelp && student.help) return true;
        if (filterState.onBreak && student.break) return true;
        if (filterState.canVote && !student.isGuest) return true;
		// Add more filters as needed
		return false;
	}) : [];

    const displayedStudents = sortStudents(filteredStudents).filter((student) =>
        student.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    function handleExcludeRespondent(studentId: string, exclude: boolean) {
        let newExcluded = [...excludedRespondents];
        if(exclude) {
            newExcluded.push(studentId);
        } else {
            newExcluded = newExcluded.filter(id => id !== studentId);
        }
        setExcludedRespondents(newExcluded);

        // socket.emit('updateExcludedRespondents', excludedRespondents);
    }


	return (
		<>
            <Flex
                style={{ width: "100%", height: "100%", padding: 20, paddingBottom: 0 }}
                gap={20}
                justify="space-between"
            >
                <Flex style={{ flex: 1 }} vertical gap={10}>
                    <Flex
                        align={isMobile ? "start" : "center"}
                        gap={10}
                        style={{
                            paddingBottom: "10px",
                            borderBottom: "1px solid var(--border-color)",
                        }}
                        vertical={isMobile}
                    > 
                        <Title style={{ margin: "0" }} level={isMobile ? 3 : 1}>Dashboard</Title>
                        <Flex
                            gap={10}
                            style={{height: "60%" }}
                        >
                            <Tooltip title="Sort & Filter" mouseEnterDelay={0.5}>
                                <Popover
                                    placement={isMobile ? "bottom" : "bottomRight"}
                                    trigger={"click"}
                                    title="Sort & Filter Options"
                                    content={
                                        <Flex vertical gap={10}>
                                            <Flex vertical gap={10}>
                                                <p>Sort by:</p>
                                                <Flex gap={10}>
                                                    <Select
                                                        style={{ flex: '1 1 auto'}}
                                                        value={sortType}
                                                        onChange={(value) =>
                                                            setSortType(value)
                                                        }
                                                    >
                                                        <Select.Option value="Name">
                                                            Name
                                                        </Select.Option>
                                                        <Select.Option value="Permissions">
                                                            Permissions
                                                        </Select.Option>
                                                        <Select.Option value="Response Order">
                                                            Response Order
                                                        </Select.Option>
                                                        <Select.Option value="Response Time">
                                                            Response Time
                                                        </Select.Option>
                                                        <Select.Option value="Response Text">
                                                            Response Text 
                                                        </Select.Option>
                                                        <Select.Option value="Help Time">
                                                            Help Time
                                                        </Select.Option>
                                                    </Select>
                                                    <Switch 
                                                        checked={sortDirection === "▲"}
                                                        onChange={() => setSortDirection(sortDirection === "▲" ? "▼" : "▲")}
                                                        style={{flex: '0 0 auto', margin: 'auto '}}
                                                        
                                                        checkedChildren={"▲"}
                                                        unCheckedChildren={"▼"}
                                                    />
                                                </Flex>
                                            </Flex>

                                            <Flex vertical gap={10}>
                                                <p>Filter by:</p>
                                                <Flex align="center" gap={10}>
                                                    <Switch 
                                                        checked={matchAllFilters}
                                                        onChange={() => setMatchAllFilters(!matchAllFilters)}
                                                    />
                                                    <p>Match all filters?</p>
                                                </Flex>
                                                <Button
                                                    variant="solid"
                                                    color={
                                                        filterState.answeredPoll
                                                            ? "green"
                                                            : "red"
                                                    }
                                                    onClick={() => {
                                                        setFilterState(
                                                            (prev) => ({
                                                                ...prev,
                                                                answeredPoll:
                                                                    !prev.answeredPoll,
                                                            }),
                                                        );
                                                    }}
                                                >
                                                    Answered Poll
                                                </Button>
                                                <Button
                                                    variant="solid"
                                                    color={
                                                        filterState.needsHelp
                                                            ? "green"
                                                            : "red"
                                                    }
                                                    onClick={() => {
                                                        setFilterState(
                                                            (prev) => ({
                                                                ...prev,
                                                                needsHelp:
                                                                    !prev.needsHelp,
                                                            }),
                                                        );
                                                    }}
                                                >
                                                    Needs Help
                                                </Button>
                                                <Button
                                                    variant="solid"
                                                    color={
                                                        filterState.onBreak
                                                            ? "green"
                                                            : "red"
                                                    }
                                                    onClick={() => {
                                                        setFilterState(
                                                            (prev) => ({
                                                                ...prev,
                                                                onBreak:
                                                                    !prev.onBreak,
                                                            }),
                                                        );
                                                    }}
                                                >
                                                    On / Requesting Break
                                                </Button>
                                                <Button
                                                    variant="solid"
                                                    color={
                                                        filterState.canVote
                                                            ? "green"
                                                            : "red"
                                                    }
                                                    onClick={() => {
                                                        setFilterState(
                                                            (prev) => ({
                                                                ...prev,
                                                                canVote:
                                                                    !prev.canVote,
                                                            }),
                                                        );
                                                    }}
                                                >
                                                    Can Vote
                                                </Button>
                                            </Flex>
                                        </Flex>
                                    }
                                >
                                    <Button
                                        type="primary"
                                        style={{ height: "100%" }}
                                    >
                                        <IonIcon icon={IonIcons.swapVertical} />
                                    </Button>
                                </Popover>
                            </Tooltip>
                            <Input
                                placeholder={"Search" + (isMobile ? "" : " students")}
                                style={{ height: "100%", width: "100%" }}
                                size="large"
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            </Flex>
                    </Flex>
                    <div
                        style={{
                            display: isMobile ? "flex" : "grid",
                            flexDirection: isMobile ? "column" : "unset",
                            gridTemplateColumns: isMobile ? "unset" : "repeat(auto-fill, minmax(200px, 1fr))",
                            gap: "16px",
                            width: "100%",
                            overflowY: isMobile ? 'scroll' : 'unset',
                            padding: isMobile ? "20px 15px" : "0",
                        }}
                    >
                        {
                            // Show message if only one student (the teacher) is in the class
                            (!canSeeUsers || students.length === 1) && (
                                <p style={{ gridColumn: "1 / -1", textAlign: "center", opacity: 0.75 }}>
                                    {
										canSeeUsers ? "No students found." : "You do not have permission to view students."
									}
                                </p>
                            )
                        }
                        { canSeeUsers && displayedStudents
                            .filter((student) =>
                                student.displayName
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()),
                            )
                            .map((student: any, index: number) =>
                                student.id !== userData?.id ? (
                                    <StudentObject
                                        style={getAppearAnimation(settings.accessibility.disableAnimations, index)}
                                        key={student.id}
                                        student={student}
                                        openModalId={openModalId}
                                        setOpenModalId={setOpenModalId}
                                    />
                                ) : null,
                            )}
                    </div>
                </Flex>
            </Flex>
		</>
	);
}