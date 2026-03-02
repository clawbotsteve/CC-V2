"use client";

import { ReactNode } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedGradientText } from "./magicui/animated-gradient-text";

interface HowToUseDrawerProps {
  headerTitle: string;
  headerDescription?: string;
  children: ReactNode;
  triggerClassName?: string;
}

export function HowToUseDrawer({
  headerTitle,
  headerDescription,
  children,
  triggerClassName,
}: HowToUseDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div
          className={cn(
            "group relative flex items-center justify-center max-h-8 mt-4 rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-all duration-500 ease-out hover:bg-slate-300/25 hover:shadow-[inset_0_-5px_10px_#8fdfff3f]",
            triggerClassName
          )}
        >
          <span
            className="absolute inset-0 block h-full w-full animate-gradient rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]"
            style={{
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "destination-out",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "subtract",
              WebkitClipPath: "padding-box",
            }}
          />
          {/* Trigger content goes here */}
          <span className="hidden md:block">🎉</span> <hr className="hidden md:block mx-2 h-4 w-px shrink-0 bg-neutral-500" />
          <AnimatedGradientText className="hidden md:block text-sm font-medium">
            how to use this?
          </AnimatedGradientText>
          <Info className="md:ml-1 size-4 stroke-neutral-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
        </div>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-xl space-y-4 p-4">
          <DrawerHeader>
            <DrawerTitle>{headerTitle}</DrawerTitle>
            {headerDescription && (
              <DrawerDescription>{headerDescription}</DrawerDescription>
            )}
          </DrawerHeader>

          <div>{children}</div>

          <DrawerFooter className="pt-4">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
