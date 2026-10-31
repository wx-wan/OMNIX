import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  zh: {
    translation: {
      appName: "OMNIX",
      nav: {
        dashboard: "仪表盘",
        users: "用户",
        components: "组件",
        settings: "设置",
      },
      dashboard: {
        title: "仪表盘",
        subtitle: "欢迎回来，这是 OMNIX 的全栈工作台。",
        totalUsers: "用户总数",
        activeSessions: "活跃会话",
        revenue: "营收",
        orders: "订单",
        recentUsers: "最近用户",
        loading: "加载中…",
      },
      common: {
        search: "搜索",
        save: "保存",
        cancel: "取消",
        confirm: "确认",
        actions: "操作",
      },
    },
  },
  en: {
    translation: {
      appName: "OMNIX",
      nav: {
        dashboard: "Dashboard",
        users: "Users",
        components: "Components",
        settings: "Settings",
      },
      dashboard: {
        title: "Dashboard",
        subtitle: "Welcome back to the OMNIX full-stack workspace.",
        totalUsers: "Total Users",
        activeSessions: "Active Sessions",
        revenue: "Revenue",
        orders: "Orders",
        recentUsers: "Recent Users",
        loading: "Loading…",
      },
      common: {
        search: "Search",
        save: "Save",
        cancel: "Cancel",
        confirm: "Confirm",
        actions: "Actions",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "zh",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
