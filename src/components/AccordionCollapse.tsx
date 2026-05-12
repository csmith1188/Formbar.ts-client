import { Button, Flex, InputNumber, Modal, Select, Tag, Tooltip, notification } from "antd";
import { Activity, useState, useEffect, useRef } from "react";
import { textColorForBackground } from "@utils/GlobalFunctions";
import { type Student } from "@/types";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { useClassData, useUserData } from "@/main";

import { awardDigipogs as awardDigipogAPICall }  from "@api/digipogApi";
import { approveStudentBreak, banClassStudent, deleteHelpRequest, denyStudentBreak, endStudentBreak, kickClassStudent } from "@api/classApi";
import { addRoleToStudent, removeRoleFromStudent } from "@api/rolesApi";
import { currentUserHasScope } from "@utils/scopeUtils";

type AccordionCategory = {
	name: string;
	icon: string;
	content: React.ReactNode;
	enabled: boolean;
};



export default function AccordionCollapse({
	categories,
	isOpen = false,
}: {
	categories: AccordionCategory[];
	isOpen?: boolean;
}) {
    
	const [currentIndex, setCurrentIndex] = useState<number | null>(null);
	const [expanded, setExpanded] = useState<boolean>(false);
	const wasOpenRef = useRef(false);

	const firstEnabledIndex = categories.findIndex((category) => category.enabled);

	useEffect(() => {
		if (isOpen && (!wasOpenRef.current || currentIndex === null)) {
			setCurrentIndex(firstEnabledIndex === -1 ? null : firstEnabledIndex);
			setExpanded(firstEnabledIndex !== -1);
		}

		if (!isOpen && wasOpenRef.current) {
			setExpanded(false);
			setCurrentIndex(null);
		}

		wasOpenRef.current = isOpen;
	}, [isOpen, firstEnabledIndex, currentIndex]);

	// Auto-switch when current category becomes disabled
	useEffect(() => {
		if (currentIndex === null || !expanded) return;

		// Check if current category is disabled
		if (!categories[currentIndex]?.enabled) {
			// Find next enabled category (searching forward first, then backward)
			let nextIndex: number | null = null;

			// Search forward
			for (let i = currentIndex + 1; i < categories.length; i++) {
				if (categories[i]?.enabled) {
					nextIndex = i;
					break;
				}
			}

			// If not found, search backward
			if (nextIndex === null) {
				for (let i = currentIndex - 1; i >= 0; i--) {
					if (categories[i]?.enabled) {
						nextIndex = i;
						break;
					}
				}
			}

			// Update state based on result
			if (nextIndex !== null) {
				setCurrentIndex(nextIndex);
			} else {
				// No enabled categories, collapse the accordion
				setExpanded(false);
				setCurrentIndex(null);
			}
		}
	}, [categories, currentIndex, expanded]);

	const baseColors = [
		"#ff6860",
		"#ff8f40",
		"#ffdf40",
		"#80ff80",
		"#bfcfff",
		"#df80ff",
		"#ff80bf",
	];

	function interpolateColor(
		color1: string,
		color2: string,
		t: number,
	): string {
		const r1 = parseInt(color1.slice(1, 3), 16);
		const g1 = parseInt(color1.slice(3, 5), 16);
		const b1 = parseInt(color1.slice(5, 7), 16);

		const r2 = parseInt(color2.slice(1, 3), 16);
		const g2 = parseInt(color2.slice(3, 5), 16);
		const b2 = parseInt(color2.slice(5, 7), 16);

		const r = Math.round(r1 + (r2 - r1) * t);
		const g = Math.round(g1 + (g2 - g1) * t);
		const b = Math.round(b1 + (b2 - b1) * t);

		return (
			"#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
		);
	}

	function generateColors(count: number): string[] {
		if (count <= 7) {
			return baseColors.slice(0, count);
		}

		const colors: string[] = [];

		if (count === 8) {
			colors.push(baseColors[0]);
			colors.push(baseColors[1]);
			colors.push(baseColors[2]);
			colors.push(baseColors[3]);
			colors.push(interpolateColor(baseColors[3], baseColors[4], 0.5));
			colors.push(baseColors[4]);
			colors.push(baseColors[5]);
			colors.push(baseColors[6]);
		} else if (count === 9) {
			colors.push(baseColors[0]);
			colors.push(baseColors[1]);
			colors.push(baseColors[2]);
			colors.push(interpolateColor(baseColors[2], baseColors[3], 0.5));
			colors.push(baseColors[3]);
			colors.push(interpolateColor(baseColors[3], baseColors[4], 0.5));
			colors.push(baseColors[4]);
			colors.push(baseColors[5]);
			colors.push(baseColors[6]);
		} else {
			for (let i = 0; i < count; i++) {
				const position = (i / (count - 1)) * (baseColors.length - 1);
				const lowerIndex = Math.floor(position);
				const upperIndex = Math.ceil(position);
				const t = position - lowerIndex;

				if (lowerIndex === upperIndex) {
					colors.push(baseColors[lowerIndex]);
				} else {
					colors.push(
						interpolateColor(
							baseColors[lowerIndex],
							baseColors[upperIndex],
							t,
						),
					);
				}
			}
		}

		return colors;
	}

	function colorIndex(index: number): string {
		const colors = generateColors(categories.length);
		return colors[index];
	}

	return (
		<>
			<Flex vertical style={{ width: "min-content" }}>
				<Flex gap={5}>
					{categories &&
						categories.map((category, index) => (
							<Tooltip
                                mouseEnterDelay={0.5}
								key={index}
								title={category.name}
								color={colorIndex(index)}
							>
								<Button
									key={index}
									style={{
										backgroundColor: colorIndex(index),
										width: "48px",
										height:
											currentIndex === index && expanded
												? "56px"
												: "48px",
										border: "none",
										borderRadius: "8px",
										boxShadow:
											"0 3px 0px " +
											colorIndex(index) +
											"55",
										transition: "all 0.2s ease-in-out",
										borderBottomLeftRadius:
											currentIndex === index && expanded
												? "0px"
												: "8px",
										borderBottomRightRadius:
											currentIndex === index && expanded
												? "0px"
												: "8px",
										opacity: category.enabled ? 1 : 0.5,
										scale: category.enabled ? 1 : 0.95,
									}}
									shape="circle"
									onClick={() => {
										if (currentIndex === index) {
											setExpanded(!expanded);
										} else {
											setCurrentIndex(index);
											setExpanded(true);
										}
									}}
									disabled={!category.enabled}
								>
									<IonIcon
										icon={category.icon}
										style={{
											fontSize: "30px",
											color: "black",
											margin: "8px",
										}}
									/>
								</Button>
							</Tooltip>
						))}
				</Flex>
				<Flex
					style={{
						width: "100%",
						background: colorIndex(currentIndex ?? 0),
						color: textColorForBackground(
							colorIndex(currentIndex ?? 0),
						),
						borderRadius: "6px",
						borderTopLeftRadius: currentIndex === 0 ? "0px" : "6px",
						borderTopRightRadius:
							currentIndex ===
							(categories ? categories.length - 1 : 0)
								? "0px"
								: "6px",
						overflow: "hidden",
						height: expanded ? "100px" : "0px",
						boxShadow: "0 3px 6px #00000055",
						transition: "height 0.2s ease-in-out",
						padding: expanded ? "10px" : "0px",
					}}
				>
					{categories &&
						categories.map((category, index) => (
							<Activity
								key={index}
								mode={
									currentIndex === index && expanded
										? "visible"
										: "hidden"
								}
							>
								{category.content}
							</Activity>
						))}
				</Flex>
			</Flex>
		</>
	);
}

export function StudentAccordion({ studentData, isOpen = false }: { studentData: Student; isOpen?: boolean }) {
	const { classData } = useClassData();
	const { userData } = useUserData();

	const [awardDigipogs, setAwardDigipogs] = useState<number>(0);
	const [studentRoleIds, setStudentRoleIds] = useState<number[]>([]);
	const [isUpdatingRoles, setIsUpdatingRoles] = useState<boolean>(false);

	const [api, contextHolder] = notification.useNotification();
    const [modal, contextHolderModal] = Modal.useModal();

	const showSuccessNotification = (message: string, title: string) => {
		api["success"]({
			title: title,
			description: message,
			placement: "bottom",
		});
	};

	const showErrorNotification = (message: string) => {
		api["error"]({
			title: "Error",
			description: message,
			placement: "bottom",
		});
	};

	useEffect(() => {
		setStudentRoleIds((studentData.roles?.class || []).map((role) => Number(role.id)));
	}, [studentData]);

	async function handleStudentRolesChange(nextRoleIds: number[]) {
		if (!classData) return;

		const previousRoleIds = studentRoleIds;
		const rolesToAdd = nextRoleIds.filter((id) => !previousRoleIds.includes(id));
		const rolesToRemove = previousRoleIds.filter((id) => !nextRoleIds.includes(id));

		setStudentRoleIds(nextRoleIds);
		setIsUpdatingRoles(true);

		try {
			await Promise.all([
				...rolesToAdd.map((roleId) =>
					addRoleToStudent(classData.id, roleId, studentData.id),
				),
				...rolesToRemove.map((roleId) =>
					removeRoleFromStudent(classData.id, roleId, studentData.id),
				),
			]);

			studentData.roles = studentData.roles || { global: [], class: [] };
			studentData.roles.class = nextRoleIds
				.map((roleId) => {
					const classRole = classData.roles.find((role) => role.id === Number(roleId));
					if (!classRole) return null;
					return {
						id: Number(classRole.id),
						name: classRole.name,
					};
				})
				.filter((role): role is { id: number; name: string } => role !== null);
		} catch {
			setStudentRoleIds(previousRoleIds);
			showErrorNotification("Failed to update student roles.");
		} finally {
			setIsUpdatingRoles(false);
		}
	}

    function awardDigipogsAPI(studentId: number, amount: number) {
        
        awardDigipogAPICall({
            studentId,
            amount,
        })
        .then((data) => {
            if (data.success) {
                showSuccessNotification(`Awarded ${amount} digipogs to student.`, "Awarded Digipogs");
            } else {
                showErrorNotification("Failed to award digipogs.");
            }
        })
        .catch(() => {
            showErrorNotification("Failed to award digipogs.");
        });        
    }

	const availableRoles = classData?.roles || [];
	const roleOptions = availableRoles.map((role) => ({
		value: Number(role.id),
		label: role.name,
		color: role.color,
	}));

	const canManageHelp = currentUserHasScope(userData, "class.help.approve");
	const canManageBreak = currentUserHasScope(userData, "class.break.approve");
	const canEndBreaks = currentUserHasScope(userData, "class.break.end");

	const canAssignRoles = currentUserHasScope(userData, "class.roles.assign");
	
	const canAwardDigipogs = currentUserHasScope(userData, "class.digipogs.award");

	const canKick = currentUserHasScope(userData, "class.students.kick");
	const canBan = currentUserHasScope(userData, "class.students.ban");

	return (
        <>{contextHolder}
		<AccordionCollapse
			isOpen={isOpen}
			categories={[
				{
					name: "Help",
					icon: IonIcons.handRightOutline,
					content: (
						<Flex
							vertical
							justify="center"
							align="center"
							style={{ width: "100%", height: "100%" }}
							gap={10}
						>
							<p>
								{studentData.help.reason
									? studentData.help.reason
									: ""}
							</p>
							<Button
								variant="solid"
								color="red"
								onClick={async () => {
									if (!canManageHelp) return;
                                    await deleteHelpRequest(classData?.id!, studentData.id)
                                    .then((data) => {
                                        if(data.success) {
                                            showSuccessNotification("Deleted help ticket.", "Deleted Help Ticket");
                                            return;
                                        }
                                        showErrorNotification("Failed to delete help ticket.");
                                    });
								}}
							>
								Delete
							</Button>
						</Flex>
					),
					enabled:
						typeof studentData.help === "object" ? true : false && canManageHelp,
				},
				{
					name: "Break",
					icon: IonIcons.umbrellaOutline,
					content: (
						<Flex
							vertical
							justify="center"
							align="center"
							style={{ width: "100%", height: "100%" }}
							gap={10}
						>
							{typeof studentData.break === "string" ? (
								<>
									<p>"{studentData.break}"</p>
									<Flex gap={10}>
										<Button
											variant="solid"
											color="green"
											style={{ width: "120px" }}
											onClick={() => {
												if (!canManageBreak) return;
												approveStudentBreak(classData?.id!, studentData.id);
											}}
										>
											Approve
										</Button>
										<Button
											variant="solid"
											color="red"
											style={{ width: "120px" }}
											onClick={() => {
												if (!canManageBreak) return;
												denyStudentBreak(classData?.id!, studentData.id);
											}}
										>
											Deny
										</Button>
									</Flex>
								</>
							) : (
								<Button
									variant="solid"
									color="red"
									style={{ width: "120px" }}
									onClick={() => {
										if (!canEndBreaks) return;
										endStudentBreak(classData?.id!, studentData.id);
									}}
								>
									End Break
								</Button>
							)}
						</Flex>
					),
					enabled: studentData.break !== false && canManageBreak,
				},
				{
					name: "Text Response",
					icon: IonIcons.textOutline,
					content: <p>{studentData.pollRes.textRes}</p>,
					enabled: studentData.pollRes.textRes && classData?.poll.allowTextResponses,
				},
				{
					name: "Digipogs",
					icon: IonIcons.cashOutline,
					content: (
						<Flex
							justify="center"
							align="center"
							style={{ width: "100%", height: "100%" }}
							gap={10}
						>
							<InputNumber
								placeholder="Digipogs"
								style={{ width: "120px" }}
								onInput={(e) => {
									if (e !== null)
										setAwardDigipogs(
											parseInt(e.toString()),
										);
								}}
							/>
							<Button
								variant="solid"
								color="blue"
								style={{ width: "120px" }}
								onClick={() => {
									awardDigipogsAPI(studentData.id, awardDigipogs);
								}}
							>
								Award
							</Button>
						</Flex>
					),
					enabled: canAwardDigipogs,
				},
				{
					name: "Roles",
					icon: IonIcons.lockClosedOutline,
					content: (
						<Flex
							justify="center"
							align="center"
							style={{ width: "100%", height: "100%" }}
							gap={10}
						>
							<Select
								mode="multiple"
								style={{ width: "100%", maxWidth: "420px" }}
								styles={{
									suffix: {
										pointerEvents: "none",
									}
								}}
								placeholder="Add or remove roles"
								suffix={null}

								value={studentRoleIds}
								loading={isUpdatingRoles}
								disabled={isUpdatingRoles || availableRoles.length === 0}
								onChange={handleStudentRolesChange}
								options={roleOptions}
								showSearch={
									{
										optionFilterProp: "label",
									}
								}
								tagRender={(props) => {
									const role = availableRoles.find(
										(availableRole) => availableRole.id === Number(props.value),
									);
									const roleColor = role?.color || "#666666";
									return (
										<Tag
											color={roleColor}
											style={{ marginInlineEnd: 4, color: roleColor, borderColor: "transparent" }}
											closable={props.closable}
											onClose={props.onClose}
											onMouseDown={(event) => {
												event.preventDefault();
												event.stopPropagation();
											}}
										>
											{role?.name || props.value}
										</Tag>
									);
								}}
								optionRender={(option) => (
									<Flex align="center" gap={8}>
										<span
											style={{
												width: 10,
												height: 10,
												borderRadius: "50%",
												display: "inline-block",
												backgroundColor: option.data.color,
											}}
										/>
										<span style={{ color: option.data.color, fontWeight: 500 }}>
											{option.data.label}
										</span>
									</Flex>
								)}
							/>
						</Flex>
					),
					enabled: canAssignRoles,
				},
				{
					name: "Miscellaneous",
					icon: IonIcons.banOutline,
					content: (
						<Flex
							justify="center"
							align="center"
							style={{ width: "100%", height: "100%" }}
							gap={10}
						>
							<Button
								variant="solid"
								color="red"
								style={{ width: "120px" }}
                                onClick={() => {
									if(!canBan) return;
                                    modal.warning({
                                        title: "Ban User",
                                        content: "Are you sure you want to ban this user?",
                                        okText: "Ban",
                                        centered: true,
                                        onOk: () => {
											if(!canBan) return;
											banClassStudent(classData?.id!, studentData.id);
                                        }
                                    });
                                }}
								disabled={!canBan}
							>
								Ban User
							</Button>
							<Button
								variant="solid"
								color="red"
								style={{ width: "120px" }}
								disabled={!canKick}
								onClick={() => {
									if(!canKick) return;
									kickClassStudent(classData?.id!, studentData.id);
								}}
							>
								Kick User
							</Button>
						</Flex>
					),
					enabled: canBan || canKick,
				},
			]}
		/>
        {contextHolderModal}
        </>
	);
}
