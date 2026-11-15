import { http, HttpResponse } from "msw";
import type { WorkspaceSnapshot } from "src/types/apps/workspace";

/** 数据来源：pms-audit/api/mock-data/dataset_00..14.json（PMS 线上快照），字段原样保留。 */
export const WorkspaceSnapshotSeed = {
  "users": [
    {
      "id": "u1",
      "name": "Alice Johnson",
      "email": "alice@pms.com",
      "avatar": "/images/profile/user-2.png",
      "role": "admin",
      "status": "online",
      "createdAt": "2025-01-01"
    },
    {
      "id": "u2",
      "name": "Bob Smith",
      "email": "bob@pms.com",
      "avatar": "/images/profile/user-3.png",
      "role": "member",
      "status": "online",
      "createdAt": "2025-01-15"
    },
    {
      "id": "u3",
      "name": "Carol Davis",
      "email": "carol@pms.com",
      "avatar": "/images/profile/user-6.png",
      "role": "member",
      "status": "away",
      "createdAt": "2025-02-01"
    },
    {
      "id": "u4",
      "name": "David Lee",
      "email": "david@pms.com",
      "avatar": "/images/profile/user-1.png",
      "role": "member",
      "status": "offline",
      "createdAt": "2025-02-10"
    },
    {
      "id": "u5",
      "name": "Eve Wilson",
      "email": "eve@pms.com",
      "avatar": "/images/profile/user-9.png",
      "role": "viewer",
      "status": "online",
      "createdAt": "2025-03-01"
    },
    {
      "id": "u6",
      "name": "Frank Brown",
      "email": "frank@pms.com",
      "avatar": "/images/profile/user-8.png",
      "role": "member",
      "status": "online",
      "createdAt": "2025-03-15"
    },
    {
      "id": "u7",
      "name": "Grace Kim",
      "email": "grace@pms.com",
      "avatar": "/images/profile/user-10.png",
      "role": "admin",
      "status": "away",
      "createdAt": "2025-01-20"
    },
    {
      "id": "u8",
      "name": "Henry Chen",
      "email": "henry@pms.com",
      "avatar": "/images/profile/user-7.png",
      "role": "member",
      "status": "offline",
      "createdAt": "2025-04-01"
    }
  ],
  "teams": [
    {
      "id": "t1",
      "name": "Product",
      "description": "Product development team",
      "memberIds": [
        "u1",
        "u2",
        "u3",
        "u4"
      ],
      "leadId": "u1",
      "createdAt": "2025-01-01"
    },
    {
      "id": "t2",
      "name": "Design",
      "description": "Design team",
      "memberIds": [
        "u5",
        "u6",
        "u7"
      ],
      "leadId": "u7",
      "createdAt": "2025-02-01"
    },
    {
      "id": "t3",
      "name": "Engineering",
      "description": "Engineering team",
      "memberIds": [
        "u2",
        "u4",
        "u6",
        "u8"
      ],
      "leadId": "u2",
      "createdAt": "2025-01-15"
    }
  ],
  "labels": [
    {
      "id": "l1",
      "name": "bug",
      "color": "#ef4444"
    },
    {
      "id": "l2",
      "name": "feature",
      "color": "#3b82f6"
    },
    {
      "id": "l3",
      "name": "enhancement",
      "color": "#8b5cf6"
    },
    {
      "id": "l4",
      "name": "documentation",
      "color": "#10b981"
    },
    {
      "id": "l5",
      "name": "design",
      "color": "#f59e0b"
    },
    {
      "id": "l6",
      "name": "urgent",
      "color": "#dc2626"
    },
    {
      "id": "l7",
      "name": "frontend",
      "color": "#06b6d4"
    },
    {
      "id": "l8",
      "name": "backend",
      "color": "#6366f1"
    },
    {
      "id": "l9",
      "name": "testing",
      "color": "#84cc16"
    },
    {
      "id": "l10",
      "name": "refactor",
      "color": "#ec4899"
    }
  ],
  "projects": [
    {
      "id": "p1",
      "name": "Website Redesign",
      "description": "Complete redesign of the company website with modern UI/UX principles.",
      "cover": "",
      "status": "active",
      "priority": "high",
      "dueDate": "RELATIVE_DAYS_PLUS30",
      "memberIds": [
        "u1",
        "u2",
        "u5",
        "u7"
      ],
      "leadId": "u1",
      "progress": 45,
      "archived": false,
      "teamId": "t1",
      "createdAt": "RELATIVE_DAYS_MINUS60",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "p2",
      "name": "Mobile App v2",
      "description": "Version 2 of the mobile application with offline support and push notifications.",
      "cover": "",
      "status": "active",
      "priority": "high",
      "dueDate": "RELATIVE_DAYS_PLUS45",
      "memberIds": [
        "u2",
        "u4",
        "u6",
        "u8"
      ],
      "leadId": "u2",
      "progress": 30,
      "archived": false,
      "teamId": "t3",
      "createdAt": "RELATIVE_DAYS_MINUS45",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "p3",
      "name": "API Gateway",
      "description": "Build a unified API gateway for microservices architecture.",
      "cover": "",
      "status": "active",
      "priority": "medium",
      "dueDate": "RELATIVE_DAYS_PLUS60",
      "memberIds": [
        "u2",
        "u4",
        "u8"
      ],
      "leadId": "u2",
      "progress": 60,
      "archived": false,
      "teamId": "t3",
      "createdAt": "RELATIVE_DAYS_MINUS90",
      "updatedAt": "RELATIVE_DAYS_MINUS0"
    },
    {
      "id": "p4",
      "name": "Design System",
      "description": "Create a reusable component library and design guidelines.",
      "cover": "",
      "status": "active",
      "priority": "medium",
      "dueDate": "RELATIVE_DAYS_PLUS20",
      "memberIds": [
        "u5",
        "u6",
        "u7"
      ],
      "leadId": "u7",
      "progress": 75,
      "archived": false,
      "teamId": "t2",
      "createdAt": "RELATIVE_DAYS_MINUS30",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "p5",
      "name": "Customer Portal",
      "description": "Self-service portal for customers to manage their accounts.",
      "cover": "",
      "status": "on_hold",
      "priority": "low",
      "dueDate": "RELATIVE_DAYS_PLUS90",
      "memberIds": [
        "u1",
        "u3",
        "u5"
      ],
      "leadId": "u1",
      "progress": 20,
      "archived": false,
      "teamId": "t1",
      "createdAt": "RELATIVE_DAYS_MINUS20",
      "updatedAt": "RELATIVE_DAYS_MINUS5"
    },
    {
      "id": "p6",
      "name": "Internal Dashboard",
      "description": "Analytics dashboard for internal metrics tracking.",
      "cover": "",
      "status": "completed",
      "priority": "medium",
      "dueDate": "RELATIVE_DAYS_MINUS5",
      "memberIds": [
        "u3",
        "u4",
        "u6"
      ],
      "leadId": "u3",
      "progress": 100,
      "archived": true,
      "teamId": "t1",
      "createdAt": "RELATIVE_DAYS_MINUS120",
      "updatedAt": "RELATIVE_DAYS_MINUS5"
    },
    {
      "id": "p7",
      "name": "Marketing Site Refresh",
      "description": "Refresh landing pages and pricing page with new messaging and visuals.",
      "cover": "",
      "status": "active",
      "priority": "medium",
      "dueDate": "RELATIVE_DAYS_PLUS25",
      "memberIds": [
        "u1",
        "u5",
        "u7"
      ],
      "leadId": "u7",
      "progress": 55,
      "archived": false,
      "teamId": "t2",
      "createdAt": "RELATIVE_DAYS_MINUS40",
      "updatedAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "p8",
      "name": "Payments Integration",
      "description": "Integrate Stripe for subscriptions, invoices and refunds.",
      "cover": "",
      "status": "active",
      "priority": "urgent",
      "dueDate": "RELATIVE_DAYS_PLUS6",
      "memberIds": [
        "u2",
        "u4",
        "u8"
      ],
      "leadId": "u4",
      "progress": 80,
      "archived": false,
      "teamId": "t3",
      "createdAt": "RELATIVE_DAYS_MINUS50",
      "updatedAt": "RELATIVE_DAYS_MINUS0"
    },
    {
      "id": "p9",
      "name": "Security Audit",
      "description": "Third-party penetration test and remediation of findings.",
      "cover": "",
      "status": "on_hold",
      "priority": "high",
      "dueDate": "RELATIVE_DAYS_PLUS40",
      "memberIds": [
        "u2",
        "u6"
      ],
      "leadId": "u2",
      "progress": 15,
      "archived": false,
      "teamId": "t3",
      "createdAt": "RELATIVE_DAYS_MINUS35",
      "updatedAt": "RELATIVE_DAYS_MINUS9"
    },
    {
      "id": "p10",
      "name": "Onboarding Flow",
      "description": "Guided onboarding with checklists and product tours for new users.",
      "cover": "",
      "status": "completed",
      "priority": "medium",
      "dueDate": "RELATIVE_DAYS_MINUS3",
      "memberIds": [
        "u1",
        "u3",
        "u5"
      ],
      "leadId": "u3",
      "progress": 100,
      "archived": false,
      "teamId": "t1",
      "createdAt": "RELATIVE_DAYS_MINUS80",
      "updatedAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "p11",
      "name": "Help Center",
      "description": "Searchable knowledge base with articles and video guides.",
      "cover": "",
      "status": "active",
      "priority": "low",
      "dueDate": "RELATIVE_DAYS_PLUS70",
      "memberIds": [
        "u3",
        "u5",
        "u7"
      ],
      "leadId": "u3",
      "progress": 25,
      "archived": false,
      "teamId": "t1",
      "createdAt": "RELATIVE_DAYS_MINUS15",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    }
  ],
  "issues": [
    {
      "id": "i1",
      "number": 101,
      "title": "User authentication flow",
      "description": "Implement login, register, and password reset flows.",
      "status": "in_progress",
      "priority": "high",
      "severity": "major",
      "reporterId": "u1",
      "assigneeId": "u2",
      "sprintId": "s1",
      "milestone": "MVP",
      "labelIds": [
        "l2",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [
        "c1",
        "c2"
      ],
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS5",
      "updatedAt": "RELATIVE_DAYS_MINUS0"
    },
    {
      "id": "i2",
      "number": 102,
      "title": "Homepage hero section",
      "description": "Design and implement the hero section with animations.",
      "status": "done",
      "priority": "medium",
      "severity": "minor",
      "reporterId": "u1",
      "assigneeId": "u5",
      "sprintId": "s1",
      "milestone": "MVP",
      "labelIds": [
        "l5",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [
        "c3"
      ],
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS4",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "i3",
      "number": 103,
      "title": "Fix responsive layout issues",
      "description": "Navigation breaks on tablet viewports.",
      "status": "review",
      "priority": "high",
      "severity": "critical",
      "reporterId": "u5",
      "assigneeId": "u2",
      "sprintId": "s1",
      "milestone": "MVP",
      "labelIds": [
        "l1",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS3",
      "updatedAt": "RELATIVE_DAYS_MINUS0"
    },
    {
      "id": "i4",
      "number": 104,
      "title": "Add dark mode support",
      "description": "Implement dark mode toggle and theme persistence.",
      "status": "backlog",
      "priority": "low",
      "severity": "trivial",
      "reporterId": "u3",
      "assigneeId": null,
      "sprintId": "s1",
      "milestone": "v2",
      "labelIds": [
        "l3",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS2",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "i5",
      "number": 105,
      "title": "User profile page",
      "description": "Create editable user profile page with avatar upload.",
      "status": "done",
      "priority": "medium",
      "severity": "major",
      "reporterId": "u1",
      "assigneeId": "u5",
      "sprintId": "s2",
      "milestone": "MVP",
      "labelIds": [
        "l2",
        "l5"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS20",
      "updatedAt": "RELATIVE_DAYS_MINUS8"
    },
    {
      "id": "i6",
      "number": 106,
      "title": "Settings page layout",
      "description": "Build settings page with tabbed navigation.",
      "status": "done",
      "priority": "medium",
      "severity": "minor",
      "reporterId": "u1",
      "assigneeId": "u2",
      "sprintId": "s2",
      "milestone": "MVP",
      "labelIds": [
        "l2",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS19",
      "updatedAt": "RELATIVE_DAYS_MINUS7"
    },
    {
      "id": "i7",
      "number": 107,
      "title": "Password reset flow",
      "description": "Implement forgot password and reset email flow.",
      "status": "closed",
      "priority": "high",
      "severity": "major",
      "reporterId": "u1",
      "assigneeId": "u2",
      "sprintId": "s2",
      "milestone": "MVP",
      "labelIds": [
        "l2",
        "l8"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS18",
      "updatedAt": "RELATIVE_DAYS_MINUS7"
    },
    {
      "id": "i8",
      "number": 201,
      "title": "Offline data sync",
      "description": "Sync data when device comes back online.",
      "status": "in_progress",
      "priority": "high",
      "severity": "critical",
      "reporterId": "u2",
      "assigneeId": "u8",
      "sprintId": "s3",
      "milestone": "v1",
      "labelIds": [
        "l2",
        "l8"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p2",
      "createdAt": "RELATIVE_DAYS_MINUS5",
      "updatedAt": "RELATIVE_DAYS_MINUS0"
    },
    {
      "id": "i9",
      "number": 202,
      "title": "Push notifications setup",
      "description": "Integrate push notification service.",
      "status": "done",
      "priority": "medium",
      "severity": "major",
      "reporterId": "u2",
      "assigneeId": "u4",
      "sprintId": "s3",
      "milestone": "v1",
      "labelIds": [
        "l2",
        "l8"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p2",
      "createdAt": "RELATIVE_DAYS_MINUS4",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "i10",
      "number": 203,
      "title": "Mobile navigation redesign",
      "description": "Bottom tab navigation for mobile.",
      "status": "backlog",
      "priority": "low",
      "severity": "minor",
      "reporterId": "u6",
      "assigneeId": "u6",
      "sprintId": "s3",
      "milestone": "v1",
      "labelIds": [
        "l5",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p2",
      "createdAt": "RELATIVE_DAYS_MINUS3",
      "updatedAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "i11",
      "number": 301,
      "title": "Rate limiting middleware",
      "description": "Implement rate limiting per API key.",
      "status": "todo",
      "priority": "high",
      "severity": "major",
      "reporterId": "u2",
      "assigneeId": "u4",
      "sprintId": "s4",
      "milestone": "v1",
      "labelIds": [
        "l2",
        "l8"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p3",
      "createdAt": "RELATIVE_DAYS_MINUS2",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "i12",
      "number": 302,
      "title": "Redis caching layer",
      "description": "Cache frequent API responses in Redis.",
      "status": "backlog",
      "priority": "medium",
      "severity": "major",
      "reporterId": "u2",
      "assigneeId": "u8",
      "sprintId": "s4",
      "milestone": "v1",
      "labelIds": [
        "l3",
        "l8"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p3",
      "createdAt": "RELATIVE_DAYS_MINUS1",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "i13",
      "number": 108,
      "title": "Footer and site navigation",
      "description": "Build the shared footer and main navigation links.",
      "status": "done",
      "priority": "medium",
      "severity": "minor",
      "reporterId": "u1",
      "assigneeId": "u7",
      "sprintId": "s1",
      "milestone": "MVP",
      "labelIds": [
        "l2",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS6",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "i14",
      "number": 109,
      "title": "Contact form validation",
      "description": "Add client-side validation to the contact form.",
      "status": "done",
      "priority": "low",
      "severity": "minor",
      "reporterId": "u1",
      "assigneeId": "u2",
      "sprintId": "s1",
      "milestone": "MVP",
      "labelIds": [
        "l2",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS6",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "i15",
      "number": 401,
      "title": "Color token palette",
      "description": "Define semantic color tokens for light and dark themes.",
      "status": "done",
      "priority": "high",
      "severity": "major",
      "reporterId": "u7",
      "assigneeId": "u6",
      "sprintId": "s5",
      "milestone": "v1",
      "labelIds": [
        "l5"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p4",
      "createdAt": "RELATIVE_DAYS_MINUS27",
      "updatedAt": "RELATIVE_DAYS_MINUS15"
    },
    {
      "id": "i16",
      "number": 402,
      "title": "Typography scale",
      "description": "Set heading and body type scale.",
      "status": "done",
      "priority": "medium",
      "severity": "minor",
      "reporterId": "u7",
      "assigneeId": "u5",
      "sprintId": "s5",
      "milestone": "v1",
      "labelIds": [
        "l5"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p4",
      "createdAt": "RELATIVE_DAYS_MINUS27",
      "updatedAt": "RELATIVE_DAYS_MINUS16"
    },
    {
      "id": "i17",
      "number": 403,
      "title": "Spacing and radius tokens",
      "description": "Document spacing and border radius values.",
      "status": "closed",
      "priority": "low",
      "severity": "trivial",
      "reporterId": "u7",
      "assigneeId": "u7",
      "sprintId": "s5",
      "milestone": "v1",
      "labelIds": [
        "l4",
        "l5"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p4",
      "createdAt": "RELATIVE_DAYS_MINUS26",
      "updatedAt": "RELATIVE_DAYS_MINUS14"
    },
    {
      "id": "i18",
      "number": 404,
      "title": "Button component",
      "description": "Variants, sizes and loading state.",
      "status": "done",
      "priority": "high",
      "severity": "major",
      "reporterId": "u7",
      "assigneeId": "u6",
      "sprintId": "s6",
      "milestone": "v1",
      "labelIds": [
        "l2",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p4",
      "createdAt": "RELATIVE_DAYS_MINUS9",
      "updatedAt": "RELATIVE_DAYS_MINUS5"
    },
    {
      "id": "i19",
      "number": 405,
      "title": "Input and select fields",
      "description": "Text input, select and validation states.",
      "status": "done",
      "priority": "high",
      "severity": "major",
      "reporterId": "u7",
      "assigneeId": "u5",
      "sprintId": "s6",
      "milestone": "v1",
      "labelIds": [
        "l2",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p4",
      "createdAt": "RELATIVE_DAYS_MINUS9",
      "updatedAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "i20",
      "number": 406,
      "title": "Card component",
      "description": "Header, content and footer slots.",
      "status": "done",
      "priority": "medium",
      "severity": "minor",
      "reporterId": "u7",
      "assigneeId": "u6",
      "sprintId": "s6",
      "milestone": "v1",
      "labelIds": [
        "l2",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p4",
      "createdAt": "RELATIVE_DAYS_MINUS8",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "i21",
      "number": 407,
      "title": "Modal and dialog",
      "description": "Accessible dialog with focus trapping.",
      "status": "in_progress",
      "priority": "medium",
      "severity": "major",
      "reporterId": "u7",
      "assigneeId": "u7",
      "sprintId": "s6",
      "milestone": "v1",
      "labelIds": [
        "l2",
        "l7"
      ],
      "attachmentIds": [],
      "commentIds": [],
      "projectId": "p4",
      "createdAt": "RELATIVE_DAYS_MINUS7",
      "updatedAt": "RELATIVE_DAYS_MINUS0"
    }
  ],
  "tasks": [
    {
      "id": "tk1",
      "title": "Write project documentation",
      "description": "",
      "status": "done",
      "priority": "medium",
      "labelIds": [
        "l4"
      ],
      "assigneeId": "u1",
      "dueDate": "RELATIVE_DAYS_MINUS2",
      "sprintId": null,
      "estimate": 4,
      "projectId": "p1",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS10",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "tk2",
      "title": "Set up CI/CD pipeline",
      "description": "",
      "status": "in_progress",
      "priority": "high",
      "labelIds": [
        "l8"
      ],
      "assigneeId": "u4",
      "dueDate": "RELATIVE_DAYS_PLUS3",
      "sprintId": null,
      "estimate": 8,
      "projectId": "p3",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS7",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "tk3",
      "title": "Create user survey",
      "description": "Send out user feedback survey for the new design.",
      "status": "todo",
      "priority": "medium",
      "labelIds": [
        "l5"
      ],
      "assigneeId": "u3",
      "dueDate": "RELATIVE_DAYS_PLUS5",
      "sprintId": null,
      "estimate": 3,
      "projectId": "p1",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS4",
      "updatedAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "tk4",
      "title": "Review accessibility compliance",
      "description": "",
      "status": "backlog",
      "priority": "low",
      "labelIds": [
        "l4",
        "l9"
      ],
      "assigneeId": null,
      "dueDate": "RELATIVE_DAYS_PLUS14",
      "sprintId": null,
      "estimate": 6,
      "projectId": "p1",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS3",
      "updatedAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "tk5",
      "title": "Performance audit",
      "description": "Run lighthouse audit and fix issues.",
      "status": "todo",
      "priority": "medium",
      "labelIds": [
        "l3",
        "l9"
      ],
      "assigneeId": "u2",
      "dueDate": "RELATIVE_DAYS_PLUS10",
      "sprintId": null,
      "estimate": 5,
      "projectId": "p1",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS2",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "tk6",
      "title": "Database schema review",
      "description": "",
      "status": "in_progress",
      "priority": "urgent",
      "labelIds": [
        "l8",
        "l10"
      ],
      "assigneeId": "u8",
      "dueDate": "RELATIVE_DAYS_PLUS1",
      "sprintId": null,
      "estimate": 3,
      "projectId": "p2",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS5",
      "updatedAt": "RELATIVE_DAYS_MINUS0"
    },
    {
      "id": "tk7",
      "title": "Update onboarding flow",
      "description": "",
      "status": "backlog",
      "priority": "low",
      "labelIds": [
        "l2",
        "l7"
      ],
      "assigneeId": null,
      "dueDate": "RELATIVE_DAYS_PLUS20",
      "sprintId": null,
      "estimate": 8,
      "projectId": "p4",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS10",
      "updatedAt": "RELATIVE_DAYS_MINUS10"
    },
    {
      "id": "tk8",
      "title": "Set up error tracking",
      "description": "Integrate Sentry or similar tool.",
      "status": "done",
      "priority": "medium",
      "labelIds": [
        "l8"
      ],
      "assigneeId": "u4",
      "dueDate": "RELATIVE_DAYS_MINUS1",
      "sprintId": null,
      "estimate": 4,
      "projectId": "p3",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS14",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "tk9",
      "title": "Prepare Q4 roadmap review",
      "description": "Compile status and risks for the quarterly review.",
      "status": "todo",
      "priority": "high",
      "labelIds": [
        "l4"
      ],
      "assigneeId": "u1",
      "dueDate": "RELATIVE_DAYS_MINUS1",
      "sprintId": null,
      "estimate": 4,
      "projectId": "p1",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS6",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "tk10",
      "title": "Approve homepage mockups",
      "description": "",
      "status": "in_progress",
      "priority": "medium",
      "labelIds": [
        "l5"
      ],
      "assigneeId": "u1",
      "dueDate": "RELATIVE_DAYS_PLUS4",
      "sprintId": null,
      "estimate": 2,
      "projectId": "p1",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS5",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "tk11",
      "title": "Customer portal scope sign-off",
      "description": "",
      "status": "backlog",
      "priority": "low",
      "labelIds": [
        "l4"
      ],
      "assigneeId": "u1",
      "dueDate": "RELATIVE_DAYS_PLUS12",
      "sprintId": null,
      "estimate": 3,
      "projectId": "p5",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS8",
      "updatedAt": "RELATIVE_DAYS_MINUS8"
    },
    {
      "id": "tk12",
      "title": "Draft customer interview script",
      "description": "",
      "status": "in_progress",
      "priority": "medium",
      "labelIds": [
        "l5"
      ],
      "assigneeId": "u3",
      "dueDate": "RELATIVE_DAYS_PLUS1",
      "sprintId": null,
      "estimate": 3,
      "projectId": "p5",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS4",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "tk13",
      "title": "Update FAQ content",
      "description": "",
      "status": "todo",
      "priority": "low",
      "labelIds": [
        "l4"
      ],
      "assigneeId": "u3",
      "dueDate": "RELATIVE_DAYS_MINUS2",
      "sprintId": null,
      "estimate": 2,
      "projectId": "p5",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS9",
      "updatedAt": "RELATIVE_DAYS_MINUS4"
    },
    {
      "id": "tk14",
      "title": "Build onboarding illustrations",
      "description": "",
      "status": "in_progress",
      "priority": "medium",
      "labelIds": [
        "l5"
      ],
      "assigneeId": "u6",
      "dueDate": "RELATIVE_DAYS_PLUS3",
      "sprintId": null,
      "estimate": 6,
      "projectId": "p4",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS6",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "tk15",
      "title": "Audit mobile tab bar spacing",
      "description": "",
      "status": "todo",
      "priority": "high",
      "labelIds": [
        "l5",
        "l7"
      ],
      "assigneeId": "u6",
      "dueDate": "RELATIVE_DAYS_PLUS6",
      "sprintId": null,
      "estimate": 3,
      "projectId": "p2",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS3",
      "updatedAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "tk16",
      "title": "Review design tokens",
      "description": "",
      "status": "review",
      "priority": "medium",
      "labelIds": [
        "l5"
      ],
      "assigneeId": "u7",
      "dueDate": "RELATIVE_DAYS_PLUS2",
      "sprintId": null,
      "estimate": 3,
      "projectId": "p4",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS5",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "tk17",
      "title": "Homepage typography pass",
      "description": "",
      "status": "todo",
      "priority": "high",
      "labelIds": [
        "l5",
        "l7"
      ],
      "assigneeId": "u7",
      "dueDate": "RELATIVE_DAYS_PLUS0",
      "sprintId": null,
      "estimate": 4,
      "projectId": "p1",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS4",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "tk18",
      "title": "Review API gateway PRs",
      "description": "",
      "status": "todo",
      "priority": "medium",
      "labelIds": [
        "l8"
      ],
      "assigneeId": "u2",
      "dueDate": "RELATIVE_DAYS_PLUS1",
      "sprintId": null,
      "estimate": 2,
      "projectId": "p3",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS2",
      "updatedAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "tk19",
      "title": "Write offline sync tests",
      "description": "",
      "status": "todo",
      "priority": "medium",
      "labelIds": [
        "l9"
      ],
      "assigneeId": "u8",
      "dueDate": "RELATIVE_DAYS_PLUS5",
      "sprintId": null,
      "estimate": 5,
      "projectId": "p2",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS3",
      "updatedAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "tk20",
      "title": "Load test the gateway",
      "description": "",
      "status": "todo",
      "priority": "high",
      "labelIds": [
        "l8",
        "l9"
      ],
      "assigneeId": "u4",
      "dueDate": "RELATIVE_DAYS_PLUS8",
      "sprintId": null,
      "estimate": 6,
      "projectId": "p3",
      "parentId": null,
      "createdAt": "RELATIVE_DAYS_MINUS2",
      "updatedAt": "RELATIVE_DAYS_MINUS2"
    }
  ],
  "sprints": [
    {
      "id": "s1",
      "name": "Sprint 4",
      "goal": "Complete website homepage and authentication flow.",
      "status": "active",
      "startDate": "RELATIVE_DAYS_MINUS7",
      "endDate": "RELATIVE_DAYS_PLUS7",
      "projectId": "p1",
      "issueIds": [
        "i1",
        "i2",
        "i3",
        "i4",
        "i13",
        "i14"
      ],
      "completedAt": null,
      "createdAt": "RELATIVE_DAYS_MINUS7"
    },
    {
      "id": "s2",
      "name": "Sprint 3",
      "goal": "Implement user profile pages and settings.",
      "status": "completed",
      "startDate": "RELATIVE_DAYS_MINUS21",
      "endDate": "RELATIVE_DAYS_MINUS7",
      "projectId": "p1",
      "issueIds": [
        "i5",
        "i6",
        "i7"
      ],
      "completedAt": "RELATIVE_DAYS_MINUS7",
      "createdAt": "RELATIVE_DAYS_MINUS21"
    },
    {
      "id": "s3",
      "name": "Sprint 1",
      "goal": "Set up project structure and core navigation.",
      "status": "active",
      "startDate": "RELATIVE_DAYS_MINUS3",
      "endDate": "RELATIVE_DAYS_PLUS11",
      "projectId": "p2",
      "issueIds": [
        "i8",
        "i9",
        "i10"
      ],
      "completedAt": null,
      "createdAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "s4",
      "name": "Sprint 5",
      "goal": "API rate limiting and caching layer.",
      "status": "planning",
      "startDate": "RELATIVE_DAYS_PLUS2",
      "endDate": "RELATIVE_DAYS_PLUS16",
      "projectId": "p3",
      "issueIds": [
        "i11",
        "i12"
      ],
      "completedAt": null,
      "createdAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "s5",
      "name": "Sprint 2",
      "goal": "Define color tokens, typography and spacing scale.",
      "status": "completed",
      "startDate": "RELATIVE_DAYS_MINUS28",
      "endDate": "RELATIVE_DAYS_MINUS14",
      "projectId": "p4",
      "issueIds": [
        "i15",
        "i16",
        "i17"
      ],
      "completedAt": "RELATIVE_DAYS_MINUS14",
      "createdAt": "RELATIVE_DAYS_MINUS28"
    },
    {
      "id": "s6",
      "name": "Sprint 6",
      "goal": "Build core components: buttons, inputs and cards.",
      "status": "active",
      "startDate": "RELATIVE_DAYS_MINUS10",
      "endDate": "RELATIVE_DAYS_PLUS4",
      "projectId": "p4",
      "issueIds": [
        "i18",
        "i19",
        "i20",
        "i21"
      ],
      "completedAt": null,
      "createdAt": "RELATIVE_DAYS_MINUS10"
    }
  ],
  "events": [
    {
      "id": "e1",
      "title": "Sprint 4 ends",
      "description": "",
      "date": "RELATIVE_DAYS_PLUS7",
      "endDate": null,
      "type": "sprint",
      "projectId": "p1",
      "assigneeId": null,
      "allDay": true
    },
    {
      "id": "e2",
      "title": "Design review meeting",
      "description": "Review homepage designs with the team.",
      "date": "RELATIVE_DAYS_PLUS2",
      "endDate": "RELATIVE_DAYS_PLUS2",
      "type": "meeting",
      "projectId": "p1",
      "assigneeId": null,
      "allDay": false
    },
    {
      "id": "e3",
      "title": "MVP Launch",
      "description": "",
      "date": "RELATIVE_DAYS_PLUS20",
      "endDate": null,
      "type": "release",
      "projectId": "p1",
      "assigneeId": null,
      "allDay": true
    },
    {
      "id": "e4",
      "title": "Offline data sync due",
      "description": "",
      "date": "RELATIVE_DAYS_PLUS11",
      "endDate": null,
      "type": "deadline",
      "projectId": "p2",
      "assigneeId": "u8",
      "allDay": true
    },
    {
      "id": "e5",
      "title": "Sprint planning",
      "description": "Plan Sprint 5 with the team.",
      "date": "RELATIVE_DAYS_PLUS1",
      "endDate": "RELATIVE_DAYS_PLUS1",
      "type": "meeting",
      "projectId": "p3",
      "assigneeId": null,
      "allDay": false
    },
    {
      "id": "e6",
      "title": "Fix responsive layout due",
      "description": "",
      "date": "RELATIVE_DAYS_PLUS3",
      "endDate": null,
      "type": "deadline",
      "projectId": "p1",
      "assigneeId": "u2",
      "allDay": true
    }
  ],
  "milestones": [
    {
      "id": "m1",
      "title": "MVP Launch",
      "description": "Minimum viable product release.",
      "date": "RELATIVE_DAYS_PLUS20",
      "projectId": "p1",
      "completed": false,
      "createdAt": "RELATIVE_DAYS_MINUS60"
    },
    {
      "id": "m2",
      "title": "v2 Release",
      "description": "Feature complete version 2.",
      "date": "RELATIVE_DAYS_PLUS60",
      "projectId": "p1",
      "completed": false,
      "createdAt": "RELATIVE_DAYS_MINUS60"
    },
    {
      "id": "m3",
      "title": "Beta Launch",
      "description": "Closed beta for mobile app.",
      "date": "RELATIVE_DAYS_PLUS30",
      "projectId": "p2",
      "completed": false,
      "createdAt": "RELATIVE_DAYS_MINUS45"
    },
    {
      "id": "m4",
      "title": "API v1 Stable",
      "description": "Stable API release.",
      "date": "RELATIVE_DAYS_PLUS45",
      "projectId": "p3",
      "completed": false,
      "createdAt": "RELATIVE_DAYS_MINUS90"
    },
    {
      "id": "m5",
      "title": "Design System v1",
      "description": "First stable design system release.",
      "date": "RELATIVE_DAYS_PLUS15",
      "projectId": "p4",
      "completed": false,
      "createdAt": "RELATIVE_DAYS_MINUS30"
    }
  ],
  "files": [
    {
      "id": "f1",
      "name": "homepage-mockup-v2.fig",
      "url": "#",
      "size": 2400000.0,
      "type": "figma",
      "uploadedById": "u5",
      "version": 2,
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "f2",
      "name": "design-system-colors.pdf",
      "url": "#",
      "size": 850000.0,
      "type": "pdf",
      "uploadedById": "u7",
      "version": 1,
      "projectId": "p4",
      "createdAt": "RELATIVE_DAYS_MINUS5"
    },
    {
      "id": "f3",
      "name": "api-spec-v3.yaml",
      "url": "#",
      "size": 120000.0,
      "type": "yaml",
      "uploadedById": "u2",
      "version": 3,
      "projectId": "p3",
      "createdAt": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "f4",
      "name": "sprint-4-report.pdf",
      "url": "#",
      "size": 1200000.0,
      "type": "pdf",
      "uploadedById": "u1",
      "version": 1,
      "projectId": "p1",
      "createdAt": "RELATIVE_DAYS_MINUS0"
    },
    {
      "id": "f5",
      "name": "app-icon-set.zip",
      "url": "#",
      "size": 3500000.0,
      "type": "zip",
      "uploadedById": "u5",
      "version": 1,
      "projectId": "p2",
      "createdAt": "RELATIVE_DAYS_MINUS7"
    }
  ],
  "comments": [
    {
      "id": "c1",
      "text": "I've started working on this. Will share a PR soon.",
      "authorId": "u2",
      "createdAt": "RELATIVE_DAYS_MINUS3",
      "updatedAt": "RELATIVE_DAYS_MINUS3",
      "attachmentIds": []
    },
    {
      "id": "c2",
      "text": "Make sure to include OAuth support for Google login.",
      "authorId": "u1",
      "createdAt": "RELATIVE_DAYS_MINUS2",
      "updatedAt": "RELATIVE_DAYS_MINUS2",
      "attachmentIds": []
    },
    {
      "id": "c3",
      "text": "Here are some reference designs from the mood board.",
      "authorId": "u5",
      "createdAt": "RELATIVE_DAYS_MINUS1",
      "updatedAt": "RELATIVE_DAYS_MINUS1",
      "attachmentIds": []
    },
    {
      "id": "c4",
      "text": "The responsive issue happens at 768px width.",
      "authorId": "u5",
      "createdAt": "RELATIVE_DAYS_MINUS2",
      "updatedAt": "RELATIVE_DAYS_MINUS2",
      "attachmentIds": []
    },
    {
      "id": "c5",
      "text": "Fixed in latest commit. Can you verify on your iPad?",
      "authorId": "u2",
      "createdAt": "RELATIVE_DAYS_MINUS1",
      "updatedAt": "RELATIVE_DAYS_MINUS1",
      "attachmentIds": []
    }
  ],
  "activities": [
    {
      "id": "a1",
      "type": "status_change",
      "message": "Moved 'User authentication flow' to In Progress",
      "userId": "u2",
      "targetId": "i1",
      "targetType": "issue",
      "projectId": "p1",
      "timestamp": "RELATIVE_DAYS_MINUS0"
    },
    {
      "id": "a2",
      "type": "comment",
      "message": "Commented on 'Fix responsive layout issues'",
      "userId": "u5",
      "targetId": "i3",
      "targetType": "issue",
      "projectId": "p1",
      "timestamp": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "a3",
      "type": "create",
      "message": "Created issue 'Rate limiting middleware'",
      "userId": "u2",
      "targetId": "i11",
      "targetType": "issue",
      "projectId": "p3",
      "timestamp": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "a4",
      "type": "assignment",
      "message": "Assigned 'Offline data sync' to Henry Chen",
      "userId": "u2",
      "targetId": "i8",
      "targetType": "issue",
      "projectId": "p2",
      "timestamp": "RELATIVE_DAYS_MINUS3"
    },
    {
      "id": "a5",
      "type": "complete",
      "message": "Completed sprint 'Sprint 3'",
      "userId": "u1",
      "targetId": "s2",
      "targetType": "sprint",
      "projectId": "p1",
      "timestamp": "RELATIVE_DAYS_MINUS7"
    },
    {
      "id": "a6",
      "type": "create",
      "message": "Created project 'Customer Portal'",
      "userId": "u1",
      "targetId": "p5",
      "targetType": "project",
      "projectId": "p5",
      "timestamp": "RELATIVE_DAYS_MINUS20"
    },
    {
      "id": "a7",
      "type": "upload",
      "message": "Uploaded design mockups for homepage",
      "userId": "u5",
      "targetId": "f1",
      "targetType": "file",
      "projectId": "p1",
      "timestamp": "RELATIVE_DAYS_MINUS1"
    },
    {
      "id": "a8",
      "type": "status_change",
      "message": "Moved 'Database schema review' to In Progress",
      "userId": "u8",
      "targetId": "i8",
      "targetType": "issue",
      "projectId": "p2",
      "timestamp": "RELATIVE_DAYS_MINUS0"
    },
    {
      "id": "a9",
      "type": "comment",
      "message": "Commented on 'User profile page'",
      "userId": "u3",
      "targetId": "i5",
      "targetType": "issue",
      "projectId": "p1",
      "timestamp": "RELATIVE_DAYS_MINUS2"
    },
    {
      "id": "a10",
      "type": "assignment",
      "message": "Assigned 'Set up CI/CD pipeline' to David Lee",
      "userId": "u2",
      "targetId": "tk2",
      "targetType": "task",
      "projectId": "p3",
      "timestamp": "RELATIVE_DAYS_MINUS4"
    },
    {
      "id": "a11",
      "type": "create",
      "message": "Created issue 'Push notifications setup'",
      "userId": "u4",
      "targetId": "i9",
      "targetType": "issue",
      "projectId": "p2",
      "timestamp": "RELATIVE_DAYS_MINUS5"
    }
  ]
} as WorkspaceSnapshot;

export const WorkspaceHandlers = [
  http.get("/api/workspace/snapshot", () =>
    HttpResponse.json({ status: 200, msg: "Success", data: WorkspaceSnapshotSeed })
  ),
];
