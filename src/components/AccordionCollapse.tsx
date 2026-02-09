import { IonIcon } from "@ionic/react";
import { Button, Flex, InputNumber, Select, Tooltip } from "antd";
import { Activity, useState, useEffect } from "react";
import { textColorForBackground } from "../CustomStyleFunctions";
import { PermissionLevels, type Student } from "../types";
import * as IonIcons from "ionicons/icons";
import { useClassData, useUserData } from "../main";
import { socket } from "../socket";

type AccordionCategory = {
	name: string;
	icon: string;
	content: React.ReactNode;
	enabled: boolean;
};

export default function AccordionCollapse({
	categories,
}: {
	categories: AccordionCategory[];
}) {
	const [currentIndex, setCurrentIndex] = useState<number | null>(null);
	const [expanded, setExpanded] = useState<boolean>(false);

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

export function StudentAccordion({ studentData }: { studentData: Student }) {
	const { classData } = useClassData();

	const [awardDigipogs, setAwardDigipogs] = useState<number>(0);
	const { userData } = useUserData();

	return (
		<AccordionCollapse
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
								onClick={() => {
									socket.emit("deleteTicket", studentData.id);
								}}
							>
								Delete
							</Button>
						</Flex>
					),
					enabled:
						typeof studentData.help === "object" ? true : false,
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
												socket.emit(
													"approveBreak",
													true,
													studentData.id,
												);
											}}
										>
											Approve
										</Button>
										<Button
											variant="solid"
											color="red"
											style={{ width: "120px" }}
											onClick={() => {
												socket.emit(
													"approveBreak",
													false,
													studentData.id,
												);
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
										socket.emit(
											"approveBreak",
											false,
											studentData.id,
										);
									}}
								>
									End Break
								</Button>
							)}
						</Flex>
					),
					enabled: studentData.break !== false,
				},
				{
					name: "Text Response",
					icon: IonIcons.textOutline,
					content: <p>{studentData.pollRes.textRes}</p>,
					enabled: studentData.pollRes.textRes !== "",
				},
				{
					name: "Permissions",
					icon: IonIcons.lockClosedOutline,
					content: (
						<Flex
							justify="center"
							align="center"
							style={{ width: "100%", height: "100%" }}
							gap={10}
						>
							<Select
								defaultValue={
									PermissionLevels[
										studentData.classPermissions
									]
								}
								style={{ width: 120 }}
								onChange={(e) => {
									socket.emit(
										"classPermChange",
										studentData.id,
										parseInt(e),
									);
								}}
							>
								<Select.Option value="4">Teacher</Select.Option>
								<Select.Option value="3">Mod</Select.Option>
								<Select.Option value="2">Student</Select.Option>
								<Select.Option value="1">Guest</Select.Option>
							</Select>
						</Flex>
					),
					enabled: true,
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
									socket.emit("awardDigipogs", {
										from: userData?.id,
										to: studentData.id,
										amount: awardDigipogs,
									});
								}}
							>
								Award
							</Button>
						</Flex>
					),
					enabled: true,
				},
				{
					name: "Tags",
					icon: IonIcons.pricetagsOutline,
					content: (
						<Flex
							justify="center"
							align="center"
							style={{ width: "100%", height: "100%" }}
							gap={10}
						>
							{classData?.tags.map(
								(tag, index) =>
									tag !== "Offline" && (
										<Button
											key={index}
											variant="solid"
											color={
												studentData.tags.includes(tag)
													? "green"
													: "red"
											}
											style={{ width: "120px" }}
											onClick={() => {
												!studentData.tags.includes(tag)
													? studentData.tags.push(tag)
													: (studentData.tags =
															studentData.tags.filter(
																(t: any) =>
																	t !== tag,
															));
												socket.emit(
													"saveTags",
													studentData.id,
													studentData.tags,
												);
											}}
										>
											{tag}
										</Button>
									),
							)}
						</Flex>
					),
					enabled: true,
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
							>
								Ban User
							</Button>
							<Button
								variant="solid"
								color="red"
								style={{ width: "120px" }}
							>
								Kick User
							</Button>
						</Flex>
					),
					enabled: true,
				},
			]}
		/>
	);
}
