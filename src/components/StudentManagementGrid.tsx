import type { ClassData, CurrentUserData, Student } from "@/types";
import {
	Row,
	Col,
	Flex,
	Card,
	Typography,
	Button,
	Modal,
	InputNumber,
	Select,
	Tag,
} from "antd";
const { Text } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { currentUserHasScope } from "@utils/scopeUtils";
import {
	approveStudentBreak,
	banClassStudent,
	deleteHelpRequest,
	denyStudentBreak,
	endStudentBreak,
	kickClassStudent,
} from "@api/classApi";
import { awardDigipogs as awardDigipogAPICall } from "@api/digipogApi";
import { addRoleToStudent, removeRoleFromStudent } from "@api/rolesApi";
import { useEffect, useState } from "react";
import { themeColors } from "@/themes/ThemeConfig";
import { useTheme } from "@/main";
import { useSettings } from "@/main";
import { accessiblePollColor } from "@utils/accessibilityColors";
import { darkenButtonColor } from "@/utils/GlobalFunctions";
import { useGlobalMessage } from "@/components/providers/GlobalMessageProvider";
import { messageTemplates } from "@utils/messageTemplates";
import Log from "@utils/debugLogger";

export default function StudentManagementGrid({
	student,
	classData,
	userData,
}: {
	student: Student;
	classData: ClassData | null;
	userData: CurrentUserData;
}) {
	const { isDark } = useTheme();
	const { settings } = useSettings();
	const globalMessageAPI = useGlobalMessage();

	const [modal, contextHolderModal] = Modal.useModal();

	const canManageHelp = currentUserHasScope(userData, "class.help.approve");
	const canManageBreak = currentUserHasScope(userData, "class.break.approve");
	const canEndBreaks = currentUserHasScope(userData, "class.break.end");

	const canAssignRoles = currentUserHasScope(userData, "class.roles.assign");
	const [studentRoleIds, setStudentRoleIds] = useState<number[]>([]);
	const [isUpdatingRoles, setIsUpdatingRoles] = useState<boolean>(false);
	const availableRoles = classData?.roles || [];
	const roleOptions = availableRoles.map((role) => ({
		value: Number(role.id),
		label: role.name,
		color: role.color,
	}));

	const canKick = currentUserHasScope(userData, "class.students.kick");
	const canBan = currentUserHasScope(userData, "class.students.ban");

	type Category = {
		icon: string;
		color: string;
		title: string;
		description: string;

		children: any;
	};

	useEffect(() => {
		setStudentRoleIds(
			(student.roles?.class || []).map((role) => Number(role.id)),
		);
	}, [student]);

	async function handleStudentRolesChange(nextRoleIds: number[]) {
		if (!classData) return;

		const previousRoleIds = studentRoleIds;
		const rolesToAdd = nextRoleIds.filter(
			(id) => !previousRoleIds.includes(id),
		);
		const rolesToRemove = previousRoleIds.filter(
			(id) => !nextRoleIds.includes(id),
		);

		setStudentRoleIds(nextRoleIds);
		setIsUpdatingRoles(true);

		try {
			await Promise.all([
				...rolesToAdd.map((roleId) =>
					addRoleToStudent(classData.id, roleId, student.id),
				),
				...rolesToRemove.map((roleId) =>
					removeRoleFromStudent(classData.id, roleId, student.id),
				),
			]);

			student.roles = student.roles || { global: [], class: [] };
			student.roles.class = nextRoleIds
				.map((roleId) => {
					const classRole = classData.roles.find(
						(role) => role.id === Number(roleId),
					);
					if (!classRole) return null;
					return {
						id: Number(classRole.id),
						name: classRole.name,
					};
				})
				.filter(
					(role): role is { id: number; name: string } =>
						role !== null,
				);
			globalMessageAPI.success(
				messageTemplates.user_roles_updated_success,
			);
		} catch {
			setStudentRoleIds(previousRoleIds);
		} finally {
			setIsUpdatingRoles(false);
		}
	}

	const categories: Category[] = [
		{
			icon: IonIcons.handRightOutline,
			color: "#ff6860",
			title: "Help Ticket",
			description: "View and delete this user's help ticket.",
			children: (
				<Flex
					vertical
					justify="center"
					align="center"
					style={{ width: "100%", height: "100%" }}
					gap={10}
				>
					{student.help !== false ? (
						<>
							<Text
								type="secondary"
								style={{
									width: "100%",
									fontWeight: 300,
									fontSize: "16px",
								}}
							>
								Ticket Message
							</Text>
							<Card
								style={{
									width: "100%",
								}}
								styles={{ body: { padding: 8 } }}
								variant="outlined"
							>
								<Text>
									{student.help.reason
										? student.help.reason
										: ""}
								</Text>
							</Card>
							<Flex style={{ width: "100%" }}>
								<Flex
									align="center"
									style={{ marginRight: "auto" }}
								>
									<IonIcon icon={IonIcons.timeOutline} />
									<Text
										type="secondary"
										style={{
											width: "100%",
											fontWeight: 300,
											fontSize: "12px",
											marginLeft: 4,
										}}
									>
										Created at:{" "}
										{new Date(
											student.help.time,
										).toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										}) +
											" at " +
											new Date(
												student.help.time,
											).toLocaleTimeString("en-US", {
												hour: "numeric",
												minute: "2-digit",
											})}
									</Text>
								</Flex>
								<Button
									variant="outlined"
									color="red"
									onClick={async () => {
										if (!canManageHelp) return;
										await deleteHelpRequest(
											classData?.id!,
											student.id,
										).then((data) => {
											if (data.success) {
												globalMessageAPI.success(
													messageTemplates.user_helpTicket_deleted_success,
												);
												return;
											}
											globalMessageAPI.error(
												messageTemplates.user_helpTicket_delete_failed,
											);
										});
									}}
								>
									Delete
								</Button>
							</Flex>
						</>
					) : (
						<>
							<Text
								type="secondary"
								style={{ fontWeight: 300, fontSize: "16px" }}
							>
								No Help Ticket
							</Text>
						</>
					)}
				</Flex>
			),
		},
		{
			icon: IonIcons.umbrellaOutline,
			color: "#ff8f40",
			title: "Break Request",
			description: "Manage a user's break",
			children: (
				<Flex
					vertical
					justify="center"
					align="center"
					style={{ width: "100%", height: "100%" }}
					gap={10}
				>
					{student.break !== false ? (
						<>
							<Text
								type="secondary"
								style={{
									width: "100%",
									fontWeight: 300,
									fontSize: "16px",
								}}
							>
								Request Reason
							</Text>
							<Card
								style={{
									width: "100%",
								}}
								styles={{ body: { padding: 8 } }}
								variant="outlined"
							>
								<Text>
									{student.break ? student.break : ""}
								</Text>
							</Card>
							{typeof student.break === "string" ? (
								<>
									<Flex gap={10}>
										<Button
											variant="outlined"
											color="green"
											style={{ width: "120px" }}
											onClick={() => {
												if (!canManageBreak) return;
												approveStudentBreak(
													classData?.id!,
													student.id,
												)
													.then((response) => {
														if (
															response?.success ===
																false ||
															response?.error
														) {
															globalMessageAPI.error(
																messageTemplates.user_break_approve_failed,
															);
															return;
														}
														globalMessageAPI.success(
															messageTemplates.user_break_approved_success,
														);
													})
													.catch((error) =>
														Log({
															message:
																"Error approving break",
															data: error,
															level: "error",
														}),
													);
											}}
										>
											Approve
										</Button>
										<Button
											variant="outlined"
											color="red"
											style={{ width: "120px" }}
											onClick={() => {
												if (!canManageBreak) return;
												denyStudentBreak(
													classData?.id!,
													student.id,
												)
													.then((response) => {
														if (
															response?.success ===
																false ||
															response?.error
														) {
															globalMessageAPI.error(
																messageTemplates.user_break_deny_failed,
															);
															return;
														}
														globalMessageAPI.success(
															messageTemplates.user_break_denied_success,
														);
													})
													.catch((error) =>
														Log({
															message:
																"Error denying break",
															data: error,
															level: "error",
														}),
													);
											}}
										>
											Deny
										</Button>
									</Flex>
								</>
							) : (
								<>
									<Flex style={{ width: "100%" }}>
										{/* <Flex align="center" style={{marginRight: 'auto'}}>
											<IonIcon icon={IonIcons.timeOutline} />
											<Text type="secondary" style={{width: '100%', fontWeight: 300, fontSize: "16px", marginLeft: 4}}>Created at: {new Date(student.break.time).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + " at "  + new Date(student.break.time).toLocaleTimeString("en-US", {hour: 'numeric', minute: '2-digit'})}</Text>
										</Flex> */}
										<Button
											variant="outlined"
											color="red"
											style={{ margin: "auto" }}
											onClick={() => {
												if (!canEndBreaks) return;
												endStudentBreak(
													classData?.id!,
													student.id,
												)
													.then((response) => {
														if (
															response?.success ===
																false ||
															response?.error
														) {
															globalMessageAPI.error(
																messageTemplates.user_break_end_failed,
															);
															return;
														}
														globalMessageAPI.success(
															messageTemplates.user_break_ended_success,
														);
													})
													.catch((error) =>
														Log({
															message:
																"Error ending break",
															data: error,
															level: "error",
														}),
													);
											}}
										>
											End Break
										</Button>
									</Flex>
								</>
							)}
						</>
					) : (
						<>
							<Text
								type="secondary"
								style={{ fontWeight: 300, fontSize: "16px" }}
							>
								No Break
							</Text>
						</>
					)}
				</Flex>
			),
		},
		{
			icon: IonIcons.textOutline,
			color: "#ffdf40",
			title: "Response",
			description: "The user's current poll response.",
			children: (() => {
				const selectedResponses = Array.isArray(
					student.pollRes?.buttonRes,
				)
					? student.pollRes.buttonRes
					: student.pollRes?.buttonRes
						? [student.pollRes.buttonRes]
						: [];
				const textResponse = student.pollRes?.textRes?.trim();

				return (
					<Flex vertical gap={12}>
						{selectedResponses.length > 0 ? (
							<>
								<Text
									type="secondary"
									style={{
										display: "block",
										marginBottom: 6,
										fontSize: 12,
									}}
								>
									Selected answers
								</Text>
								<Flex wrap gap={8}>
									{selectedResponses.map(
										(res: string, index: number) => {
											const answerIndex =
												classData?.poll.responses.findIndex(
													(response) =>
														response.answer === res,
												) ?? -1;
											const answerColor =
												accessiblePollColor(
													classData?.poll.responses[
														answerIndex
													]?.color,
													settings.accessibility
														.colorVisionMode,
													answerIndex,
												);

											return (
												<Tag
													key={`${res}-${index}`}
													color={answerColor}
													style={{
														margin: 0,
														paddingInline: 10,
														background:
															darkenButtonColor(
																answerColor ||
																	"#666666",
																200,
															),
													}}
												>
													{res}
												</Tag>
											);
										},
									)}
								</Flex>
							</>
						) : (
							<Text
								type="secondary"
								style={{
									fontWeight: 300,
									fontSize: "16px",
									textAlign: "center",
								}}
							>
								No Answer
							</Text>
						)}
						{classData?.poll.allowTextResponses && textResponse ? (
							<>
								<Text
									type="secondary"
									style={{ display: "block", fontSize: 12 }}
								>
									Text Response
								</Text>
								<Text>{textResponse}</Text>
							</>
						) : null}
					</Flex>
				);
			})(),
		},
		{
			icon: IonIcons.lockClosedOutline,
			color: "#bfcfff",
			title: "Roles",
			description: "Manage roles for this user.",
			children: (
				<>
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
								},
							}}
							placeholder="Add or remove roles"
							suffix={null}

							value={studentRoleIds}
							loading={isUpdatingRoles}
							disabled={
								isUpdatingRoles ||
								availableRoles.length === 0 ||
								!canAssignRoles
							}
							onChange={(e) => {
								if (!canAssignRoles) return;
								handleStudentRolesChange(e);
							}}
							options={roleOptions}
							showSearch={{
								optionFilterProp: "label",
							}}
							tagRender={(props) => {
								const role = availableRoles.find(
									(availableRole) =>
										availableRole.id ===
										Number(props.value),
								);
								const roleColor = role?.color || "#666666";
								return (
									<Tag
										color={roleColor}
										style={{
											marginInlineEnd: 4,
											color: roleColor,
											borderColor: "transparent",
											background:
												themeColors[
													isDark ? "dark" : "light"
												].roleTag.background,
										}}
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
									<span
										style={{
											color: option.data.color,
											fontWeight: 500,
										}}
									>
										{option.data.label}
									</span>
								</Flex>
							)}
						/>
					</Flex>
				</>
			),
		},
		{
			icon: IonIcons.banOutline,
			color: "#df80ff",
			title: "Management",
			description: "Manage this user.",
			children: (
				<>
					<Flex
						justify="center"
						align="center"
						style={{ width: "100%", height: "100%" }}
						gap={10}
					>
						<Button
							variant="outlined"
							color="red"
							style={{ width: "120px" }}
							onClick={() => {
								if (!canBan) return;
								modal.warning({
									title: "Ban User",
									content:
										"Are you sure you want to ban this user?",
									okText: "Ban",
									centered: true,
									onOk: () => {
										if (!canBan) return;
										banClassStudent(
											classData?.id!,
											student.id,
										)
											.then((response) => {
												if (
													response?.success ===
														false ||
													response?.error
												) {
													globalMessageAPI.error(
														messageTemplates.user_ban_failed,
													);
													return;
												}
												globalMessageAPI.success(
													messageTemplates.user_ban_success(
														student.id,
													),
												);
											})
											.catch((error) =>
												Log({
													message:
														"Error banning user",
													data: error,
													level: "error",
												}),
											);
									},
								});
							}}
							disabled={!canBan}
						>
							Ban User
						</Button>
						<Button
							variant="outlined"
							color="red"
							style={{ width: "120px" }}
							disabled={!canKick}
							onClick={() => {
								if (!canKick) return;
								kickClassStudent(classData?.id!, student.id)
									.then((response) => {
										if (
											response?.success === false ||
											response?.error
										) {
											globalMessageAPI.error(
												messageTemplates.user_kick_failed,
											);
											return;
										}
										globalMessageAPI.success(
											messageTemplates.user_kick_success(
												student.id,
											),
										);
									})
									.catch((error) =>
										Log({
											message: "Error kicking user",
											data: error,
											level: "error",
										}),
									);
							}}
						>
							Kick User
						</Button>
					</Flex>
				</>
			),
		},
	];

	function createGridItem(category: Category) {
		return (
			<Col xs={24} sm={12} lg={8}>
				<Card
					styles={{
						header: {
							padding: 0,
							background: isDark
								? undefined
								: `${category.color}0d`,
							borderBottom: `1px solid ${category.color}${isDark ? "18" : "35"}`,
						},
						body: {
							padding: "12px 16px",
							background: isDark ? undefined : "#ffffffb8",
						},
					}}
					style={{
						height: "100%",
						background: isDark ? undefined : "#ffffffd9",
						border: `1px solid ${category.color}${isDark ? "55" : "75"}`,
						borderTop: `3px solid ${category.color}`,
					}}
					title={
						<Flex vertical style={{ padding: 8 }}>
							<Flex align="center">
								<IonIcon
									icon={category.icon}
									style={{
										fontSize: "30px",
										color: category.color,
										margin: "4px 8px 4px 4px",
										padding: 6,
										borderRadius: 8,
										background: `${category.color}${isDark ? "18" : "20"}`,
									}}
								/>
								<Text strong style={{ fontSize: 16 }}>
									{category.title}
								</Text>
							</Flex>
							<Text
								type="secondary"
								style={{
									fontWeight: 400,
									fontSize: 14,
									paddingLeft: 8,
								}}
							>
								{category.description}
							</Text>
						</Flex>
					}
				>
					{category.children}
				</Card>
			</Col>
		);
	}

	return (
		<>
			{contextHolderModal}
			<Row gutter={[12, 12]} align="stretch" style={{justifyContent: 'center'}}>
				{categories.map((category) => createGridItem(category))}
			</Row>
		</>
	);
}
