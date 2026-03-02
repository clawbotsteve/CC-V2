import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Plus } from "lucide-react";

export default function Tickets() {
  return (
    <Card className="border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/50">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400 dark:text-white/50" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">No Support Tickets</h3>
          <p className="text-gray-600 dark:text-white/70 mb-6 max-w-md">
            You haven't submitted any support tickets yet. If you need help, please create a new ticket.
          </p>
          <Button
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
