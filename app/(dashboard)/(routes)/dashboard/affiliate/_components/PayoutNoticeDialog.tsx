import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Banknote } from "lucide-react";

export function PayoutNoticeDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto" // Full width on mobile, auto on desktop
        >
          <Banknote className="h-4 w-4 mr-2" />
          Set Up Payout Method
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw]">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg sm:text-xl"> {/* Larger text on desktop */}
            Payout Setup Unavailable
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm sm:text-base"> {/* Responsive text */}
            You will be able to set this up once you have
            <span className="font-semibold text-green-600"> $100</span> in available earnings.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0"> {/* Stack buttons on mobile */}
          <DialogClose asChild>
            <Button
              type="button"
              className="w-full sm:w-auto" // Full width on mobile
            >
              Got it
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
