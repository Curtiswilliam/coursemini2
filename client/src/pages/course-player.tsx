import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import DOMPurify from "dompurify";
import { BlockRenderer } from "@/components/block-builder/block-renderer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
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
  Lock,
  Clock,
  HelpCircle,
  Trophy,
  Bookmark,
  BookmarkCheck,
  StickyNote,
  ChevronUp,
  Timer,
  CheckCircle2,
} from "lucide-react";

function getEmbedUrl(url: string): { type: "youtube" | "vimeo" | "direct"; embedUrl: string } | null {
  // YouTube (watch, shorts, embed, youtu.be)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { type: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1` };
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?byline=0&portrait=0` };
  }
  // Direct file
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
    return { type: "direct", embedUrl: url };
  }
  return null;
}

function VideoPlayer({ url, onProgress }: { url: string; onProgress: (pct: number) => void }) {
  const [embedFailed, setEmbedFailed] = useState(false);
  const info = getEmbedUrl(url);

  if (!info) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center mb-6">
        <p className="text-sm text-muted-foreground">Unsupported video URL</p>
      </div>
    );
  }

  if (info.type === "direct") {
    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6 shadow-lg">
        <video
          src={info.embedUrl}
          controls
          className="h-full w-full"
          data-testid="video-player"
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) onProgress((el.currentTime / el.duration) * 100);
          }}
        />
      </div>
    );
  }

  const sourceName = info.type === "youtube" ? "YouTube" : "Vimeo";
  const watchUrl = info.type === "youtube"
    ? `https://www.youtube.com/watch?v=${info.embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1]}`
    : url;

  if (embedFailed) {
    return (
      <div className="aspect-video rounded-xl bg-muted/40 border border-border flex flex-col items-center justify-center gap-4 mb-6">
        <p className="text-sm text-muted-foreground">This video can't be embedded.</p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Watch on {sourceName} ↗
        </a>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg ring-1 ring-border/20">
        <iframe
          src={info.embedUrl}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="origin"
          data-testid="video-player"
          title="Lesson video"
          onError={() => setEmbedFailed(true)}
        />
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5 text-right">
        Playing via {sourceName} ·{" "}
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          Open on {sourceName}
        </a>
      </p>
    </div>
  );
}

// ─── Intake Topics ────────────────────────────────────────────────────────────

const INTAKE_TOPICS = [
  "Business & Entrepreneurship", "Technology & IT", "Health & Wellness",
  "Creative Arts & Design", "Education & Teaching", "Finance & Accounting",
  "Marketing & Sales", "Personal Development", "Leadership & Management",
  "Science & Research", "Trade & Vocational Skills", "Languages", "Law & Legal",
  "Environment & Sustainability",
];

const QUALIFICATIONS = [
  "High School / GED", "Some College, No Degree", "Certificate / Diploma",
  "Associate's Degree", "Bachelor's Degree", "Master's Degree",
  "Doctoral Degree / PhD", "Professional Degree", "Other",
];

const WORK_STATUSES = [
  "Employed Full-time", "Employed Part-time", "Self-employed / Business Owner",
  "Student", "Seeking Employment", "Not Currently Working", "Retired",
];

// ─── Intake Modal ─────────────────────────────────────────────────────────────

function IntakeModal({ onComplete }: { onComplete: () => void }) {
  const { toast } = useToast();
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [qualification, setQualification] = useState("");
  const [workStatus, setWorkStatus] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (topic: string) => {
    setInterests(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async () => {
    if (!country.trim()) return toast({ title: "Country is required", variant: "destructive" });
    if (!stateRegion.trim()) return toast({ title: "State/Region is required", variant: "destructive" });
    if (!qualification) return toast({ title: "Please select your highest qualification", variant: "destructive" });
    if (!workStatus) return toast({ title: "Please select your work status", variant: "destructive" });
    const year = parseInt(birthYear);
    if (!birthYear || isNaN(year) || year < 1900 || year > new Date().getFullYear() - 10) {
      return toast({ title: "Enter a valid birth year", variant: "destructive" });
    }
    if (interests.length === 0) return toast({ title: "Select at least one interest", variant: "destructive" });

    setSaving(true);
    try {
      await apiRequest("POST", "/api/auth/complete-intake", {
        country: country.trim(),
        stateRegion: stateRegion.trim(),
        highestQualification: qualification,
        workStatus,
        birthYear: year,
        interests,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onComplete();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Before you start</DialogTitle>
          <DialogDescription>
            Help us personalise your learning experience by telling us a little about yourself.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input placeholder="e.g. Australia" value={country} onChange={e => setCountry(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>State / Region</Label>
              <Input placeholder="e.g. Queensland" value={stateRegion} onChange={e => setStateRegion(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Highest Qualification</Label>
            <Select value={qualification} onValueChange={setQualification}>
              <SelectTrigger><SelectValue placeholder="Select qualification…" /></SelectTrigger>
              <SelectContent>
                {QUALIFICATIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Work Status</Label>
            <Select value={workStatus} onValueChange={setWorkStatus}>
              <SelectTrigger><SelectValue placeholder="Select work status…" /></SelectTrigger>
              <SelectContent>
                {WORK_STATUSES.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Birth Year</Label>
            <Input
              type="number"
              placeholder="e.g. 1990"
              min={1900}
              max={new Date().getFullYear() - 10}
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              className="w-32"
            />
          </div>

          <div className="space-y-2">
            <Label>Interests <span className="text-muted-foreground font-normal">(select all that apply)</span></Label>
            <div className="flex flex-wrap gap-2">
              {INTAKE_TOPICS.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleInterest(topic)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    interests.includes(topic)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Continue to Course"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Course Player ─────────────────────────────────────────────────────────────

export default function CoursePlayer() {
  const [, params] = useRoute("/learn/:slug");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showIntake, setShowIntake] = useState(false);

  // Support ?lesson=<id> for preview deep-linking from the studio
  const initialLessonId = (() => {
    const search = window.location.search;
    const m = search.match(/[?&]lesson=(\d+)/);
    return m ? parseInt(m[1]) : null;
  })();
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(initialLessonId);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(new Set());

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number | number[]>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [kcAllAnswered, setKcAllAnswered] = useState(true);

  // Notes & bookmarks state
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteSaveStatus, setNoteSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lesson timer
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerActiveRef = useRef(true);

  // Progress tracking
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [timeOnLesson, setTimeOnLesson] = useState(0);
  const autoCompletedRef = useRef<Set<number>>(new Set());
  // Optimistic local completion tracking (shows tick instantly before query refetches)
  const localCompletedRef = useRef<Set<number>>(new Set());
  // Milestone tracking refs
  const scrollMilestonesRef = useRef<Set<string>>(new Set());
  const videoMilestonesRef = useRef<Set<string>>(new Set());
  const lessonStartTimeRef = useRef<number>(Date.now());

  const { data: courseData, isLoading } = useQuery<any>({
    queryKey: ["/api/learn", params?.slug],
    enabled: !!params?.slug,
  });

  const { data: lessonBlocks = [] } = useQuery<any[]>({
    queryKey: ["/api/lessons", currentLessonId, "blocks"],
    queryFn: async () => {
      if (!currentLessonId) return [];
      const res = await fetch(`/api/lessons/${currentLessonId}/blocks`, { credentials: "include" });
      return res.json();
    },
    enabled: !!currentLessonId,
  });

  const { data: bookmarkData, refetch: refetchBookmark } = useQuery<any>({
    queryKey: ["/api/lessons", currentLessonId, "bookmark"],
    queryFn: async () => {
      if (!currentLessonId || !enrollment) return null;
      const res = await fetch(`/api/lessons/${currentLessonId}/note`, { credentials: "include" });
      // Just check if bookmarked by fetching bookmark status via the bookmarks list
      return null;
    },
    enabled: false, // will be handled manually
  });

  const { data: noteData, refetch: refetchNote } = useQuery<any>({
    queryKey: ["/api/lessons", currentLessonId, "note"],
    queryFn: async () => {
      if (!currentLessonId) return null;
      const res = await fetch(`/api/lessons/${currentLessonId}/note`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!currentLessonId && !!courseData?.enrollment,
  });

  const { data: userBookmarks, refetch: refetchBookmarks } = useQuery<any[]>({
    queryKey: ["/api/bookmarks"],
    enabled: !!courseData?.enrollment,
  });

  const isBookmarked = userBookmarks?.some((bm: any) => bm.lessonId === currentLessonId) ?? false;

  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/lessons/${currentLessonId}/bookmark`);
      return res;
    },
    onSuccess: () => {
      refetchBookmarks();
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("PUT", `/api/lessons/${currentLessonId}/note`, { content });
    },
    onSuccess: () => {
      setNoteSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", currentLessonId, "note"] });
    },
    onError: () => setNoteSaveStatus("unsaved"),
  });

  const course = courseData?.course;
  const enrollment = courseData?.enrollment;
  const isPreview = courseData?.isPreview ?? false;
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

  // Calculate if a drip lesson is available
  const isDripAvailable = (lesson: any) => {
    if (lesson.dripDays == null) return true;
    if (!enrollment?.enrolledAt) return false;
    const enrolledAt = new Date(enrollment.enrolledAt);
    const availableAt = new Date(enrolledAt.getTime() + lesson.dripDays * 24 * 60 * 60 * 1000);
    return new Date() >= availableAt;
  };

  const dripDaysRemaining = (lesson: any) => {
    if (lesson.dripDays == null || !enrollment?.enrolledAt) return 0;
    const enrolledAt = new Date(enrollment.enrolledAt);
    const availableAt = new Date(enrolledAt.getTime() + lesson.dripDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = availableAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  useEffect(() => {
    if (allLessons.length > 0 && !currentLessonId) {
      const firstIncomplete = allLessons.find((l: any) => progressMap[l.id]?.status !== "COMPLETED" && isDripAvailable(l));
      setCurrentLessonId(firstIncomplete?.id || allLessons[0].id);
    }
  }, [allLessons, currentLessonId, progressMap]);

  // Show intake form when student enters a course for the first time
  useEffect(() => {
    if (courseData && user && user.role === "STUDENT" && !(user as any).intakeCompletedAt) {
      setShowIntake(true);
    }
  }, [courseData, user]);

  // Expand only the module containing the current lesson
  useEffect(() => {
    if (!course || !currentLessonId) return;
    for (const subject of (course.subjects || [])) {
      for (const mod of (subject.modules || [])) {
        if (mod.lessons?.some((l: any) => l.id === currentLessonId)) {
          setExpandedModuleIds(new Set([mod.id]));
          return;
        }
      }
    }
  }, [currentLessonId, course?.id]);

  const currentLesson = allLessons.find((l: any) => l.id === currentLessonId);
  const hasNextButtonBlock = lessonBlocks.some((b: any) => b.type === "NEXT_BUTTON");
  const hasNotesBlock = lessonBlocks.some((b: any) => b.type === "NOTES");
  const currentIndex = allLessons.findIndex((l: any) => l.id === currentLessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const currentLessonAvailable = currentLesson ? isDripAvailable(currentLesson) : true;

  // Reset quiz state when lesson changes
  useEffect(() => {
    setQuizAnswers({});
    setQuizResult(null);
    setNoteContent("");
    setNoteSaveStatus("saved");
    setKcAllAnswered(true);
  }, [currentLessonId]);

  // Load note content when noteData changes
  useEffect(() => {
    if (noteData?.content !== undefined) {
      setNoteContent(noteData.content || "");
    } else if (noteData === null) {
      setNoteContent("");
    }
  }, [noteData]);

  // Timer: init when lesson changes
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerDone(false);
    if (currentLesson?.duration && currentLesson.duration > 0) {
      setTimerSeconds(currentLesson.duration * 60);
      timerActiveRef.current = true;
    } else {
      setTimerSeconds(null);
    }
  }, [currentLessonId]);

  // Timer: countdown
  useEffect(() => {
    if (timerSeconds === null || timerDone) return;
    timerRef.current = setInterval(() => {
      if (!timerActiveRef.current) return;
      setTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerSeconds !== null && !timerDone]);

  // Timer: pause when tab not visible
  useEffect(() => {
    const handleVisibility = () => {
      timerActiveRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleNoteChange = (val: string) => {
    setNoteContent(val);
    setNoteSaveStatus("unsaved");
    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(() => {
      if (val.trim()) {
        setNoteSaveStatus("saving");
        saveNoteMutation.mutate(val);
      }
    }, 1500);
  };

  const handleNoteBlur = () => {
    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    if (noteContent.trim() && noteSaveStatus === "unsaved") {
      setNoteSaveStatus("saving");
      saveNoteMutation.mutate(noteContent);
    }
  };

  // Compute scroll depth — called on scroll events and also after lesson renders
  const handleContentScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // If content fits without scrolling, scrollHeight === clientHeight → 100%
    const newProgress = el.scrollHeight <= el.clientHeight
      ? 100
      : Math.min(100, Math.round(((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100));
    setReadProgress(newProgress);
    // Fire scroll depth milestone events
    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
      const key = `${currentLessonId}-${m}`;
      if (newProgress >= m && !scrollMilestonesRef.current.has(key)) {
        scrollMilestonesRef.current.add(key);
        fetch("/api/track", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ eventType: "scroll_depth", courseId: course?.id, lessonId: currentLessonId, metadata: { percent: m } }),
        }).catch(() => {});
      }
    }
  }, [currentLessonId, course?.id]);

  // Reset state on lesson change, then check initial scroll position after render
  useEffect(() => {
    setReadProgress(0);
    setVideoProgress(0);
    setTimeOnLesson(0);
    // Give React time to render the lesson content, then measure
    const t = setTimeout(handleContentScroll, 200);
    return () => clearTimeout(t);
  }, [currentLessonId, handleContentScroll]);

  // Reset milestone refs on lesson change
  useEffect(() => {
    scrollMilestonesRef.current = new Set();
  }, [currentLessonId]);

  useEffect(() => {
    videoMilestonesRef.current = new Set();
  }, [currentLessonId]);

  // Handle video progress with milestones
  const handleVideoProgress = useCallback((pct: number) => {
    setVideoProgress(pct);
    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
      const key = `${currentLessonId}-${m}`;
      if (pct >= m && !videoMilestonesRef.current.has(key)) {
        videoMilestonesRef.current.add(key);
        fetch("/api/track", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ eventType: "video_progress", courseId: course?.id, lessonId: currentLessonId, metadata: { percent: m } }),
        }).catch(() => {});
      }
    }
  }, [currentLessonId, course?.id]);

  // Lesson abandonment tracking
  useEffect(() => {
    if (!currentLesson || !enrollment || isPreview) return;
    lessonStartTimeRef.current = Date.now();
    return () => {
      // On cleanup (lesson changed or unmounted) — if lesson not completed, fire abandon
      const isCompleted = progressMap[currentLesson.id]?.status === "COMPLETED" || localCompletedRef.current.has(currentLesson.id);
      if (!isCompleted) {
        const secondsSpent = Math.round((Date.now() - lessonStartTimeRef.current) / 1000);
        if (secondsSpent > 5) { // ignore accidental quick clicks
          navigator.sendBeacon("/api/track", JSON.stringify({
            eventType: "lesson_abandon",
            courseId: course?.id,
            lessonId: currentLesson.id,
            metadata: { secondsSpent },
          }));
        }
      }
    };
  }, [currentLesson?.id]);

  // Count seconds spent on current lesson
  useEffect(() => {
    if (!currentLesson || !enrollment || isPreview) return;
    if (progressMap[currentLesson.id]?.status === "COMPLETED") return;
    const interval = setInterval(() => setTimeOnLesson((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [currentLessonId, enrollment, isPreview]);

  // Compute whether completion requirements are met for the current lesson
  const requirementsMet = (() => {
    if (!currentLesson) return false;
    // YouTube/Vimeo embeds can't report playback progress — skip video % check
    const isEmbeddedVideo = currentLesson.videoUrl &&
      /(youtube\.com|youtu\.be|vimeo\.com)/i.test(currentLesson.videoUrl);
    if (isEmbeddedVideo) {
      // Just require a minimum time on the page (3s)
      return timeOnLesson >= 3;
    }
    const minRead = currentLesson.minReadSeconds ?? 0;
    const minVideo = currentLesson.minVideoPercent ?? (currentLesson.type === "VIDEO" && currentLesson.videoUrl ? 80 : 0);
    const readOk = timeOnLesson >= minRead && readProgress >= 95;
    const videoOk = !currentLesson.videoUrl || videoProgress >= minVideo;
    return readOk && videoOk;
  })();

  // Auto-complete when scroll reaches the end + minimum time on lesson
  useEffect(() => {
    if (!currentLesson || !enrollment || isPreview) return;
    if (autoCompletedRef.current.has(currentLesson.id)) return;
    if (progressMap[currentLesson.id]?.status === "COMPLETED") return;
    if (!requirementsMet) return;
    const timeDone = timeOnLesson >= 3;
    if (timeDone) {
      autoCompletedRef.current.add(currentLesson.id);
      completeMutation.mutate(currentLesson.id);
    }
  }, [requirementsMet, timeOnLesson, currentLesson, enrollment, isPreview, progressMap]);

  // Record lesson view (marks IN_PROGRESS in DB)
  useEffect(() => {
    if (!currentLessonId || !enrollment) return;
    fetch(`/api/lessons/${currentLessonId}/view`, { method: "POST", credentials: "include" })
      .catch(() => {});
  }, [currentLessonId, enrollment]);

  // Heartbeat: track time spent every 30s
  useEffect(() => {
    if (!currentLesson || !enrollment || isPreview) return;
    const interval = setInterval(() => {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventType: "time_spent",
          courseId: course?.id,
          lessonId: currentLesson.id,
          metadata: { seconds: 30 },
        }),
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [currentLesson?.id, enrollment, isPreview, course?.id]);

  const completeMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      await apiRequest("POST", `/api/lessons/${lessonId}/complete`);
    },
    onSuccess: (_data, lessonId) => {
      localCompletedRef.current.add(lessonId);
      queryClient.invalidateQueries({ queryKey: ["/api/learn", params?.slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
  });

  const completeAndAdvance = (lessonId: number) => {
    completeMutation.mutate(lessonId, {
      onSuccess: () => {
        if (nextLesson) setCurrentLessonId(nextLesson.id);
      },
    });
  };

  const currentModuleId = currentLesson ?
    (course?.subjects || []).flatMap((s: any) => s.modules || []).find((m: any) =>
      m.lessons?.some((l: any) => l.id === currentLesson.id)
    )?.id : undefined;

  const canAdvanceToModule = (targetModuleId: number, srcModuleId: number | undefined) => {
    if (!srcModuleId || targetModuleId === srcModuleId || isPreview) return true;
    const currentMod = (course?.subjects || []).flatMap((s: any) => s.modules || []).find((m: any) => m.id === srcModuleId);
    if (!currentMod) return true;
    const blockingQuizzes = (currentMod.lessons || []).filter((l: any) => l.type === "QUIZ" && l.blockNextModule);
    return blockingQuizzes.every((l: any) => {
      const progress = progressMap[l.id];
      return progress?.status === "COMPLETED" || localCompletedRef.current.has(l.id);
    });
  };

  const nextModuleId = nextLesson ?
    (course?.subjects || []).flatMap((s: any) => s.modules || []).find((m: any) =>
      m.lessons?.some((l: any) => l.id === nextLesson?.id)
    )?.id : undefined;
  const nextModuleBlocked = nextModuleId !== undefined && nextModuleId !== currentModuleId && !canAdvanceToModule(nextModuleId, currentModuleId);

  const submitQuiz = async () => {
    if (!currentLesson?.quiz) return;
    setQuizSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/quizzes/${currentLesson.quiz.id}/submit`, {
        answers: quizAnswers,
        lessonId: currentLesson.id,
      });
      const result = await res.json();
      setQuizResult(result);
      if (result.passed) {
        queryClient.invalidateQueries({ queryKey: ["/api/learn", params?.slug] });
        queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setQuizSubmitting(false);
    }
  };

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

  if (!course || (!enrollment && !isPreview)) {
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

  const lessonIcon = (lesson: any) => {
    if (lesson.type === "QUIZ") return <HelpCircle className="h-3 w-3 shrink-0" />;
    if (lesson.type === "VIDEO") return <Play className="h-3 w-3 shrink-0" />;
    return <FileText className="h-3 w-3 shrink-0" />;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {showIntake && <IntakeModal onComplete={() => setShowIntake(false)} />}
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
                          <button
                            className="w-full px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors text-left"
                            onClick={() => setExpandedModuleIds(prev => {
                              const next = new Set(prev);
                              if (next.has(mod.id)) next.delete(mod.id);
                              else next.add(mod.id);
                              return next;
                            })}
                          >
                            {expandedModuleIds.has(mod.id) ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                            <span className="flex-1 truncate">{mod.title}</span>
                          </button>
                          {expandedModuleIds.has(mod.id) && mod.lessons
                            ?.sort((a: any, b: any) => a.position - b.position)
                            .map((lesson: any) => {
                              const isCompleted = progressMap[lesson.id]?.status === "COMPLETED" || localCompletedRef.current.has(lesson.id);
                              const isCurrent = lesson.id === currentLessonId;
                              const available = isDripAvailable(lesson);
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => available && setCurrentLessonId(lesson.id)}
                                  disabled={!available}
                                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors text-left ${
                                    isCurrent
                                      ? "bg-primary/10 text-primary font-medium"
                                      : available
                                      ? "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                      : "text-muted-foreground/40 cursor-not-allowed"
                                  }`}
                                  data-testid={`button-lesson-${lesson.id}`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                  ) : !available ? (
                                    <Lock className="h-4 w-4 shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 shrink-0" />
                                  )}
                                  <span className="flex-1 truncate">{lesson.title}</span>
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
        {isPreview && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <span className="text-xs font-medium">Preview mode — progress is not tracked</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-amber-500/40 hover:bg-amber-500/10"
              onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
            >
              ← Exit Preview
            </Button>
          </div>
        )}
        {!sidebarOpen && (
          <div className="p-2 border-b">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} data-testid="button-open-sidebar">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" onScroll={handleContentScroll}>
          {currentLesson ? (
            <div className="max-w-4xl mx-auto p-6 md:p-8">
              <div className="mb-6">
                <span className="text-xs text-muted-foreground">
                  {currentLesson.subjectTitle} › {currentLesson.moduleTitle}
                </span>
                <div className="flex items-start justify-between gap-3 mt-1">
                  <h1 className="text-2xl font-bold" data-testid="text-lesson-title">{currentLesson.title}</h1>
                  <div className="flex items-start gap-3 shrink-0">
                    {timerSeconds !== null && (
                      <div className="flex flex-col items-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Lesson Duration</span>
                        <div className={`flex items-center gap-1 text-sm font-mono font-semibold px-2 py-1 rounded-md border ${timerDone ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400" : "border-border bg-muted text-foreground"}`}>
                          {timerDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          {timerDone ? "0:00" : `${Math.floor((timerSeconds || 0) / 60)}:${String((timerSeconds || 0) % 60).padStart(2, "0")}`}
                        </div>
                      </div>
                    )}
                    {enrollment && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 mt-0.5"
                        onClick={() => toggleBookmarkMutation.mutate()}
                        title={isBookmarked ? "Remove bookmark" : "Bookmark this lesson"}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="h-5 w-5 text-primary fill-primary" />
                        ) : (
                          <Bookmark className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reading progress bar */}
              {currentLessonAvailable && !isPreview && enrollment && currentLesson.type !== "QUIZ" && (
                <div className="mb-6">
                  {progressMap[currentLesson.id]?.status === "COMPLETED" ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Completed
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Reading progress</span>
                        <span>{readProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${readProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Drip locked content */}
              {!currentLessonAvailable ? (
                <div className="text-center py-16 border rounded-md">
                  <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Content Locked</h3>
                  <p className="text-muted-foreground mb-2">This lesson will be available in</p>
                  <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl">
                    <Clock className="h-6 w-6" />
                    {dripDaysRemaining(currentLesson)} day{dripDaysRemaining(currentLesson) !== 1 ? "s" : ""}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Available {currentLesson.dripDays} day{currentLesson.dripDays !== 1 ? "s" : ""} after enrollment
                  </p>
                </div>
              ) : currentLesson.type === "QUIZ" && currentLesson.quiz ? (
                /* Quiz Lesson */
                <div className="space-y-6">
                  {quizResult ? (
                    /* Quiz Results */
                    <div className="text-center py-8 border rounded-md space-y-4">
                      {quizResult.passed ? (
                        <>
                          <Trophy className="h-16 w-16 mx-auto text-amber-500" />
                          <h3 className="text-2xl font-bold text-emerald-600">Passed!</h3>
                        </>
                      ) : (
                        <>
                          <X className="h-16 w-16 mx-auto text-destructive" />
                          <h3 className="text-2xl font-bold">Not Passed</h3>
                        </>
                      )}
                      <p className="text-lg">
                        Score: <span className="font-bold">{Math.round(quizResult.score)}%</span>
                        <span className="text-muted-foreground text-sm ml-2">({quizResult.correct}/{quizResult.total} correct)</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Passing score: {currentLesson.minQuizScore ?? 70}%</p>
                      {!quizResult.passed && (
                        <Button variant="outline" onClick={() => { setQuizResult(null); setQuizAnswers({}); }}>
                          Try Again
                        </Button>
                      )}
                    </div>
                  ) : (
                    /* Quiz Form */
                    <div className="border rounded-md p-6 space-y-6">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Quiz — {currentLesson.quiz.questions?.length} Questions</h2>
                      </div>
                      {currentLesson.quiz.questions?.map((q: any, qi: number) => (
                        <div key={q.id} className="space-y-3">
                          <p className="font-medium text-sm">
                            {qi + 1}. {q.question}
                          </p>
                          {q.type === "MULTI_SELECTION" ? (
                            <div className="space-y-2">
                              {q.options?.map((opt: any) => (
                                <div key={opt.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`opt-${opt.id}`}
                                    checked={Array.isArray(quizAnswers[q.id]) ? (quizAnswers[q.id] as number[]).includes(opt.id) : false}
                                    onChange={(e) => {
                                      const current = Array.isArray(quizAnswers[q.id]) ? quizAnswers[q.id] as number[] : [];
                                      if (e.target.checked) {
                                        setQuizAnswers({ ...quizAnswers, [q.id]: [...current, opt.id] });
                                      } else {
                                        setQuizAnswers({ ...quizAnswers, [q.id]: current.filter((id: number) => id !== opt.id) });
                                      }
                                    }}
                                    className="accent-primary"
                                  />
                                  <Label htmlFor={`opt-${opt.id}`} className="font-normal cursor-pointer">{opt.text}</Label>
                                </div>
                              ))}
                              {(q.selectionLabel || "Select all that apply") ? (
                                <p className="text-xs text-muted-foreground italic">{q.selectionLabel || "Select all that apply"}</p>
                              ) : null}
                            </div>
                          ) : (
                            <RadioGroup
                              value={String(quizAnswers[q.id] || "")}
                              onValueChange={(val) => setQuizAnswers({ ...quizAnswers, [q.id]: parseInt(val) })}
                            >
                              {q.options?.map((opt: any) => (
                                <div key={opt.id} className="flex items-center space-x-2">
                                  <RadioGroupItem value={String(opt.id)} id={`opt-${opt.id}`} />
                                  <Label htmlFor={`opt-${opt.id}`} className="font-normal cursor-pointer">{opt.text}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                        </div>
                      ))}
                      <Button
                        onClick={submitQuiz}
                        disabled={quizSubmitting || currentLesson.quiz.questions?.some((q: any) => {
                          const ans = quizAnswers[q.id];
                          if (q.type === "MULTI_SELECTION") return !Array.isArray(ans) || ans.length === 0;
                          return !ans;
                        })}
                        className="w-full"
                      >
                        Submit Quiz
                      </Button>
                      {currentLesson.quiz.questions?.some((q: any) => {
                        const ans = quizAnswers[q.id];
                        if (q.type === "MULTI_SELECTION") return !Array.isArray(ans) || ans.length === 0;
                        return !ans;
                      }) && (
                        <p className="text-xs text-muted-foreground text-center">Please answer all questions before submitting</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Regular Lesson */
                <>
                  {currentLesson.type === "VIDEO" && currentLesson.videoUrl && (
                    <VideoPlayer
                      url={currentLesson.videoUrl}
                      onProgress={handleVideoProgress}
                    />
                  )}

                  {lessonBlocks.length > 0 ? (
                    <div data-testid="text-lesson-content">
                      <BlockRenderer
                        blocks={lessonBlocks}
                        onKnowledgeChecksAnswered={setKcAllAnswered}
                        navState={hasNextButtonBlock ? {
                          onNext: nextLesson ? () => setCurrentLessonId(nextLesson.id) : undefined,
                          onPrev: prevLesson ? () => setCurrentLessonId(prevLesson.id) : undefined,
                          nextDisabled: !kcAllAnswered,
                        } : undefined}
                        noteState={hasNotesBlock && enrollment ? {
                          content: noteContent,
                          onChange: handleNoteChange,
                          saveStatus: noteSaveStatus,
                        } : undefined}
                      />
                    </div>
                  ) : currentLesson.content ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none mb-8"
                      data-testid="text-lesson-content"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentLesson.content) }}
                    />
                  ) : !currentLesson.videoUrl ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4" />
                      <p>No content available for this lesson yet.</p>
                    </div>
                  ) : null}
                </>
              )}

              {/* Notes Panel */}
              {enrollment && currentLessonAvailable && !hasNotesBlock && (
                <div className="mt-8 border rounded-md overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                    onClick={() => setNotesOpen(!notesOpen)}
                  >
                    <span className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      My Notes
                      {noteContent && <Badge variant="secondary" className="text-xs h-4 px-1">Saved</Badge>}
                    </span>
                    {notesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {notesOpen && (
                    <div className="px-4 pb-4 space-y-2 border-t">
                      <Textarea
                        className="mt-3 min-h-[120px] text-sm resize-none"
                        placeholder="Write your notes for this lesson..."
                        value={noteContent}
                        onChange={(e) => handleNoteChange(e.target.value)}
                        onBlur={handleNoteBlur}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Notes auto-save as you type</span>
                        <span className={noteSaveStatus === "saving" ? "text-amber-500" : noteSaveStatus === "saved" && noteContent ? "text-emerald-500" : ""}>
                          {noteSaveStatus === "saving" ? "Saving..." : noteSaveStatus === "unsaved" ? "Unsaved" : noteContent ? "Saved" : ""}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentLessonAvailable && !hasNextButtonBlock && (
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
                    {currentLesson.type !== "QUIZ" && progressMap[currentLessonId!]?.status !== "COMPLETED" && (
                      <div className="flex flex-col items-end gap-1">
                        <Button
                          onClick={() => completeAndAdvance(currentLessonId!)}
                          disabled={completeMutation.isPending || !requirementsMet}
                          data-testid="button-mark-complete"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                        {!requirementsMet && (currentLesson.minReadSeconds || currentLesson.minVideoPercent) && (
                          <p className="text-[10px] text-muted-foreground">
                            {currentLesson.minReadSeconds && timeOnLesson < currentLesson.minReadSeconds
                              ? `${currentLesson.minReadSeconds - timeOnLesson}s read time remaining`
                              : currentLesson.minVideoPercent && videoProgress < currentLesson.minVideoPercent
                              ? `Watch ${currentLesson.minVideoPercent}% of video to complete`
                              : "Scroll to the bottom to complete"}
                          </p>
                        )}
                      </div>
                    )}
                    {nextLesson && (
                      <div className="flex flex-col items-end gap-1">
                        <Button
                          variant={progressMap[currentLessonId!]?.status === "COMPLETED" ? "default" : "outline"}
                          onClick={() => setCurrentLessonId(nextLesson.id)}
                          data-testid="button-next-lesson"
                          disabled={!kcAllAnswered || nextModuleBlocked}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        {!kcAllAnswered && (
                          <p className="text-[10px] text-muted-foreground">Answer all questions to continue</p>
                        )}
                        {nextModuleBlocked && (
                          <p className="text-xs text-amber-600 text-center mt-1">Complete all required quizzes in this module before moving on.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
