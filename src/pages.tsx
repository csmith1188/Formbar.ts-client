import TestingPage from "./pages/TestingPage.tsx";
import LoginPage from "./pages/Login.tsx"
import ControlPanel from "./pages/ControlPanel.tsx"
import Profile from "./pages/Profile.tsx"
import Student from "./pages/Student.tsx"
import SocketTestingPage from "./pages/SocketTesting.tsx";
import InfoPage from "./pages/InfoPage.tsx";

type Page = {
    pageName: string,
    routePath: string,
    page: any,
}

const pages: Page[] = [
	{
        pageName: "Testing",
        routePath: '/*',
        page: TestingPage,
    },
	{
        pageName: "Login",
        routePath: '/login',
        page: LoginPage,
    },
    {
        pageName: "Control Panel",
        routePath: '/panel',
        page: ControlPanel,
    },
    {
        pageName: "Profile",
        routePath: '/profile',
        page: Profile,
    },
    {
        pageName: "Socket Test",
        routePath: '/socket-test',
        page: SocketTestingPage,
    },
    {
        pageName: "Student",
        routePath: '/student',
        page: Student,
    },
    {
        pageName: "InfoPage",
        routePath: '/info',
        page: InfoPage
    }
]

export default pages;