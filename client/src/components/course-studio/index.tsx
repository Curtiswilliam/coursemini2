import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, MousePointer2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudioTopbar } from "./studio-topbar";
import { CourseOutlinePanel } from "./course-outline-panel";
import { LessonCanvas } from "./lesson-canvas";
import { ModuleCanvas } from "./module-canvas";
import { CourseDetailsPanel } from "./course-details-panel";
import { SaveStatus } from "@/hooks/use-auto-save";
import { Course, Lesson, StudioTab } from "./types";

function findLesson(course: Course | undefined, lessonId: number | null): Lesson | null {
  if (!course || lessonId === null) return null;
  for (const subject of course.subjects || []) {
    for (const mod of subject.modules || []) {
      for (const lesson of mod.lessons || []) {
        if (lesson.id === lessonId) return lesson;
      }
    }
  }
  return null;
}

function findModule(course: Course | undefined, moduleId: number | null): any | null {
  if (!course || moduleId === null) return null;
  for (const subject of course.subjects || []) {
    for (const mod of subject.modules || []) {
      if (mod.id === moduleId) return mod;
    }
  }
  return null;
}

export default function CourseStudio() {
  const [, editParams] = useRoute("/admin/courses/:id/edit");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const isNew = !editParams?.id;
  const courseId = editParams?.id ? parseInt(editParams.id) : null;

  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>("content");
  const [courseAutoSaveStatus, setCourseAutoSaveStatus] = useState<SaveStatus>("saved");
  const handleCourseStatusChange = (s: string) => setCourseAutoSaveStatus(s as SaveStatus);

  // For new course creation
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: course, isLoading, refetch } = useQuery<Course>({
    queryKey: ["/api/admin/courses", courseId],
    enabled: !!courseId,
  });

  const saveCourse = useCallback(async (values: any) => {
    await apiRequest("PATCH", `/api/admin/courses/${courseId}`, values);
    queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
  }, [courseId]);


  const publishMutation = useMutation({
    mutationFn: async () => {
      const newStatus = course?.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      await apiRequest("PATCH", `/api/admin/courses/${courseId}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: course?.status === "PUBLISHED" ? "Course unpublished" : "Course published!",
      });
    },
  });

  const createCourse = async () => {
    if (!newTitle.trim() || newTitle.trim().length < 3) return;
    setIsCreating(true);
    try {
      const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const res = await apiRequest("POST", "/api/admin/courses", { title: newTitle.trim(), slug });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      navigate(`/admin/courses/${data.id}/edit`);
    } catch (e: any) {
      toast({ title: "Failed to create course", description: e.message, variant: "destructive" });
      setIsCreating(false);
    }
  };

  // Auto-select first lesson on load
  useEffect(() => {
    if (course && selectedLessonId === null) {
      const firstLesson = course.subjects?.[0]?.modules?.[0]?.lessons?.[0];
      if (firstLesson) setSelectedLessonId(firstLesson.id);
    }
  }, [course?.id]);

  // New course creation screen
  if (isNew) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-6 px-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Create a new course</h1>
            <p className="text-muted-foreground text-sm">
              Give your course a name to get started. You can change it anytime.
            </p>
          </div>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="e.g. Web Development Masterclass"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCourse()}
              className="text-base h-11"
            />
            <Button
              className="w-full h-11"
              onClick={createCourse}
              disabled={isCreating || newTitle.trim().length < 3}
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Course
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/admin")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !course) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="h-14 bg-card border-b flex items-center px-6 gap-3 shrink-0">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-5 w-48" />
          <div className="flex-1" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 border-r p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          <div className="flex-1 p-8 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const selectedLesson = findLesson(course, selectedLessonId);
  const selectedModule = findModule(course, selectedModuleId);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <StudioTopbar
        courseTitle={course.title}
        courseSlug={course.slug}
        selectedLessonId={selectedLessonId}
        status={course.status}
        saveStatus={activeTab === "settings" ? courseAutoSaveStatus : "saved"}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPublish={() => publishMutation.mutate()}
        isPublishing={publishMutation.isPending}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Course Outline (only on Content tab) */}
        {activeTab === "content" && (
          <div className="w-72 border-r bg-card/30 flex-shrink-0 overflow-hidden flex flex-col">
            <CourseOutlinePanel
              courseId={course.id}
              subjects={course.subjects || []}
              selectedLessonId={selectedLessonId}
              onSelectLesson={(id) => { setSelectedLessonId(id); setSelectedModuleId(null); }}
              onSelectModule={(id) => { setSelectedModuleId(id); setSelectedLessonId(null); }}
              onRefresh={() => refetch()}
            />
          </div>
        )}

        {/* Right panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "content" ? (
            selectedModule ? (
              <ModuleCanvas
                key={selectedModule.id}
                module={selectedModule}
                courseId={course.id}
                onRefresh={() => refetch()}
              />
            ) : selectedLesson ? (
              <LessonCanvas
                key={selectedLesson.id}
                lesson={selectedLesson}
                courseId={course.id}
                onRefresh={() => refetch()}
              />
            ) : (
              <EmptyCanvas
                hasSections={(course.subjects?.length || 0) > 0}
                onAddSection={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
                }}
              />
            )
          ) : (
            <CourseDetailsPanel
              course={course}
              onSave={saveCourse}
              onSaveStatusChange={handleCourseStatusChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyCanvas({ hasSections, onAddSection }: { hasSections: boolean; onAddSection: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center text-center p-8">
      <div className="space-y-4 max-w-xs">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <MousePointer2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {hasSections ? "Select a lesson" : "Start building your course"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {hasSections
              ? "Choose a lesson from the outline on the left to start editing."
              : "Add a section in the outline panel to get started."}
          </p>
        </div>
      </div>
    </div>
  );
}
