// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));


// dashboards

const ModernDashboard = Loadable(lazy(() => import('../views/dashboards/modern')));
const DashboardPage = Loadable(lazy(() => import('../views/dashboards')));
// V1 返工：/dashboards/ecommerce 改用官网公开 preview 的 Pro 版逐项 1:1 实现
const EcommerceProDashboard = Loadable(lazy(() => import('../views/dashboards/ecommerce')));

// V1: 7 个新 dashboards（modern 已有独立实现；ecommerce 已返工为 Pro 版）
const DASHBOARD_PATHS = [
  '/dashboards/analytics',
  '/dashboards/saas-ai',
  '/dashboards/school',
  '/dashboards/health',
  '/dashboards/restaurant',
  '/dashboards/logistics',
];

const Error = Loadable(lazy(() => import('../views/auth/error')));

// pages
const TablesPage = Loadable(lazy(() => import('../views/pages/tables')));
const FormPage = Loadable(lazy(() => import('../views/pages/form')));
const UserProfilePage = Loadable(lazy(() => import('../views/pages/user-profile')));
// FAQ：用户提供的 UI 逐项复刻，作为侧栏「使用文档」入口
const FaqPage = Loadable(lazy(() => import('../views/pages/faq')));

//V2 apps 群 1（逐项 1:1）
const EmailApp = Loadable(lazy(() => import('../views/apps/email')));
const ChatsApp = Loadable(lazy(() => import('../views/apps/chats')));
const ChatAI = Loadable(lazy(() => import('../views/apps/chat-ai')));
const ImageAI = Loadable(lazy(() => import('../views/apps/image-ai')));
const CalendarApp = Loadable(lazy(() => import('../views/apps/calendar')));
const ContactsApp = Loadable(lazy(() => import('../views/apps/contacts')));
// 官网 kanban-application-02 看板
const KanbanApp = Loadable(lazy(() => import('../views/apps/kanban')));

// PMS Workspace：六个模块 + Inbox，项目/任务/用户数据全部来自后端 API
const InboxApp = Loadable(lazy(() => import('../views/inbox')));
const ProjectsPage = Loadable(lazy(() => import('../views/workspace/projects')));
const ProjectDetailPage = Loadable(lazy(() => import('../views/workspace/projects/detail')));
const StageDetailPage = Loadable(lazy(() => import('../views/workspace/projects/stage-detail')));
const SprintsPage = Loadable(lazy(() => import('../views/workspace/sprints')));
const CalendarWorkspacePage = Loadable(lazy(() => import('../views/workspace/calendar')));
// PMS 设置页：5 个子页逐项 1:1 复刻自 pms-audit/dom/23-settings-*.html
const SettingsGeneralPage = Loadable(lazy(() => import('../views/workspace/settings/general')));
const SettingsMembersPage = Loadable(lazy(() => import('../views/workspace/settings/members')));
const SettingsBillingPage = Loadable(lazy(() => import('../views/workspace/settings/billing')));
const SettingsIntegrationsPage = Loadable(lazy(() => import('../views/workspace/settings/integrations')));
const SettingsApiKeysPage = Loadable(lazy(() => import('../views/workspace/settings/api-keys')));
// 布局页：右下角 Customizer 收口进设置模块（用户 2026-11-15 要求）
const SettingsLayoutPage = Loadable(lazy(() => import('../views/workspace/settings/layout')));
// PMS 个人设置页：1:1 复刻自 pms-audit/dom/11-profile.*
const ProfilePage = Loadable(lazy(() => import('../views/workspace/profile')));
// 业务需求模块：九阶段空白表单占位 + 复刻 demo 的发票编辑页
const RequirementStagePage = Loadable(lazy(() => import('../views/apps/requirements/stage')));
const RequirementEditPage = Loadable(lazy(() => import('../views/apps/requirements/edit')));

//icons
const SolarIcon = Loadable(lazy(() => import('../views/icons/iconify')));

//charts (D2 component wrappers verification)
const ChartsPage = Loadable(lazy(() => import('../views/charts')));

//tables (D3: 4 shadcn-tables + 14 react-tables variants)
const TablesVariantPage = Loadable(lazy(() => import('../views/tables')));

const TABLE_VARIANT_PATHS = [
  '/shadcn-tables/basic',
  '/shadcn-tables/striped-row',
  '/shadcn-tables/hover-table',
  '/shadcn-tables/checkbox-table',
  '/react-tables/basic',
  '/react-tables/dense',
  '/react-tables/sorting',
  '/react-tables/filtering',
  '/react-tables/pagination',
  '/react-tables/row-selection',
  '/react-tables/columnvisibility',
  '/react-tables/editable',
  '/react-tables/sticky',
  '/react-tables/drag-drop',
  '/react-tables/empty',
  '/react-tables/expanding',
  '/react-tables/user-datatable',
  '/react-tables/order-datatable',
];

// authentication：PMS 登录/注册 1:1 复刻 + 真实会话；旧模板地址保留重定向
const PmsLogin = Loadable(lazy(() => import('../views/auth/pms/login')));
const PmsRegister = Loadable(lazy(() => import('../views/auth/pms/register')));
const PmsForgotPassword = Loadable(lazy(() => import('../views/auth/pms/forgot-password')));

const ForgotPassword2 = Loadable(lazy(() => import('../views/auth/auth2/forgot-password')));

const TwoSteps2 = Loadable(lazy(() => import('../views/auth/auth2/two-steps')));

const Maintainance = Loadable(lazy(() => import('../views/auth/maintenance')));

const Router = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <FullLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <ModernDashboard /> },

      { path: '/dashboards/modern', element: <ModernDashboard /> },

      ...DASHBOARD_PATHS.map((path) => ({ path, element: <DashboardPage /> })),
      { path: '/dashboards/ecommerce', element: <EcommerceProDashboard /> },

      { path: '/apps/kanban', element: <KanbanApp /> },

      { path: '/apps/email', element: <EmailApp /> },
      { path: '/apps/chats', element: <ChatsApp /> },
      { path: '/apps/chat-ai', element: <ChatAI /> },
      { path: '/apps/image-ai', element: <ImageAI /> },
      { path: '/apps/calendar', element: <CalendarApp /> },

      { path: '/pages/tables', element: <TablesPage /> },
      { path: '/pages/form', element: <FormPage /> },
      { path: '/pages/user-profile', element: <UserProfilePage /> },

      { path: '/icons/iconify', element: <SolarIcon /> },

      { path: '/charts', element: <ChartsPage /> },

      ...TABLE_VARIANT_PATHS.map((path) => ({ path, element: <TablesVariantPage /> })),

      // PMS 业务模块（整组已由外层登录墙保护，此处保留 Outlet 分组以维持路由结构）。
      {
        element: <Outlet />,
        children: [
          { path: '/inbox', element: <InboxApp /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:id', element: <ProjectDetailPage /> },
          { path: '/projects/:id/stages/:stage', element: <StageDetailPage /> },
          { path: '/apps/requirements/:stage', element: <RequirementStagePage /> },
          { path: '/apps/invoice/edit', element: <RequirementEditPage /> },
          { path: '/apps/invoice/edit/:projectNo', element: <RequirementEditPage /> },
          { path: '/sprints', element: <SprintsPage /> },
          { path: '/calendar', element: <CalendarWorkspacePage /> },

          { path: '/settings', element: <Navigate to="/settings/general" replace /> },
          { path: '/settings/general', element: <SettingsGeneralPage /> },
          { path: '/settings/members', element: <SettingsMembersPage /> },
          { path: '/settings/billing', element: <SettingsBillingPage /> },
          { path: '/settings/integrations', element: <SettingsIntegrationsPage /> },
          { path: '/settings/api-keys', element: <SettingsApiKeysPage /> },
          { path: '/settings/layout', element: <SettingsLayoutPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/faq', element: <FaqPage /> },
          { path: '/apps/contacts', element: <ContactsApp /> },
        ],
      },

      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <PmsLogin /> },
          { path: '/register', element: <PmsRegister /> },
          { path: '/forgot-password', element: <PmsForgotPassword /> },
        ],
      },
      { path: '/auth/auth2/login', element: <Navigate to="/login" replace /> },
      { path: '/auth/auth2/register', element: <Navigate to="/register" replace /> },

      { path: '/auth/auth2/forgot-password', element: <ForgotPassword2 /> },

      { path: '/auth/auth2/two-steps', element: <TwoSteps2 /> },
      { path: '/auth/maintenance', element: <Maintainance /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;
