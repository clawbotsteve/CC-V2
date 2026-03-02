import { Book, FileText, Video } from "lucide-react";

export const faqCategories = [
  {
    title: "Getting Started",
    icon: <Book className="h-5 w-5" />,
    questions: [
      {
        question: "How do I create my first AI influencer?",
        answer:
          "To create your first AI influencer, click on the 'Create New Influencer' button on your dashboard. Follow the step-by-step process to upload reference images, customize your influencer's appearance, and finalize the creation.",
      },
      {
        question: "What are credits and how do they work?",
        answer:
          "Credits are the currency used for generating content on CoreGen. Different actions consume different amounts of credits. For example, generating a standard image might cost 5 credits, while a high-quality video could cost 30 credits. You receive a monthly credit allowance based on your subscription plan.",
      },
      {
        question: "How many images should I upload for best results?",
        answer:
          "For optimal results, we recommend uploading 6-15 reference images. These should show your desired influencer from different angles and with different expressions. The more diverse the reference images, the better the AI can understand your desired outcome.",
      },
    ],
  },
  {
    title: "Billing & Subscriptions",
    icon: <FileText className="h-5 w-5" />,
    questions: [
      {
        question: "How do I upgrade my subscription?",
        answer:
          "To upgrade your subscription, go to the 'Manage Subscriptions' page from your dashboard. Select the plan you want to upgrade to and follow the payment instructions. Your new plan will be activated immediately, and you'll be charged the prorated difference.",
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer:
          "Yes, you can cancel your subscription at any time. Go to the 'Manage Subscriptions' page and click on 'Cancel Subscription'. Your subscription will remain active until the end of your current billing period.",
      },
      {
        question: "Do unused credits roll over to the next month?",
        answer:
          "No, credits do not roll over to the next month. Your credit balance resets on your monthly renewal date. We recommend using all your credits before they expire.",
      },
    ],
  },
  {
    title: "Content Generation",
    icon: <Video className="h-5 w-5" />,
    questions: [
      {
        question: "What's the difference between SFW and NSFW content?",
        answer:
          "SFW (Safe For Work) content is appropriate for general audiences and can be used in public settings. NSFW (Not Safe For Work) content may contain mature themes, suggestive imagery, or explicit content that is not appropriate for all audiences. NSFW generation is only available on Pro and Elite plans.",
      },
      {
        question: "How long does it take to generate content?",
        answer:
          "Generation times vary based on the type of content and current system load. Images typically take 10-30 seconds to generate. Videos may take 1-3 minutes. Elite plan subscribers receive priority in the generation queue for faster results.",
      },
      {
        question: "Can I edit my generated content?",
        answer:
          "Yes, you can edit your generated content using our AI Image Editor tool. This allows you to make adjustments to lighting, colors, backgrounds, and more. For more substantial changes, we recommend generating new content with updated prompts.",
      },
    ],
  },
]
