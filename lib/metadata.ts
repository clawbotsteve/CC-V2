import { Metadata } from "next";

export function constructMetadata({
  title = "TraviaLabs",
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
    applicationName: "TraviaLabs",
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
    authors: { name: "TraviaLabs", url: "https://taviralabs.ai" },
    creator: "TraviaLabs",

    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
