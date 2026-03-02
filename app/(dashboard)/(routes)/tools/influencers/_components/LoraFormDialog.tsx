"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GenerationStatus, Influencer, Lora } from "@prisma/client";
import { toast } from "sonner";

// Define form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  phyziroPriceId: z.string().min(2, {
    message: "Phyziro Price ID is required.",
  }),
  listed: z.enum(["published", "archived"]),
});

interface LoraFormDialogProps {
  loraData: (Influencer & { lora?: Lora | null });
  onSubmit: (values: LoraSubmitData) => void;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "link";
  triggerIcon?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export type InfluencerWithLora = (Influencer & { lora?: Lora | null })

export type LoraSubmitData = z.infer<typeof formSchema> & {
  version: string;
  influencerId: string;
  status: GenerationStatus;
};

export function LoraFormDialog({
  loraData,
  onSubmit,
  triggerText = "Manage",
  triggerVariant = "outline",
  triggerIcon = true,
  isOpen,
  onOpenChange,
}: LoraFormDialogProps) {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: loraData.name,
      description: (loraData.lora?.description ?? loraData.description) || "",
      price: loraData.lora?.price ?? 0,
      phyziroPriceId: loraData.lora?.phyziroPriceId || "",
      listed: loraData.lora?.isListed ? "published" : "archived",
    },
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    if (
      values.listed === "published" &&
      (!values.price || !values.phyziroPriceId.trim())
    ) {
      toast.error("Price and Phyziro Price ID are required for published listings.");
      return;
    }

    onSubmit({
      ...values,
      version: "1.0.0",
      influencerId: loraData.id,
      status: loraData.status
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      {/* <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm">
          {triggerIcon && <Pencil className="mr-2 h-4 w-4" />}
          {triggerText}
        </Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit LoRA Details</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LoRA Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter LoRA name"
                      {...field}
                      className="hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter detailed description"
                      {...field}
                      className="hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className="hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phyziroPriceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phyziro Price ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="price_xxx"
                        {...field}
                        className="hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="listed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {["published", "archived"].map((listed) => (
                        <button
                          key={listed}
                          type="button"
                          onClick={() => field.onChange(listed)}
                          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors
                            ${field.value === listed
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-muted hover:bg-muted/80"}`}
                        >
                          {listed.charAt(0).toUpperCase() + listed.slice(1)}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}