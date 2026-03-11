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
    });
  }, [course.id]);

  const formValues = form.watch();
  const formStr = JSON.stringify(formValues);

  const { status, markSaved } = useAutoSave(
    formStr,
    async () => {
      const values = form.getValues();
      const isValid = await form.trigger();
      if (isValid) await onSave(values);
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
          </form>
        </Form>
      </div>
    </div>
  );
}
