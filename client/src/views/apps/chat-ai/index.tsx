import {
  ArrowUp,
  BookOpen,
  Lightbulb,
  Mic,
  Paperclip,
  Plus,
  Search,
  Settings,
  SquarePen,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppShell } from "../shared";
import aiLogo from "src/assets/images/backgrounds/chat-ai-logo.png";

/**
 * V2 续 · /apps/chat-ai 逐项 1:1
 *
 * 取证：标题卡 "Chat-AI" + "Home / Chat-AI"（1142×62）；主体卡 1142×602，
 * 内部 `flex min-h-[600px] h-[calc(100vh-300px)]` = 342px 历史栏 + 798px 会话区。
 * 历史栏 5 条问答，会话区 Welcome, Cameron + 3 张 242×174 提示卡 + 758×124 输入卡。
 */
const HISTORY = [
  {
    q: "How can I improve my skincare routine?",
    a: "Cleanse twice daily, moisturize, and always wear sunscreen. Drink plenty of water and avoid touching your face unnecessarily.",
  },
  {
    q: "What is React?",
    a: "React is a JavaScript library for building user interfaces, especially single-page applications.",
  },
  {
    q: "How much water should I drink daily?",
    a: "Aim for about 8 glasses (2 liters) daily, but adjust based on your activity level and climate.",
  },
  {
    q: "How can I develop a daily reading habit?",
    a: "Set aside 10-15 minutes daily, choose books you enjoy, and keep a book handy during idle times.",
  },
  {
    q: "What is a hook in React?",
    a: "Hooks are functions like useState and useEffect that let you use state and lifecycle features in functional components.",
  },
];

const PROMPTS = [
  { icon: BookOpen, text: "Can you explain photosynthesis in simple terms" },
  { icon: SquarePen, text: "Can you help me write a blog post about digital marketing" },
  { icon: Lightbulb, text: "What are some marketing strategies for a new startup?" },
];

const ChatAI = () => {
  return (
    <AppShell title="Chat-AI">
      <Card className="gap-0" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="flex h-[calc(100vh-300px)] min-h-[600px]">
          {/* 342px 历史栏 */}
          <aside className="hidden w-full max-w-[350px] lg:block">
            <div className="flex h-full w-full flex-col border-e p-0">
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search Chat History..." className="ps-9" />
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-2">
                {HISTORY.map((h) => (
                  <button key={h.q} className="block w-full text-start">
                    <p className="truncate text-sm font-semibold">{h.q}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{h.a}</p>
                  </button>
                ))}
              </div>
              <div className="p-4">
                <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="me-1 h-4 w-4" /> <span>New Chat</span>
                </Button>
              </div>
            </div>
          </aside>

          {/* 798px 会话区 */}
          <div className="flex w-[70%] shrink-0 grow flex-col">
            <div className="h-full min-h-0 flex-1">
              <div className="flex h-full flex-col p-5">
                {/* 欢迎区 */}
                <div className="flex flex-grow flex-col items-center justify-center gap-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <img src={aiLogo} alt="chat-ai-logo" className="h-[60px] w-[60px]" />
                    <h3 className="text-3xl font-bold tracking-tight">Welcome, Cameron</h3>
                    <p className="text-sm text-muted-foreground">How can I help you today?</p>
                  </div>
                </div>
                {/* 3 张提示卡 */}
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {PROMPTS.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      className="flex h-full min-h-[170px] flex-col justify-between gap-2.5 rounded-(--radius) border p-4 text-start transition-colors hover:bg-muted/50"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold leading-snug">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 底部输入卡 */}
            <div className="w-full p-4 sm:p-5">
              <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-4 shadow-none">
                <div className="flex items-center gap-3">
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <textarea
                    placeholder="Ask me anything..."
                    rows={1}
                    className="min-h-6 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <Mic className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <ArrowUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm"><Paperclip className="me-1 h-3.5 w-3.5" /> <span>Attach</span></Button>
                  <Button variant="outline" size="sm"><Settings className="me-1 h-3.5 w-3.5" /> <span>Settings</span></Button>
                  <Button variant="outline" size="sm"><WandSparkles className="me-1 h-3.5 w-3.5" /> <span>Options</span></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
};

export default ChatAI;
