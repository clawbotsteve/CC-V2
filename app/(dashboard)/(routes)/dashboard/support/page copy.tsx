"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MessageCircle, Mail, Clock } from "lucide-react";
import PageContainer from "@/components/page-container";

export default function ContactSupportPage() {
  const router = useRouter()

  return (
    <PageContainer scrollable={false}>
      <div className="bg-white dark:bg-zinc-950 p-0 sm:p-6 md:p-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="rounded-xl text-card-foreground shadow w-full max-w-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col space-y-1.5 p-4 sm:p-6 text-center">
            <h1 className="tracking-tight text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200">
              Need Help?
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
              We're here to assist you with any questions or concerns
            </p>
          </div>

          <div className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Contact Support
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  Send us an email and we'll get back to you as soon as possible
                </p>
              </div>

              <a href="mailto:ai.modelforge@gmail.com" className="w-full sm:w-auto">
                <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 w-full sm:w-auto">
                  <Mail className="w-4 h-4" />
                  Contact ai.modelforge@gmail.com
                </Button>
              </a>

            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 sm:pt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                Response Time: Usually within 24 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
