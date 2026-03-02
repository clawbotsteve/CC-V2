"use client";

import { Button } from "./ui/button";
import { 
  Sparkles, 
  Users, 
  Plus, 
  Shield, 
  CircleUser, 
  Bell, 
  LogOut,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { useProModal } from "@/hooks/use-pro-modal";
import { useUserContext } from "./layout/user-context";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useTheme } from "next-themes";

export default function ClientNavbarRight() {
  const proModal = useProModal();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const {
    availableCredit: credits,
    avatarCreated,
    maxAvatar,
    isLoading,
    plan,
  } = useUserContext();

  const isPro = plan && plan !== "free";
  const activeTheme = theme === "system" ? "system" : theme;

  return (
    <div className="flex flex-row gap-3 sm:gap-4 items-center w-full sm:w-auto">
      {/* Button group with avatar dropdown */}
      <div className="hidden sm:flex flex-row items-center gap-3">
        <Button asChild variant="default" className="gap-2">
          <Link href="/tools/influencers">
            <Plus className="h-4 w-4" />
            Create New Influencer
          </Link>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="overflow-hidden rounded-full border-0 ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56 rounded-lg" align="end">
            {/* User Info Section */}
            <div className="px-1 py-1.5">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                  <AvatarFallback className="rounded-lg">
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.fullName || user?.firstName || ""}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress || ""}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Plan Badge & Usage Stats */}
            <DropdownMenuGroup>
              {isPro && (
                <DropdownMenuItem className="cursor-default bg-foreground/10">
                  <span className="inline-flex items-center">
                    <Shield className="inline h-4 w-4 mr-1 text-blue-500" />
                    PRO
                  </span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="cursor-default">
                <Sparkles className="mr-2 h-4 w-4 text-foreground" />
                <span className="text-popover-foreground">
                  {isLoading ? "..." : `${credits || 0} Credits`}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-default">
                <Users className="mr-2 h-4 w-4 text-foreground" />
                <span className="text-popover-foreground">
                  {isLoading ? "..." : `${avatarCreated || 0}/${maxAvatar || 0} Influencers`}
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Navigation Items */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile">
                  <CircleUser className="mr-2 h-4 w-4 text-foreground" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings/notifications">
                  <Bell className="mr-2 h-4 w-4 text-foreground" />
                  Notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Theme Toggle */}
            <DropdownMenuItem className="cursor-default focus:bg-transparent">
              <div className="inline-flex rounded-sm border border-border overflow-hidden">
                <Button
                  size="sm"
                  variant={activeTheme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="rounded-none px-3 py-1 h-9"
                  aria-label="Light theme"
                >
                  <Sun className="h-4 w-4" />
                </Button>
                <div className="w-px bg-border" />
                <Button
                  size="sm"
                  variant={activeTheme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="rounded-none px-3 py-1 h-9"
                  aria-label="Dark theme"
                >
                  <Moon className="h-4 w-4" />
                </Button>
                <div className="w-px bg-border" />
                <Button
                  size="sm"
                  variant={activeTheme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="rounded-none px-3 py-1 h-9"
                  aria-label="System theme"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4 text-foreground" />
              <SignOutButton>
                <span>Sign out</span>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
