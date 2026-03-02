"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUserContext } from "@/components/layout/user-context";

export default function RouteChangeRefetch() {
  const pathname = usePathname();
  const { refetch } = useUserContext();

  useEffect(() => {
    refetch();
  }, [pathname, refetch]);

  return null; // This component just triggers side effect
}
