import { Card, Flex, Typography } from "antd";
const { Title } = Typography;
import FormbarHeader from "../components/FormbarHeader";
import { useMobileDetect } from "../main";
import { Link } from "react-router";


export default function NewsPage() {
    const isMobileView = useMobileDetect();

    return (
		<>
            <FormbarHeader />
			<Flex vertical gap={20} style={{ padding: isMobileView ? '20px' : '20px 20% 0 20%', width: '100%', margin: 'auto', height: '100%', overflowY: 'auto' }} align="center">
                <Title style={{margin:0}}>Patch Notes</Title>
                <Title level={5} style={{margin:0}}>Latest Update: Dec 17th, 2025</Title>
                <Card title={<Title level={4} style={{margin: 0}}>Version 3.0.0</Title>}>
                    <ul style={{marginBottom: 0, listStyle: 'none'}}>
                        <li>
                            <b>Frontend Update: </b>Once again, the Frontend has been revamped! The new design using React focuses on usability and clarity, making it easier for both teachers and students to navigate the platform.
                        </li>
                        <li>
                            <b>Headless Server: </b>Now the Formbar server and client are separated! This comes with changes to how the API works, so be sure to check out the updated documentation.
                        </li>
                        <li>
                            <b>Formbar.ts: </b>Coming soon is a full port of Formbar.js to TypeScript! This port will allow for better type safety and improved developer experience when building third-party applications that integrate with Formbar.
                        </li>
                    </ul>
                </Card>
                <Card title={<Title level={4} style={{margin: 0}}>Version 2.0.0</Title>}>
                    <ul style={{marginBottom: 0, listStyle: 'none'}}>
                        <li>
                            <b>Digipogs: </b>Students accumulate digipogs as
                            they answer polls. Teachers can also award them
                            directly in their class. Third party app
                            developers can charge digipogs for their
                            services.
                        </li>
                        <li>
                            <b>New Teacher Panel: </b>We don't need to talk
                            about the last new teacher panel. This one is
                            better!
                        </li>
                        <li>
                            <b>Improved API: </b> Build your third party
                            apps to integrate with Formbar. See the{" "}
                            <Link to="https://github.com/csmith1188/Formbar.js/wiki">
                                Formbar.js Wiki
                            </Link>{" "}
                            for more information.
                        </li>
                    </ul>
                </Card>
                <Card title={<Title level={4} style={{margin: 0}}>Version 1.1.0</Title>}>
                    <ul style={{marginBottom: 0, listStyle: 'none'}}>
                        <li>
                            <b>Email and Password Reset: </b>Accounts now
                            require email verification to register. This
                            prevents spam accounts, but users can now use it
                            to reset their password!
                        </li>
                        <li>
                            <b>Google Signin: </b>
                            <i>Pending.</i> Users can now use their existing
                            Google accounts to create an account and log in.
                        </li>
                        <li>
                            <b>New Teacher Panel: </b>Your student list is
                            going to look a little different. Editting
                            permission levels and selecting tags is now
                            clearer and easier than before. Many of the
                            settings have been moved to a single menu,
                            accesible from the gear icon at the top of the
                            page. From the Settings tab, you can now
                            fast-edit tags, change your class name, and
                            change the class entry code. Sounds now play in
                            the browser on student activity.
                        </li>
                        <li>
                            <b>Select Feature: </b>Quickly and easily poll
                            portions of the class. The "Select" section of
                            the panel now auto-fills with all tags students
                            have, and all responses to polls. Now you can
                            ask follow-up questions to only students who
                            replied a certain way, or ask questions to only
                            certain groups of a project.
                        </li>
                        <li>
                            <b>Improved API: </b> Build your third party
                            apps to integrate with Formbar. See the{" "}
                            <Link to="https://github.com/csmith1188/Formbar.js/wiki">
                                Formbar.js Wiki
                            </Link>{" "}
                            for more information.
                        </li>
                    </ul>
                </Card>
			</Flex>
		</>
	);
}
