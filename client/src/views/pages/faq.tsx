import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    question: "What is an Admin Dashboard?",
    answer:
      "An admin dashboard is a unified interface for monitoring and managing the key data of a business or application in one place.",
  },
  {
    question: "What should an admin dashboard template include?",
    answer:
      "A ready-to-use template typically includes layouts, charts, tables, forms, authentication pages and reusable UI components.",
  },
  {
    question: "Why should I buy admin templates from adminmart?",
    answer:
      "The templates are cleanly structured, responsive and regularly updated, which helps teams ship internal tools faster.",
  },
  {
    question: "Do adminmart offers a money back guarantee?",
    answer:
      "Please check the license terms of the template provider for details about refunds and guarantees.",
  },
];

const TEAM_AVATARS = [
  { src: "/images/profile/user-2.png", fallback: "A" },
  { src: "/images/profile/user-3.png", fallback: "B" },
  { src: "/images/profile/user-6.png", fallback: "C" },
];

/** 1:1 复刻自用户提供的 FAQ 页 UI：顶部标题条 + 居中问答 + 团队咨询卡。 */
export default function FaqPage() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex h-11 items-center justify-between rounded-lg border bg-card px-4 shadow-xs">
        <h1 className="text-xl font-semibold">FAQ</h1>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">FAQ</span>
        </nav>
      </div>

      <div className="flex flex-col gap-4 pb-10 pt-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-1 text-base text-muted-foreground">
            Get to know more about ready-to-use admin dashboard templates
          </p>
        </div>

        <Accordion className="mx-auto w-full max-w-3xl">
          {FAQS.map(({ question, answer }) => (
            <AccordionItem key={question} value={question} className="border-border">
              <AccordionTrigger className="py-4 text-left text-sm font-medium hover:no-underline [&>svg]:size-4">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-6 text-center">
          <div className="flex -space-x-2">
            {TEAM_AVATARS.map(({ src, fallback }) => (
              <Avatar
                key={src}
                className="size-11 border-2 border-card ring-0"
              >
                <AvatarImage src={src} alt="Team member" />
                <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <h3 className="text-2xl font-bold">Still have questions</h3>
          <p className="text-base text-muted-foreground">
            Can't find the answer you're looking for ? Please chat to our friendly team.
          </p>
          <Button
            size="sm"
            className="h-9 rounded-md px-2.5 text-sm"
            onClick={() => toast.info("Live chat is not available yet")}
          >
            Chat with us
          </Button>
        </div>
      </div>
    </div>
  );
}
