import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
} from "lucide-react";

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

export default function CourseEditor() {
  const [, params] = useRoute("/admin/courses/:id/edit");
  const [, newParams] = useRoute("/admin/courses/new");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = !params?.id;
  const courseId = params?.id ? parseInt(params.id) : null;

  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [editingLesson, setEditingLesson] = useState<number | null>(null);

  const { data: course, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/courses", courseId],
    enabled: !!courseId,
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      thumbnail: "",
      categoryId: null,
      level: "BEGINNER",
      language: "English",
      isFree: true,
      price: 0,
      learningOutcomes: "",
      prerequisites: "",
      status: "DRAFT",
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title || "",
        slug: course.slug || "",
        description: course.description || "",
        shortDescription: course.shortDescription || "",
        thumbnail: course.thumbnail || "",
        categoryId: course.categoryId,
        level: course.level || "BEGINNER",
        language: course.language || "English",
        isFree: course.isFree ?? true,
        price: course.price || 0,
        learningOutcomes: course.learningOutcomes || "",
        prerequisites: course.prerequisites || "",
        status: course.status || "DRAFT",
      });
    }
  }, [course, form]);

  const titleValue = form.watch("title");
  useEffect(() => {
    if (isNew && titleValue) {
      const slug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", slug);
    }
  }, [titleValue, isNew, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof courseSchema>) => {
      if (isNew) {
        const res = await apiRequest("POST", "/api/admin/courses", values);
        return res.json();
      } else {
        const res = await apiRequest("PATCH", `/api/admin/courses/${courseId}`, values);
        return res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: isNew ? "Course created!" : "Course saved!" });
      if (isNew && data.id) {
        navigate(`/admin/courses/${data.id}/edit`);
      }
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const addChapterMutation = useMutation({
    mutationFn: async () => {
      const position = (course?.chapters?.length || 0);
      const res = await apiRequest("POST", "/api/admin/chapters", {
        courseId,
        title: `Chapter ${position + 1}`,
        position,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PATCH", `/api/admin/chapters/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/chapters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const addLessonMutation = useMutation({
    mutationFn: async ({ chapterId, position }: { chapterId: number; position: number }) => {
      const res = await apiRequest("POST", "/api/admin/lessons", {
        chapterId,
        title: `New Lesson`,
        type: "TEXT",
        position,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => {
      await apiRequest("PATCH", `/api/admin/lessons/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
      setEditingLesson(null);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  if (isLoading && courseId) {
    return (
      <div className="min-h-screen">
        <div className="bg-card border-b">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-card border-b sticky top-16 z-30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-bold truncate" data-testid="text-editor-title">
                {isNew ? "Create Course" : `Edit: ${course?.title || ""}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/courses/${course?.slug}`)}
                  data-testid="button-preview"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              )}
              <Button
                size="sm"
                onClick={form.handleSubmit((values) => saveMutation.mutate(values))}
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="details">
          <TabsList className="mb-6">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            {!isNew && <TabsTrigger value="curriculum" data-testid="tab-curriculum">Curriculum</TabsTrigger>}
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Form {...form}>
              <form className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Web Development Masterclass" {...field} data-testid="input-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Slug</FormLabel>
                            <FormControl>
                              <Input placeholder="web-development-masterclass" {...field} data-testid="input-slug" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Input placeholder="A brief summary of your course" {...field} value={field.value || ""} data-testid="input-short-description" />
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
                          <FormLabel>Full Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of what students will learn..."
                              className="min-h-[120px]"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-description"
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
                        <FormItem>
                          <FormLabel>Thumbnail URL</FormLabel>
                          <FormControl>
                            <Input placeholder="/images/course-thumbnail.png" {...field} value={field.value || ""} data-testid="input-thumbnail" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                                <SelectTrigger data-testid="select-category">
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
                                <SelectTrigger data-testid="select-level">
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
                              <Input {...field} value={field.value || "English"} data-testid="input-language" />
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
                          <FormLabel>Learning Outcomes (one per line)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Build responsive websites&#10;Master JavaScript fundamentals&#10;Deploy applications to the cloud"
                              className="min-h-[100px]"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-outcomes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </form>
            </Form>
          </TabsContent>

          {!isNew && (
            <TabsContent value="curriculum">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Chapters & Lessons</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => addChapterMutation.mutate()}
                      disabled={addChapterMutation.isPending}
                      data-testid="button-add-chapter"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Chapter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {course?.chapters?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No chapters yet. Click "Add Chapter" to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {course?.chapters
                        ?.sort((a: any, b: any) => a.position - b.position)
                        .map((chapter: any) => {
                          const isExpanded = expandedChapters.has(chapter.id);
                          return (
                            <div key={chapter.id} className="border rounded-md" data-testid={`chapter-${chapter.id}`}>
                              <div className="flex items-center gap-2 p-3">
                                <button
                                  onClick={() => {
                                    const next = new Set(expandedChapters);
                                    if (isExpanded) next.delete(chapter.id);
                                    else next.add(chapter.id);
                                    setExpandedChapters(next);
                                  }}
                                  className="text-muted-foreground"
                                >
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  defaultValue={chapter.title}
                                  className="flex-1 h-8 text-sm font-medium"
                                  onBlur={(e) => {
                                    if (e.target.value !== chapter.title) {
                                      updateChapterMutation.mutate({ id: chapter.id, title: e.target.value });
                                    }
                                  }}
                                  data-testid={`input-chapter-title-${chapter.id}`}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {chapter.lessons?.length || 0} lessons
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("Delete this chapter and all its lessons?")) {
                                      deleteChapterMutation.mutate(chapter.id);
                                    }
                                  }}
                                  data-testid={`button-delete-chapter-${chapter.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              {isExpanded && (
                                <div className="border-t px-3 pb-3">
                                  {chapter.lessons
                                    ?.sort((a: any, b: any) => a.position - b.position)
                                    .map((lesson: any) => (
                                      <div key={lesson.id} className="py-2" data-testid={`lesson-${lesson.id}`}>
                                        {editingLesson === lesson.id ? (
                                          <LessonEditor
                                            lesson={lesson}
                                            onSave={(data) => updateLessonMutation.mutate({ id: lesson.id, ...data })}
                                            onCancel={() => setEditingLesson(null)}
                                            isSaving={updateLessonMutation.isPending}
                                          />
                                        ) : (
                                          <div className="flex items-center gap-2 pl-6">
                                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                                            {lesson.type === "VIDEO" ? (
                                              <Play className="h-3 w-3 text-muted-foreground" />
                                            ) : (
                                              <FileText className="h-3 w-3 text-muted-foreground" />
                                            )}
                                            <button
                                              className="flex-1 text-left text-sm hover:text-primary transition-colors"
                                              onClick={() => setEditingLesson(lesson.id)}
                                              data-testid={`button-edit-lesson-${lesson.id}`}
                                            >
                                              {lesson.title}
                                            </button>
                                            <span className="text-xs text-muted-foreground capitalize">{lesson.type?.toLowerCase()}</span>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              onClick={() => {
                                                if (confirm("Delete this lesson?")) {
                                                  deleteLessonMutation.mutate(lesson.id);
                                                }
                                              }}
                                              data-testid={`button-delete-lesson-${lesson.id}`}
                                            >
                                              <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-6 mt-1"
                                    onClick={() =>
                                      addLessonMutation.mutate({
                                        chapterId: chapter.id,
                                        position: chapter.lessons?.length || 0,
                                      })
                                    }
                                    data-testid={`button-add-lesson-${chapter.id}`}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Lesson
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="settings">
            <Form {...form}>
              <form className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isFree"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Free Course</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-free" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {!form.watch("isFree") && (
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
                                data-testid="input-price"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Publishing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select value={field.value || "DRAFT"} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DRAFT">Draft</SelectItem>
                              <SelectItem value="PUBLISHED">Published</SelectItem>
                              <SelectItem value="ARCHIVED">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LessonEditor({
  lesson,
  onSave,
  onCancel,
  isSaving,
}: {
  lesson: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [type, setType] = useState(lesson.type || "TEXT");
  const [content, setContent] = useState(lesson.content || "");
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl || "");
  const [duration, setDuration] = useState(lesson.duration || 0);

  return (
    <div className="pl-6 space-y-3 bg-accent/30 rounded-md p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          data-testid="input-lesson-title"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger data-testid="select-lesson-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXT">Text</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {type === "VIDEO" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Video URL"
            data-testid="input-video-url"
          />
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            placeholder="Duration (minutes)"
            data-testid="input-duration"
          />
        </div>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Lesson content..."
        className="min-h-[100px]"
        data-testid="input-lesson-content"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-lesson">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave({ title, type, content, videoUrl, duration })}
          disabled={isSaving}
          data-testid="button-save-lesson"
        >
          {isSaving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          Save Lesson
        </Button>
      </div>
    </div>
  );
}
