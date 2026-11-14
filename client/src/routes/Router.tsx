// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';

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

//apps
const Blog = Loadable(lazy(() => import('../views/apps/blog/post')));
const BlogDetail = Loadable(lazy(() => import('../views/apps/blog/detail')));
const BlogAdd = Loadable(lazy(() => import('../views/apps/blog/create')));
const BlogEdit = Loadable(lazy(() => import('../views/apps/blog/edit')));
const BlogTable = Loadable(lazy(() => import('../views/apps/blog/manage-blog')));

const Notes = Loadable(lazy(() => import('../views/apps/notes')));

const Tickets = Loadable(lazy(() => import('../views/apps/tickets')));
const TicketCreate = Loadable(lazy(() => import('../views/apps/tickets/create')));

// pages
const TablesPage = Loadable(lazy(() => import('../views/pages/tables')));
const FormPage = Loadable(lazy(() => import('../views/pages/form')));
const UserProfilePage = Loadable(lazy(() => import('../views/pages/user-profile')));

//V2 apps 群 1（逐项 1:1）
const EmailApp = Loadable(lazy(() => import('../views/apps/email')));
const ChatsApp = Loadable(lazy(() => import('../views/apps/chats')));
const ChatAI = Loadable(lazy(() => import('../views/apps/chat-ai')));
const ImageAI = Loadable(lazy(() => import('../views/apps/image-ai')));
const CalendarApp = Loadable(lazy(() => import('../views/apps/calendar')));
const ContactsApp = Loadable(lazy(() => import('../views/apps/contacts')));
// 官网 kanban-application-02 看板
const KanbanApp = Loadable(lazy(() => import('../views/apps/kanban')));

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

// authentication

const Login2 = Loadable(lazy(() => import('../views/auth/auth2/login')));

const Register2 = Loadable(lazy(() => import('../views/auth/auth2/register')));

const ForgotPassword2 = Loadable(lazy(() => import('../views/auth/auth2/forgot-password')));

const TwoSteps2 = Loadable(lazy(() => import('../views/auth/auth2/two-steps')));

const Maintainance = Loadable(lazy(() => import('../views/auth/maintenance')));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <ModernDashboard /> },

      { path: '/dashboards/modern', element: <ModernDashboard /> },

      ...DASHBOARD_PATHS.map((path) => ({ path, element: <DashboardPage /> })),
      { path: '/dashboards/ecommerce', element: <EcommerceProDashboard /> },

      { path: '/apps/blog/post', element: <Blog /> },
      { path: '/apps/blog/detail/:id', element: <BlogDetail /> },
      { path: '/apps/blog/create', element: <BlogAdd /> },
      { path: '/apps/blog/edit', element: <BlogEdit /> },
      { path: '/apps/blog/manage-blog', element: <BlogTable /> },

      { path: '/apps/notes', element: <Notes /> },
      { path: '/apps/kanban', element: <KanbanApp /> },

      { path: '/apps/email', element: <EmailApp /> },
      { path: '/apps/chats', element: <ChatsApp /> },
      { path: '/apps/chat-ai', element: <ChatAI /> },
      { path: '/apps/image-ai', element: <ImageAI /> },
      { path: '/apps/calendar', element: <CalendarApp /> },
      { path: '/apps/contacts', element: <ContactsApp /> },

      { path: '/apps/tickets', element: <Tickets /> },
      { path: '/apps/tickets/create', element: <TicketCreate /> },

      { path: '/pages/tables', element: <TablesPage /> },
      { path: '/pages/form', element: <FormPage /> },
      { path: '/pages/user-profile', element: <UserProfilePage /> },

      { path: '/icons/iconify', element: <SolarIcon /> },

      { path: '/charts', element: <ChartsPage /> },

      ...TABLE_VARIANT_PATHS.map((path) => ({ path, element: <TablesVariantPage /> })),

    
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/auth2/login', element: <Login2 /> },

      { path: '/auth/auth2/register', element: <Register2 /> },

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
