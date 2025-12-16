import TestingPage from "./pages/TestingPage.tsx";
import LoginPage from "./pages/Login.tsx"
import ControlPanel from "./pages/ControlPanel.tsx"
import Profile from "./pages/Profile.tsx"
import Student from "./pages/Student.tsx"
import SocketTestingPage from "./pages/SocketTesting.tsx";

type Page = {
    pageName: string,
    routePath: string,
    desktopPage: any,
}

const pages: Page[] = [
	{
        pageName: "Testing",
        routePath: '/*',
        desktopPage: TestingPage,
    },
	{
        pageName: "Login",
        routePath: '/login',
        desktopPage: LoginPage,
    },
    {
        pageName: "Control Panel",
        routePath: '/panel',
        desktopPage: ControlPanel,
    },
    {
        pageName: "Profile",
        routePath: '/profile',
        desktopPage: Profile,
    },
    {
        pageName: "Socket Test",
        routePath: '/socket-test',
        desktopPage: SocketTestingPage,
    },
    {
        pageName: "Student",
        routePath: '/student',
        desktopPage: Student,
    }
]

export default pages;