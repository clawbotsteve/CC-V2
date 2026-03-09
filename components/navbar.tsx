import { UserButton } from "@clerk/nextjs";
import MobileSidebar from "./mobile-sidebar";
import { getApiLimitCount } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";
import ClientNavbarRight from "./client-navbar-right";
import ThemeToggle from "./layout/theme-toggle";
import logo from "@/public/logo.png";
import Image from "next/image";
import Link from "next/link";
import NovuInbox from "@/components/ui/inbox/NovuInbox";

export const company = {
  name: "Tavira Labs",
  logo: logo,
  plan: "Creator",
};

export default async function Navbar() {
  const apiLimitCount = await getApiLimitCount();
  const isPro = await checkSubscription();

  const afterSignOutUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-b border-foreground/15 shadow-sm"
      )}
    >
      {/* ✅ Desktop Header */}
      <div className="hidden sm:flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" size="icon" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </div>

        <div className="flex items-center gap-4">
          <NovuInbox />
          <ClientNavbarRight />
          {/* <ThemeToggle />
          <UserButton afterSignOutUrl="/" /> */}
        </div>
      </div>

      {/* ✅ Mobile Header */}
      <div className="flex sm:hidden h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" size="icon" />
          <ClientNavbarRight />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/">
            <span className="font-heading font-bold text-xl tracking-tight flex items-center">
              Tavira Labs
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* <ThemeToggle /> */}
          {/* <UserButton afterSignOutUrl={afterSignOutUrl} /> */}
        </div>
      </div>
    </header>
  );
}
