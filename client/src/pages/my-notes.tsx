import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Trash2, Download, Edit2 } from "lucide-react";

export default function MyNotesPage() {
  const [, navigate] = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [summaryEdit, setSummaryEdit] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");

  const { data: enrollments = [] } = useQuery<any[]>({ queryKey: ["/api/enrollments"] });

  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ["/api/courses", selectedCourseId, "notes"],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${selectedCourseId}/notes`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedCourseId,
  });

  const { data: courseData } = useQuery<any>({
    queryKey: ["/api/learn", selectedCourseSlug],
    queryFn: async () => {
      const res = await fetch(`/api/learn/${selectedCourseSlug}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedCourseSlug,
  });

  const selectedCourse = enrollments.find((e: any) => e.course?.id === selectedCourseId)?.course;

  const allLessons: any[] = [];
  (courseData?.course?.subjects || []).forEach((subj: any) => {
    (subj.modules || []).sort((a: any, b: any) => a.position - b.position).forEach((mod: any) => {
      (mod.lessons || []).sort((a: any, b: any) => a.position - b.position).forEach((lesson: any) => {
        allLessons.push({ ...lesson, moduleName: mod.title, subjectName: subj.title });
      });
    });
  });

  const notesByLesson: Record<number, any> = {};
  notes.forEach((n: any) => { if (n.lessonId) notesByLesson[n.lessonId] = n; });
  const summaryNote = notes.find((n: any) => !n.lessonId);

  const upsertNote = useMutation({
    mutationFn: async ({ lessonId, content }: { lessonId: number | null; content: string }) => {
      await apiRequest("PUT", `/api/courses/${selectedCourseId}/notes`, { lessonId, content });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourseId, "notes"] }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/notes/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourseId, "notes"] }),
  });

  const exportNotes = () => {
    if (!selectedCourse) return;
    let text = `# ${selectedCourse.title} — My Notes\n\n`;
    if (summaryNote?.content) text += `## Course Summary\n\n${summaryNote.content}\n\n---\n\n`;
    const modules: Record<string, any[]> = {};
    allLessons.forEach((lesson: any) => {
      const note = notesByLesson[lesson.id];
      if (note?.content) {
        if (!modules[lesson.moduleName]) modules[lesson.moduleName] = [];
        modules[lesson.moduleName].push({ lesson, note });
      }
    });
    Object.entries(modules).forEach(([modName, items]) => {
      text += `## ${modName}\n\n`;
      (items as any[]).forEach(({ lesson, note }: any) => { text += `### ${lesson.title}\n\n${note.content}\n\n`; });
    });
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedCourse.title.replace(/[^a-z0-9]/gi, "_")}_notes.txt`;
    a.click();
  };

  if (!selectedCourseId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold">My Notes</h1>
        </div>
        <p className="text-muted-foreground mb-6">Select a course to view your notes:</p>
        <div className="space-y-3">
          {(enrollments as any[]).map((e: any) => (
            <button key={e.course?.id} onClick={() => { setSelectedCourseId(e.course?.id); setSelectedCourseSlug(e.course?.slug); }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left">
              {e.course?.thumbnail && <img src={e.course.thumbnail} alt="" className="h-12 w-20 object-cover rounded" />}
              <div>
                <p className="font-medium">{e.course?.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{notes.filter((n: any) => n.content).length} notes</p>
              </div>
            </button>
          ))}
          {enrollments.length === 0 && <p className="text-muted-foreground text-sm">No courses enrolled yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedCourseId(null); setSelectedCourseSlug(null); }}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold">{selectedCourse?.title}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={exportNotes} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Export notes
        </Button>
      </div>

      {/* Course summary */}
      <div className="mb-8 border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Course Summary</h2>
          {!summaryEdit && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSummaryEdit(true); setSummaryContent(summaryNote?.content || ""); }}><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>}
        </div>
        {summaryEdit ? (
          <div className="space-y-2">
            <Textarea value={summaryContent} onChange={(e) => setSummaryContent(e.target.value)} placeholder="Add a summary for this whole course…" className="min-h-[100px]" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { upsertNote.mutate({ lessonId: null, content: summaryContent }); setSummaryEdit(false); }}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setSummaryEdit(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summaryNote?.content || "No summary yet. Click Edit to add one."}</p>
        )}
      </div>

      {/* Lesson notes by module */}
      {(() => {
        const modules: Record<string, any[]> = {};
        allLessons.forEach((lesson: any) => {
          if (!modules[lesson.moduleName]) modules[lesson.moduleName] = [];
          modules[lesson.moduleName].push(lesson);
        });
        return Object.entries(modules).map(([modName, modLessons]) => {
          const lessonsWithNotes = (modLessons as any[]).filter((l: any) => notesByLesson[l.id]);
          if (lessonsWithNotes.length === 0) return null;
          return (
            <div key={modName} className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{modName}</h3>
              <div className="space-y-3">
                {lessonsWithNotes.map((lesson: any) => {
                  const note = notesByLesson[lesson.id];
                  const isEditing = editingNoteId === lesson.id;
                  return (
                    <div key={lesson.id} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <div className="flex gap-1 shrink-0">
                          {!isEditing && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingNoteId(lesson.id); setEditContent(note.content); }}><Edit2 className="h-3 w-3" /></Button>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteNote.mutate(note.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[80px] text-sm" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => { upsertNote.mutate({ lessonId: lesson.id, content: editContent }); setEditingNoteId(null); }}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{note.content}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}
