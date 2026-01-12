import TestingPage from "./pages/TestingPage.tsx";
import LoginPage from "./pages/Login.tsx"
import ControlPanel from "./pages/ControlPanel.tsx"
import Profile from "./pages/Profile.tsx"
import Student from "./pages/Student.tsx"
import InfoPage from "./pages/InfoPage.tsx";
import NewsPage from "./pages/NewsPage.tsx";
import StudentBar from "./pages/StudentBar.tsx";
import ClassesPage from "./pages/Classes.tsx";
import PogPools from "./pages/PogPools.tsx";
import Transactions from "./pages/Transactions.tsx";
import ManagerPanel from "./pages/ManagerPanel.tsx";

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
        pageName: "Student Bar",
        routePath: '/studentbar',
        page: StudentBar,
    },
    {
        pageName: "Info Page",
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
    }, 
    {
        pageName: "Pog Pools",
        routePath: '/pools',
        page: PogPools,
    },
    {
        pageName: 'Transactions',
        routePath: '/profile/transactions',
        page: Transactions,
    },
    {
        pageName: "Manager Panel",
        routePath: '/managerpanel',
        page: ManagerPanel,
    }
]

export default pages;