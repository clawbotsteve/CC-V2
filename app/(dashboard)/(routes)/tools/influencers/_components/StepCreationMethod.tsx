"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, Sparkles } from "lucide-react";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const creationMethodSchema = z.object({
  trainingType: z.enum(["full_ai", "photo", "video"]),
});

type CreationMethodFormValues = z.infer<typeof creationMethodSchema>;

interface Props {
  data: {
    trainingType: "full_ai" | "photo" | "video";
  };
  update: (data: Partial<Props["data"]>) => void;
}

const options = [
  {
    value: "full_ai",
    title: "Full AI",
    description: "Generate using a single photo",
    icon: "🤖",
    color: "purple",
  },
  {
    value: "photo",
    title: "Photo Upload",
    description: "Train with multiple images",
    icon: "📷",
    color: "blue",
  },
  {
    value: "video",
    title: "Video Upload",
    description: "Train from a short video",
    icon: "🎥",
    color: "pink",
  },
];

export default function StepCreationMethod({ data, update }: Props) {
  const form = useForm<CreationMethodFormValues>({
    resolver: zodResolver(creationMethodSchema),
    defaultValues: data,
    mode: "onChange",
  });

  React.useEffect(() => {
    form.reset(data);
  }, [data]);

  React.useEffect(() => {
    const subscription = form.watch((values) => update(values));
    return () => subscription.unsubscribe();
  }, [form, update]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="trainingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Creation Method
              </FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {options.map((option) => {
                  const isSelected = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all h-32 flex flex-col justify-between ${
                        isSelected
                          ? getSelectedClasses(option.color)
                          : "border-muted bg-muted/50 hover:bg-accent"
                      }`}
                    >
                      {isSelected && (
                        <div className={getCheckBadgeClasses(option.color)}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="text-3xl">{option.icon}</div>
                      <div>
                        <div className="font-semibold text-sm">
                          {option.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

// Helper functions to return complete class strings
function getSelectedClasses(color: string) {
  switch (color) {
    case "purple":
      return "border-purple-500 bg-purple-100/30 dark:bg-purple-900/20 shadow-lg";
    case "blue":
      return "border-blue-500 bg-blue-100/30 dark:bg-blue-900/20 shadow-lg";
    case "pink":
      return "border-pink-500 bg-pink-100/30 dark:bg-pink-900/20 shadow-lg";
    default:
      return "border-purple-500 bg-purple-100/30 dark:bg-purple-900/20 shadow-lg";
  }
}

function getCheckBadgeClasses(color: string) {
  switch (color) {
    case "purple":
      return "absolute -top-2 -right-2 bg-purple-500 p-1 rounded-full shadow-md";
    case "blue":
      return "absolute -top-2 -right-2 bg-blue-500 p-1 rounded-full shadow-md";
    case "pink":
      return "absolute -top-2 -right-2 bg-pink-500 p-1 rounded-full shadow-md";
    default:
      return "absolute -top-2 -right-2 bg-purple-500 p-1 rounded-full shadow-md";
  }
}
