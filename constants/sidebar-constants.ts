import {
  Compass,
  Users,
  Sparkles,
  Video,
  WandSparkles,
  Image,
  Pencil,
  MessageSquare,
  DollarSign,
  History,
  Share2,
  LifeBuoy,
  Settings,
  Store,
  ScanFace,
  Brush
} from 'lucide-react';

export const routes = [
  {
    label: "Overview",
    children: [
      {
        label: "Discover",
        icon: Compass,
        href: "/dashboard",
        color: "text-foreground",
      },
      {
        label: "Influencers",
        icon: Users,
        href: "/tools/influencers",
        color: "text-foreground",
      },
      {
        label: "Marketplace",
        icon: Store,
        href: "/dashboard/lora-market",
        color: "text-foreground",
      },
    ]
  },
  {
    label: "Tools",
    children: [
      {
        label: "Generate Image",
        icon: Sparkles,
        href: "/tools/image-generation",
        color: "text-foreground",
      },
      {
        label: "Generate Video",
        icon: Video,
        href: "/tools/video-generation",
        color: "text-foreground",
      },
      {
        label: "Face Enhance",
        icon: Brush,
        href: "/tools/face-enhance",
        color: "text-foreground",
      },
      {
        label: "Face Swap",
        icon: WandSparkles,
        href: "/tools/face-swap",
        color: "text-foreground",
      },
      {
        label: "Upscale",
        icon: Image,
        href: "/tools/image-upscale",
        color: "text-foreground",
      },
      {
        label: "Edit Image",
        icon: Pencil,
        href: "/tools/image-editor",
        color: "text-foreground",
      },
      {
        label: "Generate Prompt",
        icon: MessageSquare,
        href: "/tools/prompt-generation",
        color: "text-foreground",
      }
    ]
  },
  {
    label: "Payments",
    children: [
      {
        label: "Get Credits",
        icon: DollarSign,
        href: "/dashboard/get-credits",
        color: "text-foreground",
      },
      {
        label: "Manage Subscriptions",
        icon: Settings,
        href: "/settings",
        color: "text-foreground",
      },
      {
        label: "Payment History",
        icon: History,
        href: "/dashboard/billing",
        color: "text-foreground",
      }
    ]
  },
  {
    label: "Others",
    children: [
      {
        label: "Affiliate",
        icon: Share2,
        href: "/dashboard/affiliate",
        color: "text-foreground",
      },
      {
        label: "Support",
        icon: LifeBuoy,
        href: "/dashboard/support",
        color: "text-foreground",
      }
    ]
  },
];
