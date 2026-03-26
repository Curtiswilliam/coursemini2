import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BlockBuilder } from "@/components/block-builder";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/use-auto-save";
import { Loader2, Plus, Trash2, X, CheckCircle2, Clock, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { Lesson } from "./types";
import { cn } from "@/lib/utils";

function getEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?byline=0&portrait=0`;
  return null;
}

interface LessonCanvasProps {
  lesson: Lesson;
  courseId: number;
  onRefresh: () => void;
}

interface QuizState {
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SINGLE_SELECTION" | "MULTI_SELECTION";
  position: number;
  options: { text: string; isCorrect: boolean }[];
  selectionLabel?: string;
}

function SaveBadge({ status }: { status: string }) {
  if (status === "saving") return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" /> Saving…
    </span>
  );
  if (status === "saved") return (
    <span className="flex items-center gap-1 text-xs text-emerald-500">
      <CheckCircle2 className="h-3 w-3" /> Saved
    </span>
  );
  if (status === "unsaved") return (
    <span className="flex items-center gap-1 text-xs text-amber-500">
      <Clock className="h-3 w-3" /> Unsaved changes
    </span>
  );
  return null;
}

export function LessonCanvas({ lesson, courseId, onRefresh }: LessonCanvasProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(lesson.title);
  const [type, setType] = useState<"TEXT" | "VIDEO" | "QUIZ">(lesson.type);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl || "");
  const [duration, setDuration] = useState(lesson.duration?.toString() || "");
  const [dripDays, setDripDays] = useState(lesson.dripDays?.toString() || "");
  const [minReadSeconds, setMinReadSeconds] = useState(lesson.minReadSeconds?.toString() || "");
  const [minVideoPercent, setMinVideoPercent] = useState(lesson.minVideoPercent?.toString() || "");
  const [minQuizScore, setMinQuizScore] = useState(lesson.minQuizScore?.toString() || "");
  const [blockNextModule, setBlockNextModule] = useState(lesson.blockNextModule ?? false);
  const [requirementsOpen, setRequirementsOpen] = useState(false);

  // AI outline state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizState[]>(
    lesson.quiz?.questions?.map((q) => ({
      question: q.question,
      type: q.type as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SINGLE_SELECTION" | "MULTI_SELECTION",
      position: q.position,
      selectionLabel: (q as any).selectionLabel || undefined,
      options: q.options?.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) || [],
    })) || []
  );
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Reset when lesson changes
  const lessonIdRef = useRef(lesson.id);
  useEffect(() => {
    if (lessonIdRef.current !== lesson.id) {
      lessonIdRef.current = lesson.id;
      setTitle(lesson.title);
      setType(lesson.type);
      setVideoUrl(lesson.videoUrl || "");
      setDuration(lesson.duration?.toString() || "");
      setDripDays(lesson.dripDays?.toString() || "");
      setMinReadSeconds(lesson.minReadSeconds?.toString() || "");
      setMinVideoPercent(lesson.minVideoPercent?.toString() || "");
      setMinQuizScore(lesson.minQuizScore?.toString() || "");
      setBlockNextModule(lesson.blockNextModule ?? false);
      setRequirementsOpen(false);
      setAiTopic("");
      setQuizQuestions(
        lesson.quiz?.questions?.map((q) => ({
          question: q.question,
          type: q.type as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SINGLE_SELECTION" | "MULTI_SELECTION",
          position: q.position,
          selectionLabel: (q as any).selectionLabel || undefined,
          options: q.options?.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) || [],
        })) || []
      );
    }
  }, [lesson]);

  const { data: lessonBlocks = [] } = useQuery({
    queryKey: ["/api/lessons", lesson.id, "blocks"],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/${lesson.id}/blocks`, { credentials: "include" });
      return res.json();
    },
  });

  const totalVideoDuration = lessonBlocks.reduce((sum: number, b: any) => {
    if (b.type === "VIDEO") {
      try {
        const c = JSON.parse(b.content);
        return sum + (c.duration ? parseFloat(c.duration) : 0);
      } catch { return sum; }
    }
    return sum;
  }, 0);

  const suggestedDuration = totalVideoDuration > 0 ? Math.round(totalVideoDuration) : null;

  const saveData = { title, type, videoUrl, duration, dripDays, minReadSeconds, minVideoPercent, minQuizScore, blockNextModule };
  const saveDataStr = JSON.stringify(saveData);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof saveData) => {
      await apiRequest("PATCH", `/api/admin/lessons/${lesson.id}`, {
        title: data.title,
        type: data.type,
        videoUrl: data.type === "VIDEO" ? data.videoUrl : null,
        duration: data.duration ? parseInt(data.duration) : null,
        dripDays: data.dripDays ? parseInt(data.dripDays) : null,
        minReadSeconds: data.minReadSeconds ? parseInt(data.minReadSeconds) : null,
        minVideoPercent: data.minVideoPercent ? parseInt(data.minVideoPercent) : null,
        minQuizScore: data.minQuizScore ? parseInt(data.minQuizScore) : null,
        blockNextModule: data.blockNextModule,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
      onRefresh();
    },
  });

  const { status, markSaved } = useAutoSave(
    saveDataStr,
    async () => {
      await saveMutation.mutateAsync(JSON.parse(saveDataStr));
    },
    { enabled: true }
  );

  useEffect(() => { markSaved(); }, [lesson.id, markSaved]);

  // Auto-update duration when quiz questions change
  useEffect(() => {
    if (type === "QUIZ" && quizQuestions.length > 0) {
      setDuration(String(quizQuestions.length));
    }
  }, [quizQuestions.length, type]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveMutation.mutate(JSON.parse(saveDataStr));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveDataStr]);

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

  const generateOutline = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const res = await apiRequest("POST", `/api/admin/lessons/${lesson.id}/generate-outline`, { topic: aiTopic });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: `Generated ${data.created} blocks`, description: "AI outline added to lesson." });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lesson.id, "blocks"] });
      setAiOpen(false);
      setAiTopic("");
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // Whether any completion requirement is set
  const hasRequirements = !!(minReadSeconds || minVideoPercent || minQuizScore);

  return (
    <div className="h-full flex flex-col">
      {/* Lesson header */}
      <div className="border-b px-8 py-4 space-y-3 shrink-0 bg-card/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Title */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
              className="text-xl font-semibold border-none bg-transparent shadow-none px-0 h-auto text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 text-base"
            />
            {/* Meta row */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Type:</span>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger className="h-7 text-xs w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text / Blocks</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {type === "VIDEO" && (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-muted-foreground shrink-0">URL:</span>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube, Vimeo, or direct URL"
                    className="h-7 text-xs"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Duration:</span>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="0"
                  className="h-7 text-xs w-24"
                />
                <span className="text-xs text-muted-foreground">min</span>
                {suggestedDuration !== null && String(suggestedDuration) !== duration && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setDuration(String(suggestedDuration))}
                    title="Auto-calculated from video block durations"
                  >
                    Use {suggestedDuration} min from videos
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Drip days:</span>
                <Input
                  type="number"
                  value={dripDays}
                  onChange={(e) => setDripDays(e.target.value)}
                  placeholder="0"
                  className="h-7 text-xs w-14"
                />
              </div>
            </div>

            {/* Completion Requirements accordion */}
            <div>
              <button
                type="button"
                onClick={() => setRequirementsOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium transition-colors",
                  hasRequirements ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {requirementsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Completion requirements
                {hasRequirements && <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">active</span>}
              </button>

              {requirementsOpen && (
                <div className="mt-2 flex items-center gap-4 flex-wrap pl-4 border-l-2 border-muted">
                  {(type === "TEXT" || type === "VIDEO") && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Min read time (sec):</span>
                      <Input
                        type="number"
                        min={0}
                        value={minReadSeconds}
                        onChange={(e) => setMinReadSeconds(e.target.value)}
                        placeholder="none"
                        className="h-7 text-xs w-20"
                      />
                    </div>
                  )}
                  {type === "VIDEO" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Min video watched (%):</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={minVideoPercent}
                        onChange={(e) => setMinVideoPercent(e.target.value)}
                        placeholder="80"
                        className="h-7 text-xs w-16"
                      />
                    </div>
                  )}
                  {type === "QUIZ" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Min quiz score (%):</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={minQuizScore}
                        onChange={(e) => setMinQuizScore(e.target.value)}
                        placeholder="70"
                        className="h-7 text-xs w-16"
                      />
                    </div>
                  )}
                  {type === "QUIZ" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="blockNextModule"
                        checked={blockNextModule}
                        onChange={(e) => setBlockNextModule(e.target.checked)}
                        className="accent-primary h-3.5 w-3.5"
                      />
                      <label htmlFor="blockNextModule" className="text-xs text-muted-foreground cursor-pointer">
                        Block students from next module until this quiz is passed
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground w-full">
                    Students must meet these thresholds before the lesson counts as complete.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right side: save status + AI button */}
          <div className="shrink-0 pt-1 flex flex-col items-end gap-2">
            <SaveBadge status={status} />
            {type !== "QUIZ" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={() => setAiOpen(true)}
              >
                <Sparkles className="h-3 w-3 text-purple-500" />
                Generate with AI
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {type === "QUIZ" ? (
          <QuizBuilder
            questions={quizQuestions}
            onChange={setQuizQuestions}
            onSave={saveQuiz}
            isSaving={savingQuiz}
          />
        ) : type === "VIDEO" ? (
          <div className="max-w-3xl mx-auto px-8 py-6">
            {videoUrl ? (
              (() => {
                const embedUrl = getEmbedUrl(videoUrl);
                if (embedUrl) {
                  return (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg ring-1 ring-border/20">
                      <iframe
                        src={embedUrl}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="origin"
                        title="Video preview"
                      />
                    </div>
                  );
                }
                // Direct video file
                return (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                    <video src={videoUrl} controls className="h-full w-full" />
                  </div>
                );
              })()
            ) : (
              <div className="aspect-video rounded-xl bg-muted/40 border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Paste a video URL above</p>
                  <p className="text-xs mt-0.5">YouTube, Vimeo, or direct video link</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-8 py-6">
            <BlockBuilder lessonId={lesson.id} />
          </div>
        )}
      </div>

      {/* AI Outline Dialog */}
      <Dialog open={aiOpen} onOpenChange={(o) => { if (!o) setAiOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Generate Lesson Outline with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">What is this lesson about?</label>
              <Textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. JavaScript Promises and async/await — covering the event loop, promise chaining, error handling with try/catch, and common pitfalls"
                className="min-h-[100px] text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generateOutline();
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific for better results. The AI will generate 8–14 content blocks.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading}>Cancel</Button>
              <Button onClick={generateOutline} disabled={aiLoading || !aiTopic.trim()}>
                {aiLoading ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuizBuilder({
  questions,
  onChange,
  onSave,
  isSaving,
}: {
  questions: QuizState[];
  onChange: (q: QuizState[]) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (questions.length === 0) return;
    const timer = setTimeout(() => onSave(), 1500);
    return () => clearTimeout(timer);
  }, [questions]);

  const addQuestion = () => {
    onChange([...questions, {
      question: "",
      type: "SINGLE_SELECTION",
      position: questions.length,
      options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }],
    }]);
  };

  const updateQuestion = (qi: number, field: string, value: any) => {
    onChange(questions.map((q, i) => i === qi ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (qi: number) => {
    onChange(questions.filter((_, i) => i !== qi).map((q, i) => ({ ...q, position: i })));
  };

  const addOption = (qi: number) => {
    onChange(questions.map((q, i) =>
      i === qi ? { ...q, options: [...q.options, { text: "", isCorrect: false }] } : q
    ));
  };

  const updateOption = (qi: number, oi: number, field: string, value: any) => {
    onChange(questions.map((q, i) =>
      i !== qi ? q : {
        ...q,
        options: q.options.map((o, j) =>
          j === oi
            ? { ...o, [field]: value }
            : field === "isCorrect" && value && q.type !== "MULTI_SELECTION"
              ? { ...o, isCorrect: false }  // Only clear others for single selection
              : o
        ),
      }
    ));
  };

  const removeOption = (qi: number, oi: number) => {
    onChange(questions.map((q, i) =>
      i !== qi ? q : { ...q, options: q.options.filter((_, j) => j !== oi) }
    ));
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Quiz Questions</h3>
        <Button size="sm" variant="outline" onClick={addQuestion} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 && (
        <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
          <p className="text-sm">No questions yet. Click "Add Question" to get started.</p>
        </div>
      )}

      {questions.map((q, qi) => (
        <div key={qi} className="border rounded-xl p-4 space-y-3 bg-card">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-6 shrink-0">Q{qi + 1}</span>
            <Input
              value={q.question}
              onChange={(e) => updateQuestion(qi, "question", e.target.value)}
              placeholder="Question text"
              className="flex-1 text-sm"
            />
            <Select value={q.type} onValueChange={(v) => updateQuestion(qi, "type", v)}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE_SELECTION">Single Selection</SelectItem>
                <SelectItem value="MULTI_SELECTION">Multi Selection</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive shrink-0"
              onClick={() => removeQuestion(qi)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-1.5 pl-8">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                {q.type === "MULTI_SELECTION" ? (
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={(e) => updateOption(qi, oi, "isCorrect", e.target.checked)}
                    className="shrink-0 accent-primary"
                  />
                ) : (
                  <input
                    type="radio"
                    name={`q${qi}-correct`}
                    checked={opt.isCorrect}
                    onChange={() => updateOption(qi, oi, "isCorrect", true)}
                    className="shrink-0 accent-primary"
                  />
                )}
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(qi, oi, "text", e.target.value)}
                  placeholder={`Option ${oi + 1}`}
                  className={cn(
                    "flex-1 h-8 text-xs",
                    opt.isCorrect && "border-emerald-500/50 bg-emerald-500/5"
                  )}
                />
                {q.options.length > 2 && (
                  <button
                    onClick={() => removeOption(qi, oi)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {(q.type === "SINGLE_SELECTION" || q.type === "MULTI_SELECTION") && q.options.length < 6 && (
              <button
                onClick={() => addOption(qi)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 pl-6 mt-1"
              >
                <Plus className="h-3 w-3" /> Add option
              </button>
            )}
            {q.type === "MULTI_SELECTION" && (
              <div className="pl-6 mt-1.5">
                <Input
                  value={q.selectionLabel || ""}
                  onChange={(e) => updateQuestion(qi, "selectionLabel", e.target.value)}
                  placeholder='Description shown to students e.g. "Select all that apply"'
                  className="h-7 text-xs text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">This description is shown below the options to students</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {questions.length > 0 && (
        <Button onClick={onSave} disabled={isSaving} className="w-full">
          {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Save Quiz
        </Button>
      )}
    </div>
  );
}
