import LoginPage from "@pages/Login.tsx";
import ControlPanel from "@pages/ControlPanel.tsx";
import Profile from "@pages/Profile.tsx";
import Student from "@pages/Student.tsx";
import NewsPage from "@pages/NewsPage.tsx";
import ClassesPage from "@pages/Classes.tsx";
import PogPools from "@pages/PogPools.tsx";
import InventoryPage from "@pages/InventoryPage.tsx";
import Transactions from "@pages/Transactions.tsx";
import ManagerPanel from "@pages/ManagerPanel.tsx";
import NotFound from "@pages/404.tsx";
import { Testing } from "@pages/Testing.tsx";
import PinResetPage from "@pages/PinReset.tsx";
import EmailVerifyPage from "@pages/EmailVerify.tsx";
import AuthorizeApp from "@pages/oauth/AuthorizeApp.tsx";
import Links from "@pages/Links.tsx";
import NotificationsPage from "./pages/Notifications";

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
	},
	{
		pageName: "Student",
		routePath: "/student",
		page: Student,
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
		pageName: "Reset PIN",
		routePath: "/user/me/pin",
		page: PinResetPage,
	},
	{
		pageName: "Verify Email",
		routePath: "/user/verify/email",
		page: EmailVerifyPage,
	},
	{
		pageName: "Transactions",
		routePath: "/profile/:id?/transactions",
		page: Transactions,
	},
	{
		pageName: "Inventory",
		routePath: "/profile/:id?/inventory",
		page: InventoryPage,
	},
	{
		// Legacy OAuth redirect flow — third-party apps (e.g. Jukebar) send the user
		// here with ?redirectURL=<callback>.  LoginPage handles the rest.
		pageName: "OAuth",
		routePath: "/oauth",
		page: LoginPage,
	},
	{
		pageName: "Testing",
		routePath: "/testing",
		page: Testing,
	},
	{
		pageName: "Classes",
		routePath: "/joinClass",
		page: ClassesPage,
	},
	{
		pageName: "Authorize App",
		routePath: "/oauth/authorize",
		page: AuthorizeApp,
	},
	{
		pageName: "Links",
		routePath: "/links",
		page: Links,
	},
	{
		pageName: "Notifications",
		routePath: "/notifications",
		page: NotificationsPage,
	},
];

export default pages;
