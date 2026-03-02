import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import copy from "copy-to-clipboard";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export const CopyButton = ({ text, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className={`border-border text-foreground hover:bg-muted ${className}`}
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </>
      )}
    </Button>
  );
};
