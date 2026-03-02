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

const appearanceSchema = z.object({
  gender: z.enum(["male", "female",]),
  race: z.string().optional(),
  eyeColor: z.string().optional(),
  bodyShape: z.string().optional(),
});

type AppearanceFormValues = z.infer<typeof appearanceSchema>;

interface Props {
  data: AppearanceFormValues;
  update: (data: Partial<Props["data"]>) => void;
}

const genderOptions = [
  { label: "Male", value: "male" as const, emoji: "♂", icon: "👨" },
  { label: "Female", value: "female" as const, emoji: "♀", icon: "👩" },
];

const raceOptions = [
  { value: "South Asian", emoji: "🇮🇳" },
  { value: "White", emoji: "🇪🇺" },
  { value: "Black", emoji: "🇺🇸" },
  { value: "East Asian", emoji: "🇨🇳" },
  { value: "Latino", emoji: "🇲🇽" },
  { value: "Middle Eastern", emoji: "🇸🇦" },
];

const eyeColors = [
  { label: "Brown", value: "brown", color: "#8B4513" },
  { label: "Blue", value: "blue", color: "#1E90FF" },
  { label: "Green", value: "green", color: "#2E8B57" },
  { label: "Hazel", value: "hazel", color: "#C8B575" },
  { label: "Gray", value: "gray", color: "#808080" },
];

const bodyShapes = [
  { value: "Slim", icon: "👤" },
  { value: "Average", icon: "👕" },
  { value: "Athletic", icon: "🏋️" },
  { value: "Plus", icon: "🧔" },
];

export default function StepAppearance({ data, update }: Props) {
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: data,
    mode: "onChange",
  });

  React.useEffect(() => {
    form.reset(data);
  }, [data]);

  React.useEffect(() => {
    const sub = form.watch((values) => update(values));
    return () => sub.unsubscribe();
  }, [form, update]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Gender */}
        <FormField
          control={form.control}
          name="gender"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Gender
              </FormLabel>
              <div className="grid grid-cols-3 gap-2">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => form.setValue("gender", option.value)}
                    className={`relative h-24 flex flex-col justify-center items-center text-sm font-medium border rounded-xl transition-all
                      ${
                        form.watch("gender") === option.value
                          ? "bg-purple-100/60 border-purple-500 text-purple-800 dark:bg-purple-900/20"
                          : "bg-muted border-muted hover:bg-accent"
                      }`}
                  >
                    {form.watch("gender") === option.value && (
                      <div className="absolute -top-1.5 -right-1.5 bg-purple-500 rounded-full p-0.5 shadow">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <span className="text-xl mb-1">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Race */}
        <FormField
          control={form.control}
          name="race"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Race
              </FormLabel>
              <div className="flex flex-wrap gap-2">
                {raceOptions.map((race) => (
                  <button
                    key={race.value}
                    type="button"
                    onClick={() => form.setValue("race", race.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all
                      ${
                        form.watch("race") === race.value
                          ? "bg-blue-100/60 border-blue-500 text-blue-800 dark:bg-blue-900/20"
                          : "bg-muted border-muted hover:bg-accent"
                      }`}
                  >
                    <span className="text-lg">{race.emoji}</span>
                    <span>{race.value}</span>
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Eye Color */}
        <FormField
          control={form.control}
          name="eyeColor"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Eye Color
              </FormLabel>
              <div className="flex flex-wrap gap-3">
                {eyeColors.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => form.setValue("eyeColor", value)}
                    className={`flex flex-col items-center justify-center w-20 h-20 border rounded-xl text-xs font-medium transition-all
                      ${
                        form.watch("eyeColor") === value
                          ? "bg-emerald-100/60 border-emerald-500 text-emerald-800 dark:bg-emerald-900/20"
                          : "bg-muted border-muted hover:bg-accent"
                      }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border shadow-inner mb-2"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Body Shape */}
        <FormField
          control={form.control}
          name="bodyShape"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Sparkles className="h-4 w-4 text-pink-500" />
                Body Type
              </FormLabel>
              <div className="grid grid-cols-4 gap-2">
                {bodyShapes.map((shape) => (
                  <button
                    key={shape.value}
                    type="button"
                    onClick={() => form.setValue("bodyShape", shape.value)}
                    className={`flex flex-col items-center justify-center h-24 border rounded-xl text-xs font-medium transition-all
                      ${
                        form.watch("bodyShape") === shape.value
                          ? "bg-pink-100/60 border-pink-500 text-pink-800 dark:bg-pink-900/20"
                          : "bg-muted border-muted hover:bg-accent"
                      }`}
                  >
                    <span className="text-xl mb-1">{shape.icon}</span>
                    <span>{shape.value}</span>
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
