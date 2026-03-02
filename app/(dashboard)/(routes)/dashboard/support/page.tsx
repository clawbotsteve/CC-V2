"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle, MessageSquare, Search, ChevronRight, FileText, Video, Book, Send, Plus } from "lucide-react"
import PageContainer from "@/components/page-container"
import { faqCategories } from "./_components/faqData"
import Faq from "./_components/faq"
import ContactSupport from "./_components/contactSupport"
import Tickets from "./_components/tickets"
import CrispChat from "@/components/crisp"

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("faq")
  useEffect(() => {
    if (activeTab === "contact" && typeof window !== "undefined") {
      if (window.$crisp) {
        window.$crisp.push(["do", "chat:open"])
      }
    }
  }, [activeTab])
  return (
    <PageContainer>
      <CrispChat />
      <div className="w-full p-4 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Support & Help Center</h1>
          <p className="text-white/70">Find answers to common questions or contact our support team</p>
        </div>

        <div className="relative hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
          <Input
            placeholder="Search for help articles..."
            className="pl-10 border-white/10 bg-white/5 focus:ring-indigo-500 py-6 text-lg"
          />
        </div>

        <Tabs defaultValue="faq" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-b border-white/10 rounded-none p-0 h-auto">
            <TabsTrigger
              value="faq"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 py-3 px-4"
            >
              FAQ
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 py-3 px-4"
            >
              Contact Support
            </TabsTrigger>
            <TabsTrigger
              value="tickets"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 py-3 px-4"
            >
              My Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="pt-6">
            <Faq />
          </TabsContent>

          <TabsContent value="contact" className="pt-6">
            <p className="text-white/70 mt-4">
              Opening Live Chat
            </p>
          </TabsContent>

          <TabsContent value="tickets" className="pt-6">
            <Tickets />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}
