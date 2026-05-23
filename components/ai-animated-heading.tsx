import { AnimatedGradientText } from "./magicui/animated-gradient-text";
import { Palette } from "lucide-react";

interface AiAnimatedHeadingProps {
  heading: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  /**
   * Slim variant — drops the heading from text-5xl to text-2xl on
   * desktop and tightens the flex gap. Use on dense tool pages
   * (Image Generator, Ad Studio, etc.) where the giant default
   * heading wastes vertical real estate above the workspace.
   * Default unchanged for backwards compat with other tool pages.
   */
  compact?: boolean;
}

export default function AiAnimatedHeading({ heading, description, icon, children, compact = false }: AiAnimatedHeadingProps) {
  return (
    <div className="flex">
      {icon && <div className={`text-pink-500 ${compact ? "mt-0.5" : "mt-2"}`}>{icon}</div>}

      <div className={`flex flex-col ${compact ? "gap-0.5" : "gap-2"}`}>
        <h1
          className={`${
            compact ? "text-2xl md:text-3xl" : "text-2xl md:text-5xl"
          } tracking-tight flex gap-2`}
        >
          <AnimatedGradientText className="font-black italic px-2">
            AI
          </AnimatedGradientText>
          {heading}
        </h1>

        {description && (
          <p className={`${compact ? "text-xs" : "text-sm"} text-muted-foreground max-w-2xl`}>
            {description} {children && <> | {children}</>}
          </p>
        )}
      </div>
    </div>
  );
}
