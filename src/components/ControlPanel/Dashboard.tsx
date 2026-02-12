import {
	Button,
	Flex,
	Segmented,
	Tooltip,
	Typography,
	Input,
	Modal,
	Popover,
	Select,
    Switch,
} from "antd";
const { Title } = Typography;

import StudentObject from "../StudentObject";

import { useClassData, useUserData } from "../../main";
import { useState } from "react";
import ClassroomPage from "../ControlPanel/ClassroomPage";
import * as IonIcons from "ionicons/icons";
import { IonIcon } from "@ionic/react";

import { useTheme, isMobile } from "../../main";

export default function Dashboard({
	openModalId,
	setOpenModalId,
}: {
	openModalId: number | null;
	setOpenModalId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
	const { isDark } = useTheme();

	const [allResponseModalOpen, setAllResponseModalOpen] =
		useState<boolean>(false);
	const [currentView, setView] = useState<"dash" | "class">("dash");
	const [searchQuery, setSearchQuery] = useState<string>("");

	const [sortState, setSortState] = useState<
		| "Name ▲"
		| "Name ▼"
		| "Permissions ▲"
		| "Permissions ▼"
		| "Response Order ▲"
		| "Response Order ▼"
		| "Response Time ▲"
		| "Response Time ▼"
		| "Response Text ▲"
		| "Response Text ▼"
		| "Help Time ▲"
		| "Help Time ▼"
	>("Name ▲");

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

	const students =
		classData && classData.students
			? (Object.values(classData.students) as any[])
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

    function sortStudents(students: any[]) {
        const sorted = [...students];
        switch (sortState) {
            case "Name ▲":
                sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
                break;
            case "Name ▼":
                sorted.sort((a, b) => b.displayName.localeCompare(a.displayName));
                break;
			case "Permissions ▲":
				   sorted.sort((a, b) => {
					   if (a.classPermissions === b.classPermissions) {
						   return a.displayName.localeCompare(b.displayName);
					   }
					   return a.classPermissions > b.classPermissions ? 1 : -1;
				   });
				break;
			case "Permissions ▼":
				   sorted.sort((a, b) => {
					   if (a.classPermissions === b.classPermissions) {
						   return a.displayName.localeCompare(b.displayName);
					   }
					   return a.classPermissions < b.classPermissions ? 1 : -1;
				   });
				break;
            case "Response Order ▲":
                sorted.sort((a, b) => {
                    const aIndex = classData?.poll.responses.findIndex((r: any) => r.answer === a.pollRes?.buttonRes) || 0;
                    const bIndex = classData?.poll.responses.findIndex((r: any) => r.answer === b.pollRes?.buttonRes) || 0;
                    return aIndex - bIndex;
                });
                break;
            case "Response Order ▼":
                sorted.sort((a, b) => {
                    const aIndex = classData?.poll.responses.findIndex((r: any) => r.answer === a.pollRes?.buttonRes) || 0;
                    const bIndex = classData?.poll.responses.findIndex((r: any) => r.answer === b.pollRes?.buttonRes) || 0;
                    return bIndex - aIndex;
                });
                break;
            case "Response Time ▲":
				sorted.sort((a, b) => {
					const aTimeRaw = a.pollRes?.time;
					const bTimeRaw = b.pollRes?.time;
					// If aTimeRaw is empty string, force to bottom
					if (aTimeRaw === "" && bTimeRaw !== "") return -1;
					if (bTimeRaw === "" && aTimeRaw !== "") return 1;
					if (aTimeRaw === "" && bTimeRaw === "") return 0;
					const aTime = new Date(aTimeRaw).getTime() || 0;
					const bTime = new Date(bTimeRaw).getTime() || 0;
					return aTime - bTime;
				});
                break;
            case "Response Time ▼":
				sorted.sort((a, b) => {
					const aTimeRaw = a.pollRes?.time;
					const bTimeRaw = b.pollRes?.time;
					// If aTimeRaw is empty string, force to bottom
					if (aTimeRaw === "" && bTimeRaw !== "") return 1;
					if (bTimeRaw === "" && aTimeRaw !== "") return -1;
					if (aTimeRaw === "" && bTimeRaw === "") return 0;
					const aTime = new Date(aTimeRaw).getTime() || 0;
					const bTime = new Date(bTimeRaw).getTime() || 0;
					return bTime - aTime;
				});
                break;
            case "Response Text ▲":
                sorted.sort((a, b) => {
                    const aText = new Date(a.pollRes?.time).getTime() || 0;
                    const bTime = new Date(b.pollRes?.time).getTime() || 0;
                    return aText - bTime;
                });
                break;
            case "Response Text ▼":
                sorted.sort((a, b) => {
                    const aText = a.pollRes?.textRes || "";
                    const bText = b.pollRes?.textRes || "";
                    return bText.localeCompare(aText);
                });
                break;
            case "Help Time ▲":
                sorted.sort((a, b) => (a.helpReqTime || 0) - (b.helpReqTime || 0));
                break;
            case "Help Time ▼":
                sorted.sort((a, b) => (b.helpReqTime || 0) - (a.helpReqTime || 0));
                break;
        }
        return sorted;
    }

     const filteredStudents = students.filter((student) => {
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
	});

    const displayedStudents = sortStudents(filteredStudents).filter((student) =>
        student.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

	return (
		<>
			<Segmented
				options={[
					"Dashboard",
					// 'Classroom View',
				]}
				onChange={(e) => {
					e === "Dashboard" ? setView("dash") : setView("class");
				}}
				style={{
					position: "absolute",
					left: "270px",
					bottom: "20px",
					opacity: 0.85,
				}}
			/>
			{currentView === "class" && <ClassroomPage />}
			{currentView === "dash" && (
				<Flex
					style={{ width: "100%", height: "100%" }}
					gap={20}
					justify="space-between"
				>
					<Flex style={{ flex: 1 }} vertical gap={10}>
						<Flex
							align="center"
							gap={10}
							style={{
								paddingBottom: "10px",
								borderBottom: "1px solid var(--border-color)",
							}}
						>
							<Title style={{ margin: "0" }}>Dashboard</Title>
							<Tooltip title="All Responses">
								<Button
									type="primary"
									style={{ height: "60%" }}
									onClick={() =>
										setAllResponseModalOpen(true)
									}
								>
									<IonIcon icon={IonIcons.barChart} />
								</Button>
							</Tooltip>
							<Modal
								title="All User Responses"
								open={allResponseModalOpen}
								onCancel={() => setAllResponseModalOpen(false)}
								footer={null}
								width={"90%"}
							>
								{classData.poll ? (
									<div
										style={{
											display: "grid",
											gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
											gap: "16px",
											width: "100%",
										}}
									>
										{...students.sort((a, b) => a.displayName.localeCompare(b.displayName))
											.filter((e) => e.id !== userData?.id)
											.map((student: any) => {
												const matchingResponse = classData.poll.responses.find(
													(e: any) => e.answer === student.pollRes?.buttonRes,
												);
												return (
													<div
														key={student.id}
														style={{
															border: "1px solid var(--border-color)",
															borderRadius: "8px",
															padding: "12px",
															background: isDark ? "#fff2" : "#0002",
															minHeight: "80px",
															display: "flex",
															flexDirection: "column",
															justifyContent: "center",
															position: "relative",
														}}
													>
														<strong style={{paddingRight: 40}}>
															{student.displayName}
														</strong>
                                                        <Tooltip title="Allow Vote">
                                                            <Switch 
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 20,
                                                                    right: 20,
                                                                }}
                                                                size="small"
                                                            />
                                                        </Tooltip>
														<span style={{ color: matchingResponse?.color }}>
															{student.pollRes?.buttonRes
																? student.pollRes.buttonRes
																: "No Response"}
														</span>
														<span style={{ opacity: 0.75, display: classData?.poll.allowTextResponses ? 'initial' : 'none', fontSize: 16 }}>
															{student.pollRes?.textRes
															? student.pollRes.textRes
															: "No Text"}
														</span>
													</div>
												);
											})}
									</div>
								) : (
									<p>No active poll.</p>
								)}
							</Modal>
							<Tooltip title="Sort & Filter">
								<Popover
									placement="bottomLeft"
									trigger={"click"}
									title="Sort & Filter Options"
									content={
										<Flex vertical gap={10}>
                                            <Flex vertical gap={10}>
                                                <p>Sort by:</p>
                                                <Select
                                                    style={{ width: "100%" }}
                                                    value={sortState}
                                                    onChange={(value) =>
                                                        setSortState(value)
                                                    }
                                                >
                                                    <Select.Option value="Name ▲">
                                                        Name ▲
                                                    </Select.Option>
                                                    <Select.Option value="Name ▼">
                                                        Name ▼
                                                    </Select.Option>
                                                    <Select.Option value="Permissions ▲">
                                                        Permissions ▲
                                                    </Select.Option>
                                                    <Select.Option value="Permissions ▼">
                                                        Permissions ▼
                                                    </Select.Option>
                                                    <Select.Option value="Response Order ▲">
                                                        Response Order ▲
                                                    </Select.Option>
                                                    <Select.Option value="Response Order ▼">
                                                        Response Order ▼
                                                    </Select.Option>
                                                    <Select.Option value="Response Time ▲">
                                                        Response Time ▲
                                                    </Select.Option>
                                                    <Select.Option value="Response Time ▼">
                                                        Response Time ▼
                                                    </Select.Option>
                                                    <Select.Option value="Response Text ▲">
                                                        Response Text ▲
                                                    </Select.Option>
                                                    <Select.Option value="Response Text ▼">
                                                        Response Text ▼
                                                    </Select.Option>
                                                    <Select.Option value="Help Time ▲">
                                                        Help Time ▲
                                                    </Select.Option>
                                                    <Select.Option value="Help Time ▼">
                                                        Help Time ▼
                                                    </Select.Option>
                                                </Select>
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
										style={{ height: "60%" }}
									>
										<IonIcon icon={IonIcons.swapVertical} />
									</Button>
								</Popover>
							</Tooltip>
							<Input
								placeholder="Search students"
								style={{ height: "60%", width: "300px" }}
								size="large"
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</Flex>
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fill, minmax(200px, 1fr))",
								gap: "16px",
								width: "100%",
							}}
						>
							{displayedStudents
								.filter((student) =>
									student.displayName
										.toLowerCase()
										.includes(searchQuery.toLowerCase()),
								)
								.map((student: any) =>
									student.id !== userData?.id ? (
										<StudentObject
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
			)}
		</>
	);
}

const style = {
	filterButton: {
		color: "white",
	},
	filterButtonOff: {
		color: "red",
	},
};
