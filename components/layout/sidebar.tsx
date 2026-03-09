"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Bell, ChevronsDown, CreditCard, Image as ImageIcon, LogOut, UserCircle, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { routes } from "@/constants/sidebar-constants";
import { cn } from "@/lib/utils";
import logo from "@/public/logo.png";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserContext } from "./user-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { UserAvatarProfile } from "../user-avatar-profile";
import { SignOutButton, useUser } from "@clerk/nextjs";
import ThemeToggle from "./theme-toggle";
import { PlanLabel } from "../plan-label";

export const company = {
  name: "Tavira Labs",
  logo: logo,
  plan: "Creator",
};

interface AppSidebarProps {
  apiLimitCount: number;
  isPro: boolean;
}

export default function AppSidebar({
  apiLimitCount = 0,
  isPro = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { user } = useUser();
  const router = useRouter();

  // Extract pathname from sign-in URL (handles both local paths and external URLs)
  const getSignInPath = () => {
    const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
    try {
      const url = new URL(signInUrl);
      return url.pathname;
    } catch {
      // If it's not a full URL, assume it's already a path
      return signInUrl.startsWith("/") ? signInUrl : `/${signInUrl}`;
    }
  };
  const { open: isSidebarOpen, toggleSidebar } = useSidebar();
  const {
    availableCredit: credits,
    avatarCreated,
    maxAvatar,
    plan,
    isAdmin,
    isLoading,
  } = useUserContext();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/50 flex-row items-center justify-between sm:justify-left px-4 py-0 sm:p-0">
        <div
          className={cn(
            "flex items-center",
            !isSidebarOpen ? "py-4" : "p-4"
          )}
        >
          {isSidebarOpen && (
            <div className="flex gap-2">
              <Link href="/">
                <span className="font-display font-bold text-xl tracking-tight flex items-center">
                  Tavira Labs
                  <span className="font-semibold bg-primary rounded-[2px] px-1 py-0 text-black text-sm ml-0.5 inline-flex items-center">
                    AI
                  </span>
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* ✅ Mobile Close Button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
          >
            <X className="h-5 w-5 text-foreground" />
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden scrollbar-thin">

        {isMobile && (
          <SidebarGroup key="mobile-info">
            <SidebarGroupLabel>Usage</SidebarGroupLabel>
            <div className="mx-3 mt-2 rounded-xl bg-muted px-4 py-3 border border-border shadow-sm">
              <div className="text-sm text-foreground font-medium flex justify-between">
                <span>Credits</span>
                <span>{isLoading ? "..." : credits}</span>
              </div>
              <div className="text-sm text-foreground font-medium flex justify-between mt-2">
                <span>Influencers</span>
                <span>{isLoading ? "..." : `${avatarCreated} / ${maxAvatar}`}</span>
              </div>
            </div>
          </SidebarGroup>
        )}

        {routes.filter((section) => {
          // if (section?.adminOnly && !isAdmin) return false;
          return true;
        }).map((section) => (
          <SidebarGroup
            key={section.label}
          >
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarMenu>
              {section.children.map((route) => {
                const Icon = route.icon || ImageIcon;
                return (
                  <SidebarMenuItem key={route.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={route.label}
                      isActive={pathname === route.href}
                    >
                      <Link
                      id={route.label.toLowerCase().replace(/\s+/g, '_')}
                        href={route.href}
                        onClick={() => {
                          if (isMobile) toggleSidebar();
                        }}>
                        <Icon className={route.color || "text-current"} />
                        <span>{route.label}</span>
                        {(route as any).active && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={user}
                    />
                  )}
                  <ChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem className="bg-foreground/20">
                    <PlanLabel plan={plan} />
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push('/profile')}
                  >
                    <UserCircle className='mr-2 h-4 w-4 text-foreground' />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className='mr-2 h-4 w-4 text-foreground' />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <ThemeToggle />
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className='mr-2 h-4 w-4 text-foreground' />
                  <SignOutButton redirectUrl={getSignInPath()} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
