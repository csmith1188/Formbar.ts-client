import { Badge, Button, Checkbox, Flex, Modal, Switch, Typography } from "antd";
import { StudentAccordion } from "./AccordionCollapse";
const { Text } = Typography;

export default function StudentObject({
	student,
	openModalId,
	setOpenModalId,
}: {
	student: any;
	openModalId: number | null;
	setOpenModalId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
	const getStatusText = () => {
		if (student.tags?.includes("Offline")) return "Offline";
		if (student.help) return "Help Ticket";
		if (typeof student.break === "string") return "Requesting Break";
		if (typeof student.break === "boolean" && student.break)
			return "On Break";
		if (student.isGuest) return "Guest";
		return "";
	};

	const statusText = getStatusText();

	return (
		<div key={student.id}>
			<div>
				{statusText ? (
					<Badge.Ribbon
						color={
							statusText === "Help Ticket"
								? "red"
								: statusText === "On Break"
									? "yellow"
									: "gray"
						}
						style={{
							position: "absolute",
							top: "-20px",
							opacity: statusText === "Offline" ? 0.5 : 1,
						}}
						text={statusText}
					>
						<Button
							type="primary"
							style={{
								padding: "5px",
								height: "auto",
								width: "100%",
								opacity: statusText === "Offline" ? 0.5 : 1,
							}}
							onClick={() => setOpenModalId(student.id)}
						>
							<Text strong>
								{student.displayName}
								{student.pollRes.buttonRes !== ""
									? ` - ${student.pollRes.buttonRes}`
									: ""}
							</Text>
						</Button>
					</Badge.Ribbon>
				) : (
					<Button
						type="primary"
						style={{ padding: "5px", height: 'auto', width: "100%" }}
						onClick={() => setOpenModalId(student.id)}
					>
						<Text strong>
							{student.displayName}
							<span>
								{student.pollRes.buttonRes !== ""
									? ` - ${student.pollRes.buttonRes}`
									: ""}
							</span>
						</Text>
					</Button>
				)}
				<Modal
					centered
					title={
						<Flex vertical>
							{student.displayName}
							<Text
								italic
								type="secondary"
								style={{ fontWeight: 300, fontSize: "16px" }}
							>
								ID: {student.id}
							</Text>
						</Flex>
					}
					zIndex={openModalId === student.id ? 1000 : -100}
					open={openModalId === student.id}
					onCancel={() => setOpenModalId(null)}
					footer={null}
				>
					<Flex justify="center">
						<StudentAccordion studentData={student} />
					</Flex>
				</Modal>
			</div>
		</div>
	);
}
