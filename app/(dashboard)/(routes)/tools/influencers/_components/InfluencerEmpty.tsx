import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateClick?: () => void;
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
      <div className="text-center max-w-md space-y-4">
        <div className="flex justify-center mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="currentColor" 
            width="120" 
            height="120" 
            viewBox="-4 -2 24 24" 
            preserveAspectRatio="xMinYMin" 
            className="text-muted-foreground"
          >
            <path d="M8 0a8 8 0 0 1 8 8v12l-4.919-1-3.08 1-2.992-1L0 20V8a8 8 0 0 1 8-8zm6 8A6 6 0 0 0 2 8v9.561l3.138-.626 2.871.96 2.955-.96 3.036.618V8zm-8.5 2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>
        </div>
        <h3 className="text-xl font-medium">
          Your AI influencer studio is empty
        </h3>
        <p className="text-muted-foreground">
          <Button
            variant="default"
            onClick={onCreateClick}
            className="gap-2 inline-flex items-center mx-1"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Create your first influencer
          </Button>
          {" "}
        </p>
      </div>
    </div>
  );
}
