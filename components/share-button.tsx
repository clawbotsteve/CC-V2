import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Link as LinkIcon, Mail, Send, Share, Facebook, Twitter } from "lucide-react";

/**
 * Props:
 * - url: canonical URL to share (required for most platforms)
 * - title: title/caption
 * - text: extra text/description (e.g., the AI prompt)
 * - files: optional File[] for Web Share API (images/videos)
 * - hashtags: comma-separated (for X)
 * - via: your handle (for X)
 */
type ShareButtonProps = {
  url: string;
  title?: string;
  text?: string;
  files?: File[];
  hashtags?: string; // e.g. "ai,generative,design"
  via?: string;      // e.g. "coregenai"
  className?: string;
};

export default function ShareButton({
  url,
  title = "",
  text = "",
  files,
  hashtags,
  via,
  className,
}: ShareButtonProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text || title);
  const encodedTitle = encodeURIComponent(title);
  const encodedHashtags = hashtags ? encodeURIComponent(hashtags) : "";
  const encodedVia = via ? encodeURIComponent(via) : "";

  const onNativeShare = async () => {
    if (!("share" in navigator)) return;
    try {
      // Web Share Level 2: share media when supported
      const canShareFiles = !!files?.length && (navigator as any).canShare?.({ files });
      await (navigator as any).share(
        canShareFiles
          ? { title, text, url, files }
          : { title, text, url }
      );
    } catch {
      // user cancelled or not supported — ignore
    }
  };

  const open = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}${encodedHashtags ? `&hashtags=${encodedHashtags}` : ""
      }${encodedVia ? `&via=${encodedVia}` : ""}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${title ? title + " — " : ""}${text ? text + " " : ""}${url}`
    )}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(
      `${text ? text + "\n\n" : ""}${url}`
    )}`,
    // Instagram does not support direct web share links.
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // Optional: toast here if you have a toast system
      // toast.success("Link copied");
    } catch {
      // no clipboard access
    }
  };

  const hasWebShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className} variant="default">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Share this</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasWebShare && (
          <DropdownMenuItem onClick={onNativeShare}>
            <Share className="mr-2 h-4 w-4" />
            <span>Quick Share (device)</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => open(shareLinks.facebook)}>
          {/* Simple SVG brand mark to avoid extra deps */}
          <Facebook className="mr-2 h-4 w-4" />
          <span>Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(shareLinks.x)}>
          <Twitter className="mr-2 h-4 w-4" />
          <span>X (Twitter)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(shareLinks.whatsapp)}>
          <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 text-foreground" fill="hsl(var(--foreground))" aria-hidden>
            <path d="M12.04 2C6.57 2 2.13 6.44 2.13 11.91c0 2.1.59 4.04 1.71 5.74L2 22l4.49-1.77a9.82 9.82 0 0 0 5.55 1.67c5.47 0 9.91-4.44 9.91-9.91C22 6.44 17.56 2 12.09 2h-.05zm5.76 14.2c-.24.68-1.43 1.29-2 1.32-.54.03-1.23.04-1.99-.12-.45-.1-1.03-.33-1.78-.65-3.11-1.35-5.13-4.49-5.29-4.71-.16-.22-1.27-1.69-1.27-3.22 0-1.52.8-2.27 1.08-2.58.28-.31.62-.39.83-.39h.6c.19 0 .45-.07.68.52.24.59.82 2.03.89 2.18.07.15.12.33.01.54-.12.22-.18.36-.36.56-.18.2-.37.45-.53.6-.17.15-.35.32-.15.64.2.31.9 1.48 1.94 2.4 1.33 1.18 2.45 1.55 2.79 1.72.34.17.54.15.75-.09.21-.24.87-1.01 1.1-1.35.23-.34.46-.29.77-.17.31.12 2 1 2.35 1.18.35.18.58.27.66.42.08.15.08.88-.16 1.56z" />
          </svg>
          <span>WhatsApp</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(shareLinks.telegram)}>
          <Send className="mr-2 h-4 w-4" />
          <span>Telegram</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => (window.location.href = shareLinks.email)}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Email</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyLink}>
          <LinkIcon className="mr-2 h-4 w-4" />
          <span>Copy link</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs opacity-70">
          Instagram: no official web share—use Quick Share or Copy link.
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
