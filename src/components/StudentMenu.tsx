import { FloatButton, Input, Modal, Radio } from "antd";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
import { socket } from "../socket";
import { useState } from "react";

export default function StudentMenu() {
	const [helpModalOpen, setHelpModalOpen] = useState(false);
	const [breakModalOpen, setBreakModalOpen] = useState(false);
	const [breakType, setBreakType] = useState<string>("Bathroom");

	const [breakReason, setBreakReason] = useState<string>("");
	const [helpReason, setHelpReason] = useState<string>("");

	function sendHelpTicket(reason: string) {
		socket.emit("help", reason);
	}

	function requestBreak(reason?: string) {
		socket.emit("requestBreak", reason);
	}

	return (
		<>
			<FloatButton.Group
				trigger="click"
				placement="top"
				type="primary"
				shape="circle"
				style={{ insetBlockEnd: 20, insetInlineEnd: 30 }}
				icon={
					<IonIcon
						icon={IonIcons.grid}
						style={{ fontSize: "36px", display: "flex" }}
					/>
				}
				tooltip={{
					title: "Menu",
					color: "blue",
					placement: "left",
				}}
				styles={{
					trigger: {
						width: "64px",
						height: "64px",
					},
					item: {
						width: "64px",
						height: "64px",
					},
					list: {
						gap: "10px",
						insetBlockEnd: "90px",
					},
				}}
			>
				<FloatButton
					shape="circle"
					type="primary"
					tooltip={{
						title: "Help Ticket",
						color: "#ff6860",
						placement: "left",
					}}
					styles={{
						root: {
							background: "#ff6860",
						},
					}}
					onClick={() => setHelpModalOpen(true)}
					icon={
						<IonIcon
							icon={IonIcons.handLeftOutline}
							style={{
								fontSize: "36px",
								display: "flex",
								filter: "invert(1)",
							}}
						/>
					}
				/>
				<FloatButton
					shape="circle"
					type="primary"
					tooltip={{
						title: "Request a Break",
						color: "#ff8f40",
						placement: "left",
					}}
					styles={{
						root: {
							background: "#ff8f40",
						},
					}}
					icon={
						<IonIcon
							icon={IonIcons.umbrellaOutline}
							style={{
								fontSize: "36px",
								display: "flex",
								filter: "invert(1)",
							}}
						/>
					}
					onClick={() => setBreakModalOpen(true)}
				/>
			</FloatButton.Group>

			<Modal
				title="Request Help"
				open={helpModalOpen}
				onCancel={() => setHelpModalOpen(false)}
				onOk={() => {
					setHelpModalOpen(false);
					sendHelpTicket(helpReason);
				}}
			>
				<Input.TextArea
					placeholder="Reason... (Optional)"
					style={{ marginTop: "10px" }}
					rows={4}
					onChange={(e) => {
						setHelpReason(e.target.value);
					}}
				/>
			</Modal>
			<Modal
				title="Request a Break"
				open={breakModalOpen}
				onCancel={() => setBreakModalOpen(false)}
				onOk={() => {
					setBreakModalOpen(false);
					requestBreak(
						breakType === "Other" ? breakReason : breakType,
					);
				}}
			>
				<Radio.Group
					onChange={(e) => setBreakType(e.target.value)}
					value={breakType}
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "10px",
					}}
				>
					<Radio value="Bathroom">Bathroom</Radio>
					<Radio value="Other">Other</Radio>
				</Radio.Group>
				{breakType === "Other" && (
					<Input.TextArea
						placeholder="Please describe your reason..."
						style={{ marginTop: "10px" }}
						rows={4}
						onChange={(e) => {
							setBreakReason(e.target.value);
						}}
					/>
				)}
			</Modal>
		</>
	);
}
