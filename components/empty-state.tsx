import { Users } from "lucide-react";
import InfluencerCreateTrigger from "../app/(dashboard)/(routes)/tools/influencers/_components/InfluencerCreateTrigger";

export function EmptyState() {
  return (
    <div className="border text-card-foreground bg-card dark:bg-card/95 border-border/50 shadow-lg rounded-lg overflow-hidden">
      <div className="p-6 flex flex-col items-center justify-center py-12">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 ring-4 ring-background shadow-xl">
          <Users className="h-8 w-8 text-purple-500 dark:text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          No Influencers Yet
        </h3>
        <p className="text-muted-foreground text-center text-sm max-w-sm mb-6">
          Create your first AI influencer to get started with your virtual
          personality
        </p>
      </div>
    </div>
  );
}
