// app/layout.tsx
import { Inter, Space_Grotesk } from "next/font/google";
import { constructMetadata } from "@/lib/metadata";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { ModalProvider } from "@/components/modal-provider";
import "./globals.css";
import ThemeProvider from "@/components/layout/theme-provider";
import { cn } from "@/lib/utils";
import Providers from "@/components/layout/providers";
import { cookies } from "next/headers";
import RouteChangeRefetch from "@/lib/route-change-fetch";
import dynamic from "next/dynamic";
import { AffiliateTracker } from "@/components/affiliate-tracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata = constructMetadata();

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#0a0a0f",
  system: "#0a0a0f", // Default to dark
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("theme")?.value as string;

  const CrispWithNoSSR = dynamic(
    () => import('@/components/crisp')
  )

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{ scrollBehavior: "smooth" }}
    >
      <head>
        <meta
          name="theme-color"
          content={META_THEME_COLORS.system}
          id="theme-color"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                // Default to dark if no theme is saved
                const isDark = savedTheme !== 'light';

                document.documentElement.classList.toggle('dark', isDark);
                document.getElementById('theme-color').setAttribute(
                  'content',
                  isDark ? '${META_THEME_COLORS.dark}' : '${META_THEME_COLORS.light}'
                );
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={cn(
          "bg-background overflow-hidden overscroll-none font-sans antialiased",
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <NextTopLoader showSpinner={false} color="hsl(var(--primary))" />
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
            storageKey="theme"
            value={{
              light: "light",
              dark: "dark",
              system: "system",
            }}
          >
            <Providers activeThemeValue={activeThemeValue}>
              <Toaster richColors theme="dark" />
              <ModalProvider />
              <RouteChangeRefetch /> {/* needed for credit calc */}
              <AffiliateTracker />
              {children}
            </Providers>
          </ThemeProvider>
        </NuqsAdapter>

        <CrispWithNoSSR />
      </body>
    </html>
  );
}
