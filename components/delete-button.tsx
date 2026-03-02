"use client";

import { useState, forwardRef, ButtonHTMLAttributes } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface DeleteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onConfirmDelete?: () => Promise<void> | void;
  title?: string;
  description?: string;
}

export const DeleteButton = forwardRef<HTMLButtonElement, DeleteButtonProps>(
  (
    {
      onConfirmDelete,
      className,
      children,
      title = "Delete Image",
      description = "Are you sure you want to delete this image? This action cannot be undone.",
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
      if (loading || !onConfirmDelete) return;
      setLoading(true);
      try {
        await onConfirmDelete();
          console.log("Delete confirmed"); 
        setOpen(false);
      } catch (error) {
        console.error("Delete failed:", error);
      } finally {
        setLoading(false);
      }
    };
     const handleCancel = () => {
      console.log("Delete canceled");
      setOpen(false);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            disabled={loading}
            className={cn(
              "inline-flex items-center justify-center text-destructive bg-transparent hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-full transition",
              loading && "cursor-not-allowed opacity-70",
              className
            )}
            {...props}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              children || <Trash2 className="h-4 w-4" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="top"
          className="z-50 w-64 rounded-lg border border-destructive/20 bg-background shadow-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
          </div>

          <p className="text-sm text-muted-foreground">{description}</p>

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-md text-foreground hover:bg-muted"
              onClick={handleCancel}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              variant="destructive"
              className="rounded-md"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

DeleteButton.displayName = "DeleteButton";
