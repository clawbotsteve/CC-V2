import { Metadata } from "next";

export function constructMetadata({
  title = "Tavira Labs",
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
    applicationName: "Tavira Labs",
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
    authors: { name: "Tavira Labs", url: "https://taviralabs.ai" },
    creator: "Tavira Labs",

    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
