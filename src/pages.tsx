import LoginPage from "./pages/Login.tsx";
import ControlPanel from "./pages/ControlPanel.tsx";
import Profile from "./pages/Profile.tsx";
import Student from "./pages/Student.tsx";
import InfoPage from "./pages/InfoPage.tsx";
import NewsPage from "./pages/NewsPage.tsx";
import StudentBar from "./pages/StudentBar.tsx";
import ClassesPage from "./pages/Classes.tsx";
import PogPools from "./pages/PogPools.tsx";
import Transactions from "./pages/Transactions.tsx";
import ManagerPanel from "./pages/ManagerPanel.tsx";
import NotFound from "./pages/404.tsx";
import { Testing } from "./pages/Testing.tsx";

import { Permissions } from "./types.ts";

type Page = {
	pageName: string;
	routePath: string;
	page: any;
	permissions?: Permissions;
};

const pages: Page[] = [
	{
		pageName: "404",
		routePath: "*",
		page: NotFound,
	},
	{
		pageName: "Login",
		routePath: "/login",
		page: LoginPage,
	},
	{
		pageName: "Control Panel",
		routePath: "/panel",
		page: ControlPanel,
		permissions: Permissions.TEACHER,
	},
	{
		pageName: "Student",
		routePath: "/student",
		page: Student,
	},
	{
		pageName: "Student Bar",
		routePath: "/studentbar",
		page: StudentBar,
	},
	{
		pageName: "Info Page",
		routePath: "/info",
		page: InfoPage,
	},
	{
		pageName: "Home",
		routePath: "/",
		page: NewsPage,
	},
	{
		pageName: "Classes",
		routePath: "/classes",
		page: ClassesPage,
	},
	{
		pageName: "Pog Pools",
		routePath: "/pools",
		page: PogPools,
	},
	{
		pageName: "Manager Panel",
		routePath: "/manager",
		page: ManagerPanel,
	},
	{
		pageName: "Profile",
		routePath: "/profile/:id?",
		page: Profile,
	},
	{
		pageName: "Transactions",
		routePath: "/profile/:id?/transactions",
		page: Transactions,
	},
    {
        pageName: "Testing",
        routePath: "/testing",
        page: Testing
    }
];

export default pages;
