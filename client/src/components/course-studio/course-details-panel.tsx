import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ImageIcon } from "lucide-react";
import { Course } from "./types";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  thumbnail: z.string().optional(),
  categoryId: z.number().optional().nullable(),
  level: z.string().optional(),
  language: z.string().optional(),
  isFree: z.boolean().optional(),
  price: z.number().optional(),
  learningOutcomes: z.string().optional(),
  prerequisites: z.string().optional(),
  status: z.string().optional(),
  waitlistEnabled: z.boolean().optional(),
  landingPageEnabled: z.boolean().optional(),
  salesHeadline: z.string().optional(),
  salesSubheadline: z.string().optional(),
  salesVideoUrl: z.string().optional(),
  salesFeatures: z.string().optional(), // newline-separated
  salesTestimonialsRaw: z.string().optional(), // JSON
  salesFaqRaw: z.string().optional(), // JSON
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseDetailsPanelProps {
  course: Course;
  onSave: (values: CourseFormValues) => Promise<void>;
  onSaveStatusChange: (status: string) => void;
}

export function CourseDetailsPanel({ course, onSave, onSaveStatusChange }: CourseDetailsPanelProps) {
  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const c = course as any;

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: course.title || "",
      slug: course.slug || "",
      description: course.description || "",
      shortDescription: course.shortDescription || "",
      thumbnail: course.thumbnail || "",
      categoryId: course.categoryId ?? null,
      level: course.level || "BEGINNER",
      language: course.language || "English",
      isFree: course.isFree ?? true,
      price: course.price || 0,
      learningOutcomes: course.learningOutcomes || "",
      prerequisites: course.prerequisites || "",
      status: course.status || "DRAFT",
      waitlistEnabled: c.waitlistEnabled ?? false,
      landingPageEnabled: c.landingPageEnabled ?? false,
      salesHeadline: c.salesHeadline || "",
      salesSubheadline: c.salesSubheadline || "",
      salesVideoUrl: c.salesVideoUrl || "",
      salesFeatures: Array.isArray(c.salesFeatures) ? (c.salesFeatures as string[]).join("\n") : "",
      salesTestimonialsRaw: c.salesTestimonials ? JSON.stringify(c.salesTestimonials, null, 2) : "[]",
      salesFaqRaw: c.salesFaq ? JSON.stringify(c.salesFaq, null, 2) : "[]",
    },
  });

  useEffect(() => {
    form.reset({
      title: course.title || "",
      slug: course.slug || "",
      description: course.description || "",
      shortDescription: course.shortDescription || "",
      thumbnail: course.thumbnail || "",
      categoryId: course.categoryId ?? null,
      level: course.level || "BEGINNER",
      language: course.language || "English",
      isFree: course.isFree ?? true,
      price: course.price || 0,
      learningOutcomes: course.learningOutcomes || "",
      prerequisites: course.prerequisites || "",
      status: course.status || "DRAFT",
      waitlistEnabled: (course as any).waitlistEnabled ?? false,
      landingPageEnabled: (course as any).landingPageEnabled ?? false,
      salesHeadline: (course as any).salesHeadline || "",
      salesSubheadline: (course as any).salesSubheadline || "",
      salesVideoUrl: (course as any).salesVideoUrl || "",
      salesFeatures: Array.isArray((course as any).salesFeatures) ? ((course as any).salesFeatures as string[]).join("\n") : "",
      salesTestimonialsRaw: (course as any).salesTestimonials ? JSON.stringify((course as any).salesTestimonials, null, 2) : "[]",
      salesFaqRaw: (course as any).salesFaq ? JSON.stringify((course as any).salesFaq, null, 2) : "[]",
    });
  }, [course.id]);

  const formValues = form.watch();
  const formStr = JSON.stringify(formValues);

  const { status, markSaved } = useAutoSave(
    formStr,
    async () => {
      const values = form.getValues();
      const isValid = await form.trigger();
      if (!isValid) return;
      // Transform the special fields before saving
      const { salesFeatures, salesTestimonialsRaw, salesFaqRaw, ...rest } = values as any;
      const saveData: any = { ...rest };
      if (salesFeatures !== undefined) {
        saveData.salesFeatures = (salesFeatures as string).split("\n").filter((s: string) => s.trim());
      }
      try {
        saveData.salesTestimonials = JSON.parse(salesTestimonialsRaw || "[]");
      } catch { saveData.salesTestimonials = []; }
      try {
        saveData.salesFaq = JSON.parse(salesFaqRaw || "[]");
      } catch { saveData.salesFaq = []; }
      await onSave(saveData);
    },
    { enabled: true }
  );

  useEffect(() => {
    onSaveStatusChange(status);
  }, [status, onSaveStatusChange]);

  // Mark saved after initial load
  useEffect(() => {
    markSaved();
  }, [course.id]);

  const isFree = form.watch("isFree");

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">
        <Form {...form}>
          <form className="space-y-8">
            {/* Basic Info */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Course Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Web Development Masterclass" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="web-development-masterclass" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input placeholder="A brief summary of your course" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed description of what students will learn..."
                          className="min-h-[120px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        Thumbnail{" "}
                        <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          {/* Preview */}
                          {field.value && (
                            <div className="relative w-full aspect-video max-w-xs rounded-md overflow-hidden border bg-muted">
                              <img src={field.value} alt="Thumbnail" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => field.onChange("")}
                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          {!field.value && (
                            <div
                              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors max-w-xs"
                              onClick={() => fileInputRef.current?.click()}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={async (e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (!file) return;
                                setUploading(true);
                                try {
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  const res = await fetch("/api/admin/upload", { method: "POST", body: formData, credentials: "include" });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.message);
                                  field.onChange(data.url);
                                } catch (err: any) {
                                  toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                                } finally {
                                  setUploading(false);
                                }
                              }}
                            >
                              {uploading ? (
                                <p className="text-sm text-muted-foreground">Uploading…</p>
                              ) : (
                                <>
                                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm font-medium">Drop image or click to upload</p>
                                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP up to 10 MB</p>
                                </>
                              )}
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploading(true);
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                const res = await fetch("/api/admin/upload", { method: "POST", body: formData, credentials: "include" });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message);
                                field.onChange(data.url);
                              } catch (err: any) {
                                toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                              } finally {
                                setUploading(false);
                                e.target.value = "";
                              }
                            }}
                          />
                          {/* Also allow URL input */}
                          <Input
                            placeholder="Or paste an image URL"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Details */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(v) => field.onChange(v ? parseInt(v) : null)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select value={field.value || "BEGINNER"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BEGINNER">Beginner</SelectItem>
                          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                          <SelectItem value="ADVANCED">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || "English"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="learningOutcomes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Outcomes <span className="text-muted-foreground font-normal text-xs">(one per line)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={"Build responsive websites\nMaster JavaScript fundamentals"}
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prerequisites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prerequisites <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={"Basic HTML knowledge\nFamiliarity with computers"}
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Pricing */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Pricing
              </h2>
              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-sm font-medium">Free Course</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">Students can enroll without payment</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {!isFree && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </section>

            {/* Waitlist */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Waitlist
              </h2>
              <FormField
                control={form.control}
                name="waitlistEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-sm font-medium">Enable Waitlist</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">Show waitlist button on course page</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </section>

            {/* Landing Page */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Landing Page
              </h2>
              <FormField
                control={form.control}
                name="landingPageEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-sm font-medium">Enable Landing Page</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">Publish a sales landing page at /lp/{(course as any).slug}</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salesHeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Headline</FormLabel>
                    <FormControl>
                      <Input placeholder="The headline on your landing page" {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salesSubheadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Subheadline</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Supporting text below the headline" {...field} value={field.value || ""} rows={2} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salesVideoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Video URL</FormLabel>
                    <FormControl>
                      <Input placeholder="YouTube or Vimeo embed URL" {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salesFeatures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features / What You'll Learn</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="One feature per line"
                        {...field}
                        value={field.value || ""}
                        rows={5}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">One feature per line</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salesTestimonialsRaw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimonials (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='[{"name":"Jane","role":"Designer","text":"Great course!","rating":5}]'
                        {...field}
                        value={field.value || "[]"}
                        rows={5}
                        className="font-mono text-xs"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Array of {"{name, role, text, rating}"}</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salesFaqRaw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FAQ (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='[{"question":"How long?","answer":"8 hours of video"}]'
                        {...field}
                        value={field.value || "[]"}
                        rows={5}
                        className="font-mono text-xs"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Array of {"{question, answer}"}</p>
                  </FormItem>
                )}
              />
            </section>
          </form>
        </Form>
      </div>
    </div>
  );
}
