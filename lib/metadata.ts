import { Metadata } from "next";

export function constructMetadata({
  title = "OpenClaw",
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
    applicationName: "OpenClaw",
    keywords: [
      "AI",
      "replicate",
      "AI Platform",
      "SaaS Application",
      "JavaScript",
    ],
    icons: {
      icon: '/favicon.ico',
    },
    authors: { name: "OpenClaw", url: "https://openclaw.ai" },
    creator: "OpenClaw",

    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
