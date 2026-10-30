import {
	Flex,
	QRCode,
	Typography,
	Input,
	Button,
	Space,
	Divider,
	Collapse,
	Modal,
	Tooltip,
	Card,
	Select,
	AutoComplete,
	Row,
	Col,
} from "antd";
const { Title, Text } = Typography;
import {
	getAppearAnimation,
	useClassData,
	useMobileDetect,
	useTheme,
	useUserData,
	useSettings,
} from "@/main";
import { useEffect, useState } from "react";
import Log from "@utils/debugLogger";
import {
	createClassLink,
	deleteClass,
	deleteClassLink,
	getAllClassLinks,
	getBannedClassStudents,
	kickAllStudents,
	regenerateClassCode,
	updateSettings,
} from "@api/classApi";
import { currentUserHasScope } from "@/utils/scopeUtils";
import type { Student } from "@/types";
import { useGlobalMessage } from "@/components/providers/GlobalMessageProvider";
import { messageTemplates } from "@utils/messageTemplates";
import CustomPagination from "@components/CustomPagination";
import StudentObject from "../StudentObject";

type BannedClassStudent = {
	id: number,
	email: string,
	displayName: string
};

export default function SettingsMenu() {
	const { settings } = useSettings();
	const frontendUrl =
		import.meta.env.VITE_FORMBAR_CLIENT_URL || "http://localhost:5173";
	const { userData } = useUserData();
	const { classData } = useClassData();
	const globalMessageAPI = useGlobalMessage();
	const isMobile = useMobileDetect();

	// const canManageSettings = currentUserHasScope(userData, 'class.session.settings');
	const canManageUsers =
		currentUserHasScope(userData, "class.students.ban") ||
		currentUserHasScope(userData, "class.students.kick");
	const canReadUsers = currentUserHasScope(userData, "class.students.read");
	const canManageLinks = currentUserHasScope(userData, "class.links.manage");
	const canDeleteClass = currentUserHasScope(
		userData,
		"class.system.can_delete_class",
	);
	const canKickStudents = currentUserHasScope(
		userData,
		"class.students.kick",
	);
	const canRegenerateCode = currentUserHasScope(
		userData,
		"class.session.regenerate_code",
	);
	const canRenameClass = currentUserHasScope(
		userData,
		"class.system.can_rename_class",
	);

	const [isQRModalOpen, setIsQRModalOpen] = useState(false);
	const [defaultRoleId, setDefaultRoleId] = useState<number | undefined>(
		undefined,
	);

	const [openModalId, setOpenModalId] = useState<number | null>(null);

	const [newLinkInput, setNewLinkInput] = useState<{
		name: string;
		url: string;
	}>({ name: "", url: "" });

	const [bannedStudents, setBannedStudents] = useState<BannedClassStudent[]>(
		[],
	);
	const [bannedSearchQuery, setBannedSearchQuery] = useState("");

	const [bannedCurrentPage, setBannedCurrentPage] = useState(1);
	const [bannedPageSize, setBannedPageSize] = useState(10);
	const [totalBannedUsers, setTotalBannedUsers] = useState(0);
	const [isBannedLoading, setIsBannedLoading] = useState(false);

	const [linkType, setLinkType] = useState<string>("https://")

	const defaultLinkTypes = [
		"https://",
		"http://",
		"ws://"
	];

	const [modal, contextHolderModal] = Modal.useModal();

	const students =
		classData && classData.students
			? (Object.values(classData.students) as Student[])
			: [];

	const [classLinks, setClassLinks] = useState<
		{ name: string; url: string }[]
	>([]);

	useEffect(() => {
		if (!classData) return;

		if (canManageLinks) {
			getAllClassLinks(classData.id)
				.then((links) => {
					setClassLinks(links);
				})
				.catch((err) => {
					Log({
						message: "Error fetching class links:",
						data: err,
						level: "error",
					});
				});
		}
	}, [classData]);

	useEffect(() => {
		setDefaultRoleId(classData?.settings?.defaultRoleId ?? undefined);
	}, [classData]);

	function updateDefaultRole(roleId: number) {
		if (!classData) return;

		const previousRoleId = defaultRoleId;
		setDefaultRoleId(roleId);
		updateSettings(classData.id, { defaultRoleId: roleId })
			.then((response) => {
				if (response?.success === false || response?.error) {
					setDefaultRoleId(previousRoleId);
					globalMessageAPI.error(
						"Failed to update the default role.",
					);
				}
			})
			.catch((error) => {
				setDefaultRoleId(previousRoleId);
				Log({
					message: "Error updating default role:",
					data: error,
					level: "error",
				});
				globalMessageAPI.error("Failed to update the default role.");
			});
	}

	

	useEffect(() => {
		if (!classData || !canManageUsers) {
			setBannedStudents([]);
			return;
		}

		setIsBannedLoading(true);
		getBannedClassStudents(classData.id)
			.then((response: any) => {
				const bannedList = response?.data.banned;
						
				setBannedStudents(bannedList);
				setTotalBannedUsers(bannedList.length)
			})
			.catch((err) => {
				Log({
					message: "Error fetching banned students:",
					data: err,
					level: "error",
				});
			})
			.finally(() => {
				setIsBannedLoading(false);
			});
	}, [classData, canManageUsers]);

	function tryAddLink() {
		if (!canManageLinks) {
			globalMessageAPI.error(
				messageTemplates.class_links_permission_error,
			);
			return;
		}

		if (!newLinkInput.name || !newLinkInput.url) {
			globalMessageAPI.error(
				messageTemplates.class_links_fields_required_error,
			);
			return;
		}

		let fixedLink = {
			name: newLinkInput.name,
			url: linkType + newLinkInput.url.replace(/^https?:\/\//, ""),
		};

		createClassLink(classData!.id, fixedLink)
			.then((data) => {
				if (data.success && !data.error) {
					setClassLinks([...classLinks, fixedLink]);
					setNewLinkInput({ name: "", url: "" });
					globalMessageAPI.success(
						messageTemplates.class_links_added_success,
					);
				} else {
					globalMessageAPI.error(
						messageTemplates.class_links_add_failed,
					);
				}
			})
			.catch((error) =>
				Log({
					message: "Error adding link:",
					data: error,
					level: "error",
				}),
			);
	}

	function removeLink(linkToRemove: { name: string; url: string }) {
		if (!canManageLinks) {
			globalMessageAPI.error(
				messageTemplates.class_links_permission_error,
			);
			return;
		}

		deleteClassLink(classData!.id, linkToRemove.name)
			.then((data) => {
				if (data.success && !data.error) {
					setClassLinks(
						classLinks.filter(
							(link) => link.url !== linkToRemove.url,
						),
					);
					globalMessageAPI.success(
						messageTemplates.class_links_removed_success,
					);
				} else {
					globalMessageAPI.error(
						messageTemplates.class_links_remove_failed,
					);
				}
			})
			.catch((error) =>
				Log({
					message: "Error removing link:",
					data: error,
					level: "error",
				}),
			);
	}

	const { isDark } = useTheme();

	return (
		<>
			{contextHolderModal}
			<Flex
				vertical
				style={{ width: "100%", minWidth: 0, padding: 20 }}
			>
				<Title style={{ marginBottom: "0" }}>Settings</Title>
				<Divider />

				<Card title={(
					<>
						<Title level={3} style={{ margin: 0 }}>
							General{isMobile ? "" : " Settings"}
						</Title>
					</>
				)}
					extra={(
						<Text
							type="secondary"
							style={{ marginBottom: 10, fontSize: 16 }}
						>
							{!isMobile && `Class Code:`}
							<Text code style={{ fontSize: 16 }}>
								{classData?.key}
							</Text>
						</Text>
					)}
				>
					<Flex gap={30} align="center">
						<Flex vertical gap={20} style={{height:"100%", width: '100%'}}>
							<Flex
								gap={10}
								justify="center"
								align="start"
								vertical
							>
								<Text type="secondary" style={{fontSize: 14}}>
									Class Name
								</Text>
								<Space.Compact block style={{width: '100%'}}>
									<Input
										placeholder="Class Name"
										defaultValue={classData?.className}
									/>
									{canRenameClass && !isMobile && (
										<Button
											type="primary"
											style={{height: 'auto'}}
											onClick={() => {
												if (!canRenameClass || !classData)
													return;

												updateSettings(classData.id, {
													name: classData.className,
												})
													.then((response) => {
														if (
															response?.success ===
																false ||
															response?.error
														) {
															globalMessageAPI.error(
																messageTemplates.class_name_update_failed,
															);
															return;
														}
														globalMessageAPI.success(
															messageTemplates.class_name_updated_success,
														);
													})
													.catch((error) =>
														Log({
															message:
																"Error updating class name",
															data: error,
															level: "error",
														}),
													);
											}}
										>
											Change Class Name
										</Button>
									)}
								</Space.Compact>

								{
									isMobile && (
										<Button
											type="primary"
											style={{height: 'auto', width: '100%'}}
											onClick={() => {
												if (!canRenameClass || !classData)
													return;

												updateSettings(classData.id, {
													name: classData.className,
												})
													.then((response) => {
														if (
															response?.success ===
																false ||
															response?.error
														) {
															globalMessageAPI.error(
																messageTemplates.class_name_update_failed,
															);
															return;
														}
														globalMessageAPI.success(
															messageTemplates.class_name_updated_success,
														);
													})
													.catch((error) =>
														Log({
															message:
																"Error updating class name",
															data: error,
															level: "error",
														}),
													);
											}}
										>
											Change Class Name
										</Button>
									)
								}
								
							</Flex>
							<Flex
								gap={10}
								align="start"
								vertical
							>
								<Text type="secondary" style={{fontSize: 14}}>
									Default Role
								</Text>
								<Select
									style={{ width: "100%", }}
									styles={{
										suffix: {
											pointerEvents: "none",
										},
									}}
									placeholder="Select a default role"
									suffix={null}

									value={defaultRoleId}
									onChange={updateDefaultRole}
									options={[
										{ label: "None", color: 'white', value: null },
										...(classData?.roles ?? []).map((role) => ({
											label: role.name,
											color: role.color,
											value: role.id,
										})),
									]}
									showSearch={{
										optionFilterProp: "label",
									}}
									optionRender={(option) => (
										<Flex align="center" gap={8}>
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

							<Flex
								gap={10}
								justify="center"
								align="center"
								vertical={isMobile}
							>
								{canKickStudents && (
									<Button
										variant="solid"
										color="danger"
										style={{width:'100%'}}
										onClick={() => {
											if (!canKickStudents || !classData)
												return;

											kickAllStudents(classData.id)
												.then((response) => {
													if (
														response?.success ===
															false ||
														response?.error
													) {
														globalMessageAPI.error(
															messageTemplates.class_students_kick_failed,
														);
														return;
													}
													globalMessageAPI.success(
														messageTemplates.class_students_kicked_success,
													);
												})
												.catch((error) =>
													Log({
														message:
															"Error kicking all students",
														data: error,
														level: "error",
													}),
												);
										}}
									>
										Kick All Students
									</Button>
								)}
								{canRegenerateCode && (
									<Button
										variant="solid"
										color="danger"
										style={{width:'100%'}}
										onClick={() => {
											if (
												!canRegenerateCode ||
												!classData
											)
												return;

											regenerateClassCode(classData.id)
												.then((response) => {
													if (
														response?.success ===
															false ||
														response?.error
													) {
														globalMessageAPI.error(
															messageTemplates.class_code_regenerate_failed,
														);
														return;
													}
													globalMessageAPI.success(
														messageTemplates.class_code_regenerated_success,
													);
												})
												.catch((error) =>
													Log({
														message:
															"Error regenerating class code",
														data: error,
														level: "error",
													}),
												);
										}}
									>
										Regenerate Code
									</Button>
								)}
								{canDeleteClass && (
									<Button
										variant="solid"
										color="danger"
										style={{width:'100%'}}
										onClick={() => {
											if (!canDeleteClass || !classData)
												return;

											modal.warning({
												title: "Are you sure you want to delete this class?",
												centered: true,
												content:
													"This action is irreversible, and you will not be able to recover this class.",
												okCancel: true,
												onOk: () => {
													deleteClass(classData!.id)
														.then(
															async (
																response,
															) => {
																if (
																	!response.ok
																) {
																	const message =
																		(response &&
																			(response.detail ||
																				response.message)) ||
																		"Failed to delete class.";
																	throw new Error(
																		message,
																	);
																}
																Log({
																	message:
																		"Class deleted:",
																	data: response.data,
																});
																globalMessageAPI.success(
																	messageTemplates.class_deleted_success,
																);
															},
														)
														.catch((error) => {
															Log({
																message:
																	"Failed to delete class:",
																data: error,
																level: "error",
															});
															Log({
																message:
																	"Failed to delete class:",
																data: error,
																level: "error",
															});
														});
												},
											});
										}}
									>
										Delete Class
									</Button>
								)}
							</Flex>
						</Flex>

						{!isMobile && (
							<Card style={{paddingInline: 80}}>
								<Flex
									vertical
									gap={10}
									align="center"
									justify="center"
								>
									<Tooltip
										title="Click to enlarge"
										mouseEnterDelay={0.5}
									>
										<QRCode
											value={
												frontendUrl +
												"/joinClass?code=" +
												classData?.key
											}
											bordered={true}
											size={150}
											style={{ cursor: "pointer" }}
											type="svg"
											icon="/img/FormbarLogo-Circle.png"
											onClick={() => {
												setIsQRModalOpen(true);
											}}
										/>
									</Tooltip>

									<Text
										strong
										type="secondary"
										style={{ fontSize: 16 }}
									>
										Scan to join class
									</Text>
								</Flex>
							</Card>
						)}
						<Modal
							open={isQRModalOpen}
							title="Join Class"
							footer={null}
							centered
							onCancel={() => {
								setIsQRModalOpen(false);
							}}
						>
							<QRCode
								value={
									frontendUrl +
									"/joinClass?code=" +
									classData?.key
								}
								bordered={false}
								style={{
									width: "100%",
									aspectRatio: 1,
									height: "unset",
								}}
								type="svg"
								icon="/img/FormbarLogo-Circle.png"
							/>
						</Modal>
					</Flex>

				</Card>

				{canManageLinks && !isMobile && (
					<>
						<Card style={{marginTop: 20}}>
							<Title level={3}>Links</Title>

							<Flex
								justify="end"
								align="center"
								style={{ width: "100%" }}
								vertical={isMobile}
								gap={isMobile ? 10 : undefined}
							>
								<Input
									placeholder="Link Name"
									style={{
										width: "200px",
										marginRight: 10,
									}}
									value={newLinkInput.name}
									onChange={(e) =>
										setNewLinkInput({
											...newLinkInput,
											name: e.target.value,
										})
									}
								/>
								<Space.Compact
									style={{
										width: "100%",
									}}
								>
									<AutoComplete
										options={defaultLinkTypes.map((linkType) => ({
											label: `${linkType}`,
											value: linkType,
										}))}
										value={linkType}
										onChange={setLinkType}
										placeholder="https://"
									/>
									<Input
										placeholder="example.com"
										value={newLinkInput.url}
										onChange={(e) =>
											setNewLinkInput({
												...newLinkInput,
												url: e.target.value,
											})
										}
									/>
									<Button
										type="primary"
										style={{
											height: 'auto',
											width: "100px",
										}}
										onClick={() => tryAddLink()}
									>
										Add Link
									</Button>
								</Space.Compact>
							</Flex>

							<Collapse
								style={{ width: "100%", marginTop: 20 }}
								bordered={false}
								items={[
									{
										key: 1,
										label: "Added Links",
										children: (
											<Flex vertical>
												{classLinks.length > 0 &&
													classLinks.map(
														(link, index) => (
															<Flex
																key={index}
																justify="space-between"
																align="center"
																style={{
																	width: "100%",
																	borderBottom:
																		"1px solid var(--antd-border-color)",
																	paddingBottom: 10,
																	marginBottom: 10,
																}}
															>
																<Input
																	style={{
																		width: "200px",
																		marginRight: 10,
																	}}
																	value={
																		link.name
																	}
																	readOnly
																/>
																<Input
																	style={{
																		width: "100%",
																	}}
																	value={
																		link.url
																	}
																	readOnly
																/>
																<Button
																	variant="solid"
																	color="danger"
																	style={{
																		marginLeft: 10,
																		width: "100px",
																	}}
																	onClick={() =>
																		removeLink(
																			link,
																		)
																	}
																>
																	Remove
																</Button>
															</Flex>
														),
													)}
											</Flex>
										),
									},
								]}
							/>
						</Card>
					</>
				)}

				{canManageUsers && (
					<>
						<Card style={{marginTop: 20}}>
							<Title level={3}>Banned Users</Title>
							<Flex vertical align="center" style={{width: '100%'}}>
								{
									!isMobile ? <Row gutter={[8, 8]} style={{ marginBottom: "10px", width: '100%', justifyContent: 'center' }}>
										{
											bannedStudents.map((student, index) => (
												<Col
													span={4}
													key={`student-${student.id}`}
												>
													<StudentObject
														style={getAppearAnimation(
															settings
																.accessibility
																.disableAnimations,
															index,
														)}
														key={student.id}
														student={classData?.students[student.id]!}
														openModalId={
															openModalId
														}
														setOpenModalId={
															setOpenModalId
														}
													/>
												</Col>
											))
										}
									</Row> :
									<Flex vertical style={{width: "100%", marginBottom: 10}}>
										{
											bannedStudents.map((student, index) => (
												<StudentObject
													style={{...getAppearAnimation(
														settings
															.accessibility
															.disableAnimations,
														index,
													), width: '100%'}}
													key={student.id}
													student={classData?.students[student.id]!}
													openModalId={
														openModalId
													}
													setOpenModalId={
														setOpenModalId
													}
												/>
											))
										}
									</Flex>

								}
								
								<CustomPagination 
									style={{
										maxWidth: '100%'
									}}
									currentPage={bannedCurrentPage}
									pageSize={bannedPageSize}
									total={totalBannedUsers}

									onChange={(page, size) => {
										setBannedCurrentPage(page);
										setBannedPageSize(size);
									}}
								/>
							</Flex>
						</Card>
					</>
				)}
			</Flex>
		</>
	);
}
