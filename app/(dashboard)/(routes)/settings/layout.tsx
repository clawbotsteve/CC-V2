"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Globe,
  Settings2,
  CreditCard,
  BarChart3,
  Users,
  Tag,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const settingsNav = [
  {
    label: "Personal Profile",
    href: "/settings/personal-profile",
    icon: User,
  },
  {
    label: "Profile",
    href: "/settings/profile",
    icon: Globe,
  },
  {
    label: "Settings",
    href: "/settings/preferences",
    icon: Settings2,
  },
  {
    label: "Subscription",
    href: "/settings/subscription",
    icon: CreditCard,
  },
  {
    label: "My Usage",
    href: "/settings/usage",
    icon: BarChart3,
  },
  {
    label: "Members",
    href: "/settings/members",
    icon: Users,
  },
  {
    label: "Promo Code",
    href: "/settings/promo-code",
    icon: Tag,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <h1 className="text-xl font-bold">Account</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-white/10 bg-white/5 p-2"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar */}
        <aside
          className={cn(
            "shrink-0 md:w-56",
            mobileOpen ? "block" : "hidden md:block"
          )}
        >
          <nav className="sticky top-24 space-y-1">
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/settings/personal-profile" &&
                  pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-white border border-indigo-500/20"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-indigo-400"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content area */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
