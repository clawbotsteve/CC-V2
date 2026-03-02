"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import React from "react";
import { ActiveThemeProvider } from "./active-theme";
import { UserProvider } from "./user-context";
import { CreditWarningModal } from "../modal/CreditWarningModal";
import SubscriptionExpiryChecker from "../subscription-expiry-checker";
import Onboarding from "../onboarding";

export default function Providers({
  activeThemeValue,
  children,
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  // we need the resolvedTheme value to set the baseTheme for clerk based on the dark or light theme
  const { resolvedTheme } = useTheme();

  // Only use signInUrl/signUpUrl if they are local paths (not external URLs)
  // External URLs in these props cause redirects instead of showing embedded component
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL;
  const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL;
  
  const isSignInUrlLocal = signInUrl && !signInUrl.startsWith("http://") && !signInUrl.startsWith("https://");
  const isSignUpUrlLocal = signUpUrl && !signUpUrl.startsWith("http://") && !signUpUrl.startsWith("https://");

  const clerkProviderProps: any = {
    appearance: {
      baseTheme: resolvedTheme === "dark" ? dark : undefined,
    },
    allowedRedirectOrigins: [
      process.env.NEXT_PUBLIC_APP_URL!
    ],
  };

  // Only add signInUrl/signUpUrl if they are local paths
  // This allows the embedded component to work when URLs are external
  if (isSignInUrlLocal) {
    clerkProviderProps.signInUrl = signInUrl;
  }
  if (isSignUpUrlLocal) {
    clerkProviderProps.signUpUrl = signUpUrl;
  }

  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <ClerkProvider {...clerkProviderProps}>
          <UserProvider>
            <Onboarding />
            <SubscriptionExpiryChecker />

            {children}

            <CreditWarningModal />
          </UserProvider>
        </ClerkProvider>
      </ActiveThemeProvider>
    </>
  );
}
