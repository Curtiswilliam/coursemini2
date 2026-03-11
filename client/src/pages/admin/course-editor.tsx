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
import { BlockBuilder } from "@/components/block-builder";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  BookOpen,
  Layers,
  Box,
  X,
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
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = !params?.id;
  const courseId = params?.id ? parseInt(params.id) : null;

  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
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

  const addSubjectMutation = useMutation({
    mutationFn: async () => {
      const position = (course?.subjects?.length || 0);
      const res = await apiRequest("POST", "/api/admin/subjects", {
        courseId,
        title: `Subject ${position + 1}`,
        position,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PATCH", `/api/admin/subjects/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: async ({ subjectId, position }: { subjectId: number; position: number }) => {
      const res = await apiRequest("POST", "/api/admin/modules", {
        subjectId,
        title: `Module ${position + 1}`,
        position,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PATCH", `/api/admin/modules/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    },
  });

  const addLessonMutation = useMutation({
    mutationFn: async ({ moduleId, position }: { moduleId: number; position: number }) => {
      const res = await apiRequest("POST", "/api/admin/lessons", {
        moduleId,
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
                            <FormLabel>Course Name</FormLabel>
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
                          <FormLabel>
                            Thumbnail URL{" "}
                            <span className="text-muted-foreground font-normal">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.png" {...field} value={field.value || ""} data-testid="input-thumbnail" />
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
                              placeholder="Build responsive websites&#10;Master JavaScript fundamentals"
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
                    <div>
                      <CardTitle className="text-base">Course Curriculum</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Organize content into Subjects → Modules → Lessons
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addSubjectMutation.mutate()}
                      disabled={addSubjectMutation.isPending}
                      data-testid="button-add-subject"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Subject
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!course?.subjects?.length ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No subjects yet. Click "Add Subject" to start building your course.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {course.subjects
                        .sort((a: any, b: any) => a.position - b.position)
                        .map((subject: any) => {
                          const isSubjExpanded = expandedSubjects.has(subject.id);
                          return (
                            <div key={subject.id} className="border rounded-lg" data-testid={`subject-${subject.id}`}>
                              <div className="flex items-center gap-2 p-3 bg-muted/30">
                                <button
                                  onClick={() => {
                                    const next = new Set(expandedSubjects);
                                    if (isSubjExpanded) next.delete(subject.id);
                                    else next.add(subject.id);
                                    setExpandedSubjects(next);
                                  }}
                                  className="text-muted-foreground"
                                  data-testid={`toggle-subject-${subject.id}`}
                                >
                                  {isSubjExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                                <Layers className="h-4 w-4 text-primary" />
                                <Input
                                  defaultValue={subject.title}
                                  className="flex-1 h-8 text-sm font-semibold bg-transparent border-none focus-visible:ring-1"
                                  onBlur={(e) => {
                                    if (e.target.value !== subject.title) {
                                      updateSubjectMutation.mutate({ id: subject.id, title: e.target.value });
                                    }
                                  }}
                                  data-testid={`input-subject-title-${subject.id}`}
                                />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {subject.modules?.length || 0} modules
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    if (confirm("Delete this subject and all its modules and lessons?")) {
                                      deleteSubjectMutation.mutate(subject.id);
                                    }
                                  }}
                                  data-testid={`button-delete-subject-${subject.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              {isSubjExpanded && (
                                <div className="border-t p-3 space-y-2">
                                  {subject.modules
                                    ?.sort((a: any, b: any) => a.position - b.position)
                                    .map((mod: any) => {
                                      const isModExpanded = expandedModules.has(mod.id);
                                      return (
                                        <div key={mod.id} className="border rounded-md ml-4" data-testid={`module-${mod.id}`}>
                                          <div className="flex items-center gap-2 p-2 bg-background">
                                            <button
                                              onClick={() => {
                                                const next = new Set(expandedModules);
                                                if (isModExpanded) next.delete(mod.id);
                                                else next.add(mod.id);
                                                setExpandedModules(next);
                                              }}
                                              className="text-muted-foreground"
                                              data-testid={`toggle-module-${mod.id}`}
                                            >
                                              {isModExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                            </button>
                                            <Box className="h-3.5 w-3.5 text-amber-500" />
                                            <Input
                                              defaultValue={mod.title}
                                              className="flex-1 h-7 text-sm font-medium bg-transparent border-none focus-visible:ring-1"
                                              onBlur={(e) => {
                                                if (e.target.value !== mod.title) {
                                                  updateModuleMutation.mutate({ id: mod.id, title: e.target.value });
                                                }
                                              }}
                                              data-testid={`input-module-title-${mod.id}`}
                                            />
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                              {mod.lessons?.length || 0} lessons
                                            </span>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => {
                                                if (confirm("Delete this module and all its lessons?")) {
                                                  deleteModuleMutation.mutate(mod.id);
                                                }
                                              }}
                                              data-testid={`button-delete-module-${mod.id}`}
                                            >
                                              <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                          </div>
                                          {isModExpanded && (
                                            <div className="border-t px-3 pb-2">
                                              {mod.lessons
                                                ?.sort((a: any, b: any) => a.position - b.position)
                                                .map((lesson: any) => (
                                                  <div key={lesson.id} className="py-1.5" data-testid={`lesson-${lesson.id}`}>
                                                    {editingLesson === lesson.id ? (
                                                      <LessonEditor
                                                        lesson={lesson}
                                                        onSave={(data) => updateLessonMutation.mutate({ id: lesson.id, ...data })}
                                                        onCancel={() => setEditingLesson(null)}
                                                        isSaving={updateLessonMutation.isPending}
                                                      />
                                                    ) : (
                                                      <div className="flex items-center gap-2 pl-4">
                                                        {lesson.type === "VIDEO" ? (
                                                          <Play className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        ) : lesson.type === "QUIZ" ? (
                                                          <BookOpen className="h-3 w-3 text-primary shrink-0" />
                                                        ) : (
                                                          <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
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
                                                          className="h-6 w-6"
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
                                                className="ml-4 mt-1 text-xs"
                                                onClick={() =>
                                                  addLessonMutation.mutate({
                                                    moduleId: mod.id,
                                                    position: mod.lessons?.length || 0,
                                                  })
                                                }
                                                data-testid={`button-add-lesson-${mod.id}`}
                                              >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Lesson
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-4 text-xs"
                                    onClick={() =>
                                      addModuleMutation.mutate({
                                        subjectId: subject.id,
                                        position: subject.modules?.length || 0,
                                      })
                                    }
                                    data-testid={`button-add-module-${subject.id}`}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Module
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
  const { toast } = useToast();
  const [title, setTitle] = useState(lesson.title);
  const [type, setType] = useState(lesson.type || "TEXT");
  const [_content] = useState(lesson.content || ""); // Legacy: blocks handled by BlockBuilder
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl || "");
  const [duration, setDuration] = useState(lesson.duration?.toString() || "");
  const [dripDays, setDripDays] = useState(lesson.dripDays?.toString() || "");

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    question: string;
    type: string;
    position: number;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>>(lesson.quiz?.questions?.map((q: any) => ({
    question: q.question,
    type: q.type,
    position: q.position,
    options: q.options?.map((o: any) => ({ text: o.text, isCorrect: o.isCorrect })) || [],
  })) || []);
  const [savingQuiz, setSavingQuiz] = useState(false);

  const addQuestion = () => {
    setQuizQuestions([...quizQuestions, {
      question: "",
      type: "MULTIPLE_CHOICE",
      position: quizQuestions.length,
      options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }],
    }]);
  };

  const updateQuestion = (qi: number, field: string, value: any) => {
    setQuizQuestions(quizQuestions.map((q, i) => i === qi ? { ...q, [field]: value } : q));
  };

  const addOption = (qi: number) => {
    setQuizQuestions(quizQuestions.map((q, i) => i === qi ? { ...q, options: [...q.options, { text: "", isCorrect: false }] } : q));
  };

  const updateOption = (qi: number, oi: number, field: string, value: any) => {
    setQuizQuestions(quizQuestions.map((q, i) => i === qi ? {
      ...q,
      options: q.options.map((o, j) => j === oi ? { ...o, [field]: value } : (field === "isCorrect" && value ? { ...o, isCorrect: false } : o))
    } : q));
  };

  const removeQuestion = (qi: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== qi).map((q, i) => ({ ...q, position: i })));
  };

  const saveQuiz = async () => {
    setSavingQuiz(true);
    try {
      await apiRequest("POST", `/api/admin/lessons/${lesson.id}/quiz`, { questions: quizQuestions });
      toast({ title: "Quiz saved!" });
    } catch (e: any) {
      toast({ title: "Error saving quiz", description: e.message, variant: "destructive" });
    } finally {
      setSavingQuiz(false);
    }
  };

  return (
    <div className="border rounded-md p-4 space-y-3 bg-muted/20" data-testid={`lesson-editor-${lesson.id}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          className="md:col-span-2"
          data-testid={`input-lesson-title-${lesson.id}`}
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger data-testid={`select-lesson-type-${lesson.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXT">Text</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="QUIZ">Quiz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === "VIDEO" && (
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Video URL (YouTube, Vimeo, or direct link)"
          data-testid={`input-lesson-video-${lesson.id}`}
        />
      )}

      {type !== "QUIZ" && (
        <div>
          <label className="text-sm font-medium mb-2 block">Lesson Content</label>
          <BlockBuilder lessonId={lesson.id} />
        </div>
      )}

      {/* Drip Days */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Drip Days (optional):</label>
          <Input
            value={dripDays}
            onChange={(e) => setDripDays(e.target.value)}
            placeholder="e.g. 7"
            type="number"
            min="0"
            className="w-24"
            data-testid={`input-lesson-drip-${lesson.id}`}
          />
          <span className="text-xs text-muted-foreground">days after enrollment</span>
        </div>
        {type !== "QUIZ" && (
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration (min)"
            type="number"
            className="w-32"
            data-testid={`input-lesson-duration-${lesson.id}`}
          />
        )}
      </div>

      {/* Quiz Builder */}
      {type === "QUIZ" && (
        <div className="space-y-4 border rounded-md p-3 bg-background">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Quiz Builder</span>
            <Button size="sm" variant="outline" onClick={addQuestion}>
              <Plus className="h-3 w-3 mr-1" />
              Add Question
            </Button>
          </div>
          {quizQuestions.map((q, qi) => (
            <div key={qi} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, "question", e.target.value)}
                  placeholder={`Question ${qi + 1}`}
                  className="flex-1 text-sm"
                />
                <Select value={q.type} onValueChange={(v) => updateQuestion(qi, "type", v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                    <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeQuestion(qi)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <div className="space-y-1 pl-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q-${qi}-correct`}
                      checked={opt.isCorrect}
                      onChange={() => updateOption(qi, oi, "isCorrect", true)}
                      className="shrink-0"
                    />
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(qi, oi, "text", e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 h-7 text-xs"
                    />
                    {q.options.length > 2 && (
                      <button onClick={() => setQuizQuestions(quizQuestions.map((qq, qi2) => qi2 === qi ? { ...qq, options: qq.options.filter((_, oi2) => oi2 !== oi) } : qq))}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                ))}
                {q.type === "MULTIPLE_CHOICE" && q.options.length < 6 && (
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => addOption(qi)}>
                    <Plus className="h-2.5 w-2.5 mr-1" />
                    Add Option
                  </Button>
                )}
              </div>
            </div>
          ))}
          {quizQuestions.length > 0 && (
            <Button size="sm" onClick={saveQuiz} disabled={savingQuiz} className="w-full">
              {savingQuiz && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Save Quiz
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onCancel} data-testid={`button-cancel-lesson-${lesson.id}`}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() =>
            onSave({
              title,
              type,
              videoUrl: type === "VIDEO" ? videoUrl : null,
              duration: duration ? parseInt(duration) : null,
              dripDays: dripDays ? parseInt(dripDays) : null,
            })
          }
          disabled={isSaving}
          data-testid={`button-save-lesson-${lesson.id}`}
        >
          {isSaving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          Save Lesson
        </Button>
      </div>
    </div>
  );
}

