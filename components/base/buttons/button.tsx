import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      color: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium:
          "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0",
      },
      size: {
        sm: "h-9 rounded-md px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      color: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, color, size, asChild = false, iconLeading, iconTrailing, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ color, size, className }))}
        ref={ref}
        {...props}
      >
        {iconLeading && <span className="mr-2">{iconLeading}</span>}
        {children}
        {iconTrailing && <span className="ml-2">{iconTrailing}</span>}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

