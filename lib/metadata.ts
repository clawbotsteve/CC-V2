import { Metadata } from "next";

export function constructMetadata({
  title = "TaviraLabs",
  description = "AI-Powered Creative Studio",

  noIndex = false,
}: {
  title?: string;
  description?: string;

  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    applicationName: "TaviraLabs",
    keywords: [
      "AI",
      "AI Content Creation",
      "AI Influencer",
      "Image Generation",
      "Video Generation",
      "SaaS Application",
    ],
    icons: {
      icon: '/favicon.ico',
    },
    authors: { name: "TaviraLabs", url: "https://taviralabs.ai" },
    creator: "TaviraLabs",

    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
