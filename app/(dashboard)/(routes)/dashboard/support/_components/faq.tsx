import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { faqCategories } from "./faqData";
import { ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Player } from "@/components/vidstack/player";

export default function Faq() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {faqCategories.map((category, index) => (
          <Card key={index} className="border-border bg-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {category.icon}
                </div>
                <CardTitle>{category.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.questions.map((faq, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground pl-6">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
              >
                View All {category.title} Articles
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card className="border-border bg-background">
          <CardHeader>
            <CardTitle>Video Tutorials</CardTitle>
            <CardDescription>
              Learn how to use CoreGen with our step-by-step video guides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                "Creating Your First AI Influencer",
                "Generating High-Quality Images",
                "Advanced Prompt Engineering",
              ].map((title, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-video w-full sm:max-w-md md:max-w-xl lg:max-w-3xl">
                    <Player
                      src="youtube/d7RITdy17RU"
                      poster="/assets/poster.png"
                      title="CoreGen Tutorial"
                    />
                  </div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">3:45 • Beginner</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
            >
              View All Tutorials
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
