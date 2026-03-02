import { AnimatedGradientText } from "./magicui/animated-gradient-text";
import { Palette } from "lucide-react";

interface AiAnimatedHeadingProps {
  heading: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function AiAnimatedHeading({ heading, description, icon, children }: AiAnimatedHeadingProps) {
  return (
    <div className="flex">
      {icon && <div className="text-pink-500 mt-2">{icon}</div>}

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-5xl tracking-tight flex gap-2">
          <AnimatedGradientText className="font-black italic px-2">
            AI
          </AnimatedGradientText>
          {heading}
        </h1>

        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {description} {children && <> | {children}</>}
          </p>
        )}
      </div>
    </div>
  );
}
