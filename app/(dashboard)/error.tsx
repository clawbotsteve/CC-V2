"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Error = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="h-full p-20 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="p-4 rounded-full bg-destructive/10">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Something went wrong on our end
        </h2>
        <p className="text-muted-foreground text-sm">
          We encountered an unexpected error. Please try reloading the page.
        </p>
        <Button onClick={handleReload} variant="default" className="gap-2 mt-4">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default Error;
