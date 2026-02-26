import {
	Flex,
	QRCode,
	Typography,
	Input,
	Button,
	Switch,
	Image,
	Splitter,
	Space,
	Divider,
	Collapse,
	Modal,
	Tooltip,
} from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";
const { Title, Text } = Typography;
import { useClassData, useTheme } from "../../main";
import { useEffect, useState } from "react";
import { accessToken, formbarUrl } from "../../socket";

export default function SettingsMenu() {
	const { classData } = useClassData();

	const [isQRModalOpen, setIsQRModalOpen] = useState(false);

    const [newLinkInput, setNewLinkInput] = useState<{ name: string; url: string }>({ name: "", url: "" });

    const [classTags, setClassTags] = useState<string[]>(classData?.tags || []);
    const [newTagInput, setNewTagInput] = useState<string>("");

	const [classLinks, setClassLinks] = useState<
		{ name: string; url: string }[]
	>([]);

	useEffect(() => {
		if (!classData) return;

        setClassTags(classData.tags || []);

		fetch(`${formbarUrl}/api/v1/room/${classData.id}/links`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${accessToken}`,
			}
		})
		.then((res) => res.json())
		.then((data) => {
			console.log(data)
			if (data.success && data.data) {
				console.log("Fetched class links:", data.data);
				setClassLinks(data.data);
			}
		})
		.catch((err) => {
			console.error("Error fetching class links:", err);
		});
		
	}, [classData]);

    function tryAddLink() {
        if (!newLinkInput.name || !newLinkInput.url) {
            alert("Please fill out both the link name and URL.");
            return;
        }

        // Basic URL validation
        try {
            new URL("https://" + newLinkInput.url.replace(/^https?:\/\//, ''));
        } catch (e) {
            alert("Please enter a valid URL.");
            return;
        }

        fetch(`${formbarUrl}/api/v1/room/${classData?.id}/links/add`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newLinkInput)
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                setClassLinks([...classLinks, newLinkInput]);
                setNewLinkInput({ name: "", url: "" });
            } else {
                alert("Failed to add link.");
            }
        })
        .catch((err) => {
            console.error("Error adding link:", err);
            alert("An error occurred while adding the link.");
        });

    }

    function removeLink(linkToRemove: { name: string; url: string }) {
        fetch(`${formbarUrl}/api/v1/room/${classData?.id}/links/remove`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(linkToRemove)
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                setClassLinks(classLinks.filter(link => link.url !== linkToRemove.url));
            } else {
                alert("Failed to remove link.");
            }
        })
        .catch((err) => {
            console.error("Error removing link:", err);
            alert("An error occurred while removing the link.");
        });
    }

    function tryAddTag() {
        if (!newTagInput) {
            alert("Please enter a tag name.");
            return;
        }

        fetch(`${formbarUrl}/api/v1/room/${classData?.id}/tags/`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ tags: [...classTags, newTagInput] })
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                setClassTags([...classTags, newTagInput]);
            } else {
                alert("Failed to add tag.");
            }
        })
        .catch((err) => {
            console.error("Error adding tag:", err);
            alert("An error occurred while adding the tag.");
        });
    }

	const {isDark} = useTheme();

	return (
		<>
			<Flex
				gap={50}
				style={{ height: "100%", width: "100%", overflowY: "auto" }}
			>
				<Flex
					vertical
					style={{ width: "100%", paddingRight: 20 }}
				>
					<Title style={{ marginBottom: "0" }}>Settings</Title>
					<Divider />
					

					<Title level={3} style={{ marginTop: 0, marginBottom: 10 }}>
						General
					</Title>
					<Text type="secondary" style={{marginBottom: 10, fontSize: 16}}>
						Class Code: <Text code style={{fontSize: 16}}>{classData?.key}</Text>
					</Text>
					<Flex gap={30} align="center">
						<Flex vertical gap={20}>
							<Flex
								gap={10}
								style={{ width: "500px" }}
								justify="center"
								align="center"
							>
								<Input
									placeholder="Class Name"
									defaultValue={classData?.className}
								/>
								<Button type="primary">Change Class Name</Button>
							</Flex>

							<Flex
								gap={10}
								style={{ width: "400px" }}
								justify="center"
								align="center"
							>
								<Button variant="solid" color="danger">
									Kick All Students
								</Button>
								<Button variant="solid" color="danger">
									Regenerate Code
								</Button>
							</Flex>
						</Flex>
						
						<Flex vertical gap={10} align="center" justify="center" style={{borderLeft: `2px solid ${isDark ? '#fff2' : '#0002'}`,paddingLeft: 20}}>

							<Tooltip title="Click to enlarge">
								<QRCode value={"https://formbar.ljharnish.org/joinClass?code=" + classData?.key} bordered={false} size={150} style={{cursor:'pointer'}} type="svg" icon="/img/FormbarLogo2-Circle.png" onClick={() => { setIsQRModalOpen(true) }}/>
							</Tooltip>

							<Text strong type="secondary" style={{fontSize:16}}>Scan to join class</Text>
							
							<Modal 
								open={isQRModalOpen}
								title="Join Class"
								footer={null}
								centered
								onCancel={() => {
									setIsQRModalOpen(false)
								}}
								>
								<QRCode value={"https://formbar.ljharnish.org/joinClass?code=" + classData?.key} bordered={false} style={{
									width: '100%',
									aspectRatio: 1,
									height: 'unset'
								}} type="svg" icon="/img/FormbarLogo2-Circle.png"/>
								
							</Modal>
						</Flex>
					</Flex>

					<Divider />

					<Title level={3}>Allow Voting</Title>

					<Flex vertical gap={10}>
						<Flex align="center" justify="start" gap={10}>
							<Switch
								checkedChildren={<CheckOutlined />}
								unCheckedChildren={<CloseOutlined />}
								defaultChecked
							/>
							Guest
							<Text type="secondary">
								(Can vote without an account)
							</Text>
						</Flex>
						<Flex align="center" justify="start" gap={10}>
							<Switch
								checkedChildren={<CheckOutlined />}
								unCheckedChildren={<CloseOutlined />}
								defaultChecked
							/>
							Mods
							<Text type="secondary">
								(Mods can access student panel and vote)
							</Text>
						</Flex>
						<Flex align="center" justify="start" gap={10}>
							<Switch
								checkedChildren={<CheckOutlined />}
								unCheckedChildren={<CloseOutlined />}
								defaultChecked
							/>
							Teachers
							<Text type="secondary">
								(Teachers can access student panel and vote)
							</Text>
						</Flex>
					</Flex>

					<Divider />

					<Title level={3}>Links</Title>

					<Flex
						justify="end"
						align="center"
						style={{ width: "100%" }}
					>
						<Input
							placeholder="Link Name"
							style={{ width: "200px", marginRight: 10 }}
                            value={newLinkInput.name}
                            onChange={(e) => setNewLinkInput({...newLinkInput, name: e.target.value})}
						/>
						<Space.Compact style={{ width: "100%" }}>
							<Space.Addon>https://</Space.Addon>
							<Input 
								placeholder="example.com" 
								value={newLinkInput.url}
								onChange={(e) => setNewLinkInput({...newLinkInput, url: e.target.value})}
							/>
						</Space.Compact>
						<Button
							type="primary"
							style={{ marginLeft: 10, width: "100px" }}
                            onClick={() => tryAddLink()}
						>
							Add Link
						</Button>
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
										{classLinks.length > 0 && classLinks.map((link, index) => (
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
													value={link.name}
													readOnly
												/>
												<Input
													style={{ width: "100%" }}
													value={link.url}
													readOnly
												/>
												<Button
													variant="solid"
													color="danger"
													style={{
														marginLeft: 10,
														width: "100px",
													}}
                                                    onClick={() => removeLink(link)}
												>
													Remove
												</Button>
											</Flex>
										))}
									</Flex>
								),
							},
						]}
					/>

					<Divider />

					<Title level={3}>Tags</Title>

					<Flex
						justify="start"
						align="center"
						style={{ width: "100%" }}
					>
						<Input
							placeholder="Tag Name"
							style={{ width: "200px", marginRight: 10 }}
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
						/>
						<Button
							type="primary"
							style={{ marginLeft: 10, width: "100px" }}
                            onClick={() => tryAddTag()}
						>
							Add Tag
						</Button>
					</Flex>
                    <Flex gap={10} align="center" justify="start" wrap>
                        {
                            classTags.map((tag: string, index: number) => (
                                <Button 
                                    key={index} 
                                    variant="outlined" 
                                    type="default" 
                                    style={{marginTop: 10}}
                                >
                                    {tag}
                                    <IonIcon icon={IonIcons.trash} />
                                </Button>
                            ))
                        }
                    </Flex>
				</Flex>
			</Flex>
		</>
	);
}
