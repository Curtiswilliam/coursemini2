import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Play,
  FileText,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

export default function CoursePlayer() {
  const [, params] = useRoute("/learn/:slug");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  const { data: courseData, isLoading } = useQuery<any>({
    queryKey: ["/api/learn", params?.slug],
    enabled: !!params?.slug,
  });

  const course = courseData?.course;
  const enrollment = courseData?.enrollment;
  const progressMap = courseData?.progressMap || {};

  const allLessons = course?.subjects
    ?.sort((a: any, b: any) => a.position - b.position)
    .flatMap((subj: any) =>
      (subj.modules || [])
        .sort((a: any, b: any) => a.position - b.position)
        .flatMap((mod: any) =>
          (mod.lessons || [])
            .sort((a: any, b: any) => a.position - b.position)
            .map((l: any) => ({ ...l, subjectTitle: subj.title, moduleTitle: mod.title }))
        )
    ) || [];

  useEffect(() => {
    if (allLessons.length > 0 && !currentLessonId) {
      const firstIncomplete = allLessons.find((l: any) => progressMap[l.id]?.status !== "COMPLETED");
      setCurrentLessonId(firstIncomplete?.id || allLessons[0].id);
    }
  }, [allLessons, currentLessonId, progressMap]);

  const currentLesson = allLessons.find((l: any) => l.id === currentLessonId);
  const currentIndex = allLessons.findIndex((l: any) => l.id === currentLessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const completeMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      await apiRequest("POST", `/api/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn", params?.slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({ title: "Lesson completed!" });
      if (nextLesson) {
        setCurrentLessonId(nextLesson.id);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r p-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-4">You may not be enrolled in this course.</p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const completedCount = Object.values(progressMap).filter((p: any) => p.status === "COMPLETED").length;
  const totalCount = allLessons.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-200 border-r bg-card shrink-0 overflow-hidden`}
      >
        <div className="w-80">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between gap-2 mb-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/courses/${course.slug}`)} data-testid="button-back-to-course">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} data-testid="button-close-sidebar">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <h3 className="font-semibold text-sm line-clamp-2 mb-2" data-testid="text-course-title">{course.title}</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedCount} / {totalCount} completed</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-2">
              {course.subjects
                ?.sort((a: any, b: any) => a.position - b.position)
                .map((subject: any) => (
                  <div key={subject.id} className="mb-3">
                    <div className="px-2 py-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                      {subject.title}
                    </div>
                    {subject.modules
                      ?.sort((a: any, b: any) => a.position - b.position)
                      .map((mod: any) => (
                        <div key={mod.id} className="mb-1">
                          <div className="px-3 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <ChevronDown className="h-3 w-3" />
                            {mod.title}
                          </div>
                          {mod.lessons
                            ?.sort((a: any, b: any) => a.position - b.position)
                            .map((lesson: any) => {
                              const isCompleted = progressMap[lesson.id]?.status === "COMPLETED";
                              const isCurrent = lesson.id === currentLessonId;
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => setCurrentLessonId(lesson.id)}
                                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors text-left ${
                                    isCurrent
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                  }`}
                                  data-testid={`button-lesson-${lesson.id}`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 shrink-0" />
                                  )}
                                  <span className="flex-1 truncate">{lesson.title}</span>
                                  {lesson.type === "VIDEO" && <Play className="h-3 w-3 shrink-0" />}
                                  {lesson.type === "TEXT" && <FileText className="h-3 w-3 shrink-0" />}
                                </button>
                              );
                            })}
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!sidebarOpen && (
          <div className="p-2 border-b">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} data-testid="button-open-sidebar">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto p-6 md:p-8">
              <div className="mb-6">
                <span className="text-xs text-muted-foreground">
                  {currentLesson.subjectTitle} › {currentLesson.moduleTitle}
                </span>
                <h1 className="text-2xl font-bold mt-1" data-testid="text-lesson-title">{currentLesson.title}</h1>
              </div>

              {currentLesson.type === "VIDEO" && currentLesson.videoUrl && (
                <div className="aspect-video rounded-md overflow-hidden bg-black mb-6">
                  <video
                    src={currentLesson.videoUrl}
                    controls
                    className="h-full w-full"
                    data-testid="video-player"
                  />
                </div>
              )}

              {currentLesson.content && (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none mb-8"
                  data-testid="text-lesson-content"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                />
              )}

              {!currentLesson.content && !currentLesson.videoUrl && (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4" />
                  <p>No content available for this lesson yet.</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t mt-8">
                <div>
                  {prevLesson && (
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentLessonId(prevLesson.id)}
                      data-testid="button-prev-lesson"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {progressMap[currentLessonId!]?.status !== "COMPLETED" && (
                    <Button
                      onClick={() => completeMutation.mutate(currentLessonId!)}
                      disabled={completeMutation.isPending}
                      data-testid="button-mark-complete"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                  {nextLesson && (
                    <Button
                      variant={progressMap[currentLessonId!]?.status === "COMPLETED" ? "default" : "outline"}
                      onClick={() => setCurrentLessonId(nextLesson.id)}
                      data-testid="button-next-lesson"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a lesson to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
