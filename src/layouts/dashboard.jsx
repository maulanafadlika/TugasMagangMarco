import { Routes, Route, useNavigate } from "react-router-dom";
import { HomeIcon, UserGroupIcon, UserIcon, KeyIcon, BriefcaseIcon, ClipboardDocumentListIcon, InformationCircleIcon, ArrowTrendingUpIcon, ListBulletIcon, ClipboardDocumentIcon, FolderIcon, CalendarDaysIcon, DocumentChartBarIcon, FlagIcon, PencilSquareIcon, ReceiptPercentIcon, IdentificationIcon, PresentationChartBarIcon, StarIcon, FireIcon, FingerPrintIcon, CheckCircleIcon, ClockIcon, FunnelIcon, AdjustmentsHorizontalIcon, DocumentCheckIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import {
  Sidenav,
  DashboardNavbar,
  Configurator,
  Footer,
} from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { decryptPayload } from "@/services/codec/codec";
import { Home, UserManagement, GroupManagement, Projects, Status, Assignment, TaskList } from "@/pages/dashboard";
import { ProjectAssignment } from "@/pages/dashboard/project-assignment";
import { ForecastPrincipal } from "@/pages/dashboard/forecast-principal"
import { AssignmentTimeFrame } from "@/pages/dashboard/assignment-time-frame";
import { ProjectTimeFrame } from "@/pages/dashboard/project-time-frame";
import { RewriteTask } from "@/pages/dashboard/rewrite-task";
import { PurchaseOrder } from "@/pages/dashboard/purchase-order";
import { CustomerManagement } from "@/pages/dashboard/customer-management";
import { CustomerProject } from "@/pages/dashboard/customer-project";
import { ActivityLog } from "@/pages/dashboard/activity-log";
import { UserTask } from "@/pages/dashboard/user-task";
import { TodayActivity } from "@/pages/dashboard/today-activity";
// import { Parameter } from "@/pages/dashboard/parameter";
import { DocumentTemplate } from "@/pages/dashboard/document-template";
import { EditProfile } from "@/pages/dashboard/edit-profile";
import { AiOutlineProfile } from "react-icons/ai";
import ReportAssignment from "@/pages/dashboard/report-assignment";
import ProjectCheckpoint from "@/pages/dashboard/project-checkpoint";
import ExternalLink from "@/pages/dashboard/external-link";
import { useDashboard } from "@/zustand";
import ForecastReport from "@/pages/dashboard/forecast-revenue-report";
import { ProjectManager } from "@/pages/dashboard/project-manager";

const icon = {
  className: "w-4 h-4 text-inherit",
};
const componentList = {
  "home": <Home />,
  "group-management": <GroupManagement />,
  "user-management": <UserManagement />,
  "project-list": <Projects />,
  "project-manager": <ProjectManager />,
  "status-management": <Status />,
  "project-assignment": <ProjectAssignment />,
  "project-task": <TaskList />,
  "assignment": <Assignment />,
  "assign-time-frame": <AssignmentTimeFrame />,
  "project-time-frame": <ProjectTimeFrame />,
  "rewrite-task": <RewriteTask />,
  "purchase-order": <PurchaseOrder />,
  "customer-management": <CustomerManagement />,
  "customer-project": <CustomerProject />,
  "activity-log": <ActivityLog />,
  "user-task": <UserTask />,
  "today-activity": <TodayActivity />,
  // "parameter": < Parameter/>,
  "document-template": < DocumentTemplate />,
  "edit-profile": <EditProfile />,
  "assignment-report": <ReportAssignment />,
  "project-checkpoint": <ProjectCheckpoint />,
  "external-link": <ExternalLink />,
  "list-forecast": <ForecastPrincipal />,
  "revenue-dashboard" : <ForecastReport/>
};

const iconList = {
  "home": <HomeIcon {...icon} />,
  "setting": <KeyIcon {...icon} />,
  "master-data": <ClipboardDocumentListIcon {...icon} />,
  "group-management": <UserGroupIcon {...icon} />,
  "user-management": <UserIcon {...icon} />,
  "project-list": <BriefcaseIcon {...icon} />,
  "project-manager": <StarIcon {...icon} />,
  "status-management": <InformationCircleIcon {...icon} />,
  "project-assignment": <ArrowTrendingUpIcon {...icon} />,
  "project": <FolderIcon {...icon} />,
  "project-task": <ListBulletIcon {...icon} />,
  "assignment": <ClipboardDocumentIcon {...icon} />,
  "report": <DocumentChartBarIcon {...icon} />,
  "assign-time-frame": <FlagIcon {...icon} />,
  "project-time-frame": <CalendarDaysIcon {...icon} />,
  "rewrite-task": <PencilSquareIcon {...icon} />,
  "forecast-principal": <PencilSquareIcon {...icon} />,
  "purchase-order": <ReceiptPercentIcon {...icon} />,
  "customer-management": <IdentificationIcon {...icon} />,
  "customer-project": <PresentationChartBarIcon {...icon} />,
  "user-task": <CheckCircleIcon {...icon} />,
  "today-activity": <ClockIcon {...icon} />,
  // "parameter": <AdjustmentsHorizontalIcon {...icon} />,
  "document-template": <DocumentCheckIcon {...icon} />,
  "assignment-report": <FlagIcon {...icon} />,
  "project-checkpoint": <ReceiptPercentIcon {...icon} />,
  "external-link": <ReceiptPercentIcon {...icon} />
};

export function Dashboard() {
  const { setDataLink } = useDashboard()
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType } = controller;
  const [routes, setRoutes] = useState([]);
  const [externalLinkRoutes, setExternalLinkRoutes] = useState([]); // Store external link routes
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("TOKEN");
    const menuListCookies = Cookies.get("MENU_LIST");
    if (!token) {
      navigate("/auth/login");
    }
    if (token && menuListCookies) {
      const menuList = JSON.parse(decryptPayload(menuListCookies));
      const externalRoutes = []; // Collect external link routes

      const pages = menuList
        .map((menu, index) => {
          if (menu.url === "activity-log" || menu.url === "edit-profile") {
            return null;
          } else if (menu.url.startsWith('http')) {
            const uniqueUrl = `external-link-${menu.name.toLowerCase().replace(/\s+/g, '-')}`;
            // Store external link route
            externalRoutes.push({
              path: `/${uniqueUrl}`,
              originalUrl: menu.url,
              name: menu.name
            });
            return {
              ...menu,
              url: uniqueUrl,
              icon: iconList['external-link'] || <HomeIcon {...icon} />,
              name: `${menu.name}`,
              path: `/${uniqueUrl}`,
              element: componentList['external-link'],
              originalUrl: menu.url
            };
          }

          const newMenu = {
            icon: iconList[menu.url] || <HomeIcon {...icon} />,
            name: `${menu.name}`,
            path: `/${menu.url}`,
            element: componentList[menu.url],
            ...menu,
          };

          if (newMenu.child) {
            newMenu.child = newMenu.child.map((childItem, childIndex) => {
              if (childItem.url && childItem.url.startsWith('http')) {
                const uniqueChildUrl = `external-link-${childItem.name.toLowerCase().replace(/\s+/g, '-')}`;
                console.log(childItem)
                // Store child external link route
                externalRoutes.push({
                  path: `/${uniqueChildUrl}`,
                  originalUrl: childItem.url,
                  name: childItem.name
                });
                setDataLink(childItem.url)
                return {
                  ...childItem,
                  url: uniqueChildUrl,
                  icon: iconList['external-link'] || <HomeIcon {...icon} />,
                  originalUrl: childItem.url
                };
              }
              return {
                ...childItem,
                icon: iconList[childItem.url] || <HomeIcon {...icon} />,
              };
            });

            // Ensure Project menu always has Project Manager submenu in frontend.
            if (newMenu.url === "project") {
              const hasProjectManagerChild = newMenu.child.some((childItem) => childItem.url === "project-manager");
              if (!hasProjectManagerChild) {
                newMenu.child.splice(1, 0, {
                  name: "Project Manager",
                  url: "project-manager",
                  icon: iconList["project-manager"],
                });
              }
            }
          }

          return newMenu;
        })
        .filter(Boolean);

      setRoutes([{ layout: "dashboard", pages }]);
      setExternalLinkRoutes(externalRoutes); // Store external routes
      console.log('data pagesss', pages)
    }

    setIsLoading(false);
  }, []);

  // Function to handle sidenav toggle state
  const handleSidenavToggle = (isMinimized) => {
    setIsMinimized(isMinimized);
  };

  return isLoading ? (
    <></>
  ) : (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidenav
        routes={routes}
        brandImg={sidenavType === "blue" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"}
        onSidenavToggle={handleSidenavToggle}
        isMinimized={isMinimized}
      />
      <div className={`p-4 ${isMinimized ? "xl:ml-28" : "xl:ml-80"} transition-all duration-500`}>
        <DashboardNavbar />
        <Configurator />
        <Routes>
          {routes.map(({ layout, pages }) =>
            layout === "dashboard" &&
            pages.map((data) => {
              const { path, element, child } = data;
              const allRoutes = [];

              // Skip adding route for external-link items as they will be handled separately
              if (!path.includes('external-link')) {
                allRoutes.push(
                  <Route key={path} exact path={path} element={element} />
                );
              }

              if (child) {
                child.forEach((childRoute) => {
                  const { url } = childRoute;
                  // Skip external-link children as they will be handled separately
                  if (!url.includes('external-link')) {
                    allRoutes.push(
                      <Route
                        key={url}
                        exact
                        path={`/${url}`}
                        element={componentList[url]}
                      />
                    );
                  }
                });
              }
              return allRoutes;
            })
          )}

          {/* Add specific routes for each external link */}
          {externalLinkRoutes.map((externalRoute) => {
            console.log('to route', externalLinkRoutes)
            return (
              <Route
                key={externalRoute.path}
                path={externalRoute.path}
                element={
                  <ExternalLink
                    originalUrl={externalRoute.originalUrl}
                    name={externalRoute.name}
                  />
                }
              />
            )
          })}

          <Route path="/activity-log" element={<ActivityLog />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Routes>
        <div className="text-blue-gray-600">
          <Footer />
        </div>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layout/dashboard.jsx";

export default Dashboard;