"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Info, Lock, Globe, ShieldCheck, ShieldAlert } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfluencerBasicInfo, InfluencerModel, ContentType } from "@/types/influencer";
import { useUserContext } from "@/components/layout/user-context";
import { PLAN_STUDIO } from "@/constants";

const modes = ["character", "style"] as const;
const genders = ["male", "female"] as const;
const models = [InfluencerModel.FLUX_1, InfluencerModel.FLUX_2] as const;
const contentTypes: ContentType[] = ["sfw", "nsfw"];
const stepOptions = [1000, 2000, 4000, 6000, 8000, 10000] as const;
const stepSchema = z.union([
  z.literal(1000),
  z.literal(2000),
  z.literal(4000),
  z.literal(6000),
  z.literal(8000),
  z.literal(10000),
]);

const basicInfoSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(2, "Description is required"),
  gender: z.enum(genders),
  mode: z.enum(modes),
  model: z.enum(models),
  trigger: z.string().optional(),
  step: stepSchema.optional(),
  learningRate: z.number().optional(),
  defaultCaption: z.string().optional(),
  isPublic: z.boolean(),
  contentType: z.enum(["sfw", "nsfw"]),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface Props {
  data: InfluencerBasicInfo;
  update: (data: Partial<Props["data"]>) => void;
}

export default function StepBasicInfo({ data, update }: Props) {
  const { isAdmin, isLoading } = useUserContext()

  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: data,
    mode: "onChange",
  });

  React.useEffect(() => {
    form.reset(data);
  }, [data]);

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      update(values);
    });
    return () => subscription.unsubscribe();
  }, [form, update]);

  const mode = form.watch("mode");
  const gender = form.watch("gender");
  const model = form.watch("model");
  const { plan } = useUserContext();

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => { })} className="space-y-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Name
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The name of your AI character or style.</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="SaraAI"
                    {...field}
                    className="border-2 border-muted bg-muted/50 hover:bg-accent focus:border-purple-500 focus:bg-purple-100/60 focus:dark:bg-purple-900/20 focus:text-purple-800 focus:dark:text-purple-300 transition-all"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Description
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Describe your AI’s personality or style.</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A friendly South Asian AI influencer"
                    {...field}
                    className="border-2 border-muted bg-muted/50 hover:bg-accent focus:border-blue-500 focus:bg-blue-100/60 focus:dark:bg-blue-900/20 focus:text-blue-800 focus:dark:text-blue-300 transition-all min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Model */}
          {plan === PLAN_STUDIO && (
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    Model
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Select the AI model for training. FLUX.2 offers enhanced quality.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {models.map((m) => (
                      <Button
                        key={m}
                        type="button"
                        variant={field.value === m ? "default" : "outline"}
                        onClick={() => field.onChange(m)}
                        className="uppercase"
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Sparkles className="h-4 w-4 text-pink-500" />
                  Gender
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Select the gender for your AI voice and personality.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {genders.map((g) => (
                    <Button
                      key={g}
                      type="button"
                      variant={field.value === g ? "default" : "outline"}
                      onClick={() => field.onChange(g)}
                      className="capitalize"
                    >
                      {g}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mode */}
          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  Mode
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        “Character” for personalities, “Style” for visual
                        themes.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {modes.map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant={field.value === m ? "default" : "outline"}
                      onClick={() => field.onChange(m)}
                      className="capitalize"
                    >
                      {m}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Trigger word – only show if mode is "style" */}
          {mode === "style" && (
            <FormField
              control={form.control}
              name="trigger"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    Trigger Word
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Unique keyword used in prompts to activate the style
                          (e.g. <code>&lt;IssaxStyle&gt;</code>).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="<myStyle>"
                      {...field}
                      className="border-2 border-muted bg-muted/50 hover:bg-accent focus:border-pink-500 focus:bg-pink-100/60 focus:dark:bg-pink-900/20 focus:text-pink-800 focus:dark:text-pink-300 transition-all"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Learning Rate - only show if model is flux-2 */}
          {model === InfluencerModel.FLUX_2 && (
            <FormField
              control={form.control}
              name="learningRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Learning Rate
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Controls how quickly the model learns. Lower is better for more context results. Default is 0.00005.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.00001"
                      placeholder="0.00005"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      value={field.value ?? 0.00005}
                      className="border-2 border-muted bg-muted/50 hover:bg-accent focus:border-indigo-500 focus:bg-indigo-100/60 focus:dark:bg-indigo-900/20 focus:text-indigo-800 focus:dark:text-indigo-300 transition-all"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Step */}
          {!isLoading && isAdmin && (
            <FormField
              control={form.control}
              name="step"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    <Sparkles className="h-4 w-4 text-cyan-500" />
                    Step
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the number of steps for inference (e.g. 1000).</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {stepOptions.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant={field.value === s ? "default" : "outline"}
                        onClick={() => field.onChange(s)}
                        className="capitalize"
                      >
                        {s >= 1000 ? `${s / 1000}K` : s}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Visibility & Content Settings */}
          <div className="border-t border-border pt-6 mt-6">
            <h3 className="text-sm font-semibold text-foreground/90 mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-500" />
              Privacy & Content Settings
            </h3>

            {/* Content Type (NSFW/SFW) */}
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    {field.value === "sfw" ? (
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                    )}
                    Content Type
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Label your content as Safe for Work (SFW) or Not Safe for Work (NSFW).</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {contentTypes.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={field.value === type ? "default" : "outline"}
                        onClick={() => field.onChange(type)}
                        className={`uppercase ${field.value === type
                            ? type === "sfw"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                            : ""
                          }`}
                      >
                        {type === "sfw" && <ShieldCheck className="h-4 w-4 mr-1" />}
                        {type === "nsfw" && <ShieldAlert className="h-4 w-4 mr-1" />}
                        {type}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Public/Private Toggle */}
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                      {field.value ? (
                        <Globe className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-indigo-500" />
                      )}
                      {field.value ? "Public" : "Private"}
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      {field.value
                        ? "Your influencer will be visible to other users in the marketplace."
                        : "Your influencer will only be visible to you."}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}
