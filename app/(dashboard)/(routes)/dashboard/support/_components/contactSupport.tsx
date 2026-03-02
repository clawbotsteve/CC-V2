import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send } from "lucide-react";
import { useState } from "react";

export default function ContactSupport() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card className="border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription className="text-zinc-600 dark:text-white/70">
              Fill out the form below and our team will get back to you within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-green-400"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Support Ticket Submitted</h3>
                <p className="text-zinc-600 dark:text-white/70 mb-6 max-w-md">
                  Thank you for contacting us. We've received your request and will respond within 24 hours.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
                >
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    className="border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select required>
                    <SelectTrigger className="border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-indigo-500">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10">
                      <SelectItem value="account">Account Issues</SelectItem>
                      <SelectItem value="billing">Billing & Payments</SelectItem>
                      <SelectItem value="technical">Technical Problems</SelectItem>
                      <SelectItem value="content">Content Generation</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select required>
                    <SelectTrigger className="border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-indigo-500">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10">
                      <SelectItem value="low">Low - General Question</SelectItem>
                      <SelectItem value="medium">Medium - Issue Affecting Usage</SelectItem>
                      <SelectItem value="high">High - Critical Problem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    placeholder="Describe your issue in detail"
                    className="w-full h-32 rounded-md border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-zinc-800 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachments">Attachments (Optional)</Label>
                  <div className="border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-lg p-6 text-center hover:border-indigo-500/50 transition-colors">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-zinc-500 dark:text-white/50" />
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-white/70">
                        Drag & drop files or click to upload (max 5MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
                      >
                        Choose Files
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Support Request
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Email Support</h3>
              <p className="text-sm text-zinc-600 dark:text-white/70">support@coregen.ai</p>
              <p className="text-xs text-zinc-500 dark:text-white/50">Response time: 24-48 hours</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Business Hours</h3>
              <p className="text-sm text-zinc-600 dark:text-white/70">Monday - Friday: 9AM - 6PM EST</p>
              <p className="text-xs text-zinc-500 dark:text-white/50">Closed on weekends and holidays</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Pro & Elite Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-white/70">
              Pro and Elite subscribers receive priority support with faster response times.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Basic Plan</span>
                <span className="text-sm text-zinc-600 dark:text-white/70">48 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pro Plan</span>
                <span className="text-sm text-indigo-400">24 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Elite Plan</span>
                <span className="text-sm text-indigo-400">12 hours</span>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
              asChild
            >
              <a href="/dashboard/subscriptions">Upgrade Your Plan</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
