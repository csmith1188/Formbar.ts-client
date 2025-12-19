import TestingPage from "./pages/TestingPage.tsx";
import LoginPage from "./pages/Login.tsx"
import ControlPanel from "./pages/ControlPanel.tsx"
import Profile from "./pages/Profile.tsx"
import Student from "./pages/Student.tsx"
import InfoPage from "./pages/InfoPage.tsx";
import NewsPage from "./pages/NewsPage.tsx";
import StudentBar from "./pages/StudentBar.tsx";
import ClassesPage from "./pages/Classes.tsx";

type Page = {
    pageName: string,
    routePath: string,
    page: any,
}

const pages: Page[] = [
	{
        pageName: "Testing",
        routePath: '/testing',
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
        pageName: "Student",
        routePath: '/student',
        page: Student,
    },
    {
        pageName: "StudentBar",
        routePath: '/studentbar',
        page: StudentBar,
    },
    {
        pageName: "InfoPage",
        routePath: '/info',
        page: InfoPage
    },
    {
        pageName: "Home",
        routePath: '/',
        page: NewsPage,
    },
    {
        pageName: "Classes",
        routePath: '/classes',
        page: ClassesPage,
    }
]

export default pages;