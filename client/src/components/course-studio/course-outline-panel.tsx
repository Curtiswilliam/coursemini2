import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Trash2, ChevronDown, ChevronRight,
  Layers, Box, FileText, Play, BookOpen,
  GripVertical, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Subject, Lesson } from "./types";

interface OutlinePanelProps {
  courseId: number;
  subjects: Subject[];
  selectedLessonId: number | null;
  onSelectLesson: (lessonId: number) => void;
  onRefresh: () => void;
}

function LessonIcon({ type }: { type: string }) {
  if (type === "VIDEO") return <Play className="h-3 w-3 text-rose-400 shrink-0" />;
  if (type === "QUIZ") return <BookOpen className="h-3 w-3 text-primary shrink-0" />;
  return <FileText className="h-3 w-3 text-muted-foreground shrink-0" />;
}

interface LessonItemProps {
  lesson: Lesson;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onDuplicate: () => void;
  blockCount?: number;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

function LessonItem({ lesson, isSelected, onSelect, onDelete, onRename, onDuplicate, blockCount, draggable, onDragStart, onDragOver, onDrop }: LessonItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);

  const commitRename = () => {
    setEditing(false);
    if (title.trim() && title !== lesson.title) {
      onRename(title.trim());
    }
  };

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
      )}
      onClick={() => !editing && onSelect()}
    >
      <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-30 shrink-0" />
      <LessonIcon type={lesson.type} />
      {editing ? (
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") { setTitle(lesson.title); setEditing(false); }
          }}
          className="h-5 text-xs px-1 py-0 flex-1 bg-background"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate text-xs leading-relaxed">{lesson.title}</span>
      )}
      {blockCount !== undefined && (
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0",
          blockCount === 0
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary"
        )}>
          {blockCount === 0 ? "Empty" : `${blockCount}`}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-muted shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function CourseOutlinePanel({
  courseId,
  subjects,
  selectedLessonId,
  onSelectLesson,
  onRefresh,
}: OutlinePanelProps) {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(
    () => new Set<number>(subjects.map((s) => s.id))
  );
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    () => new Set<number>(subjects.flatMap((s) => s.modules.map((m) => m.id)))
  );
  const [dragLessonId, setDragLessonId] = useState<number | null>(null);
  const [dragLessonSourceModuleId, setDragLessonSourceModuleId] = useState<number | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
    onRefresh();
  };

  const addSubject = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/subjects", {
        courseId,
        title: `Section ${subjects.length + 1}`,
        position: subjects.length,
      });
      return res.json();
    },
    onSuccess: (data) => {
      invalidate();
      setExpandedSubjects((prev) => new Set<number>([...Array.from(prev), data.id]));
    },
  });

  const updateSubject = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PATCH", `/api/admin/subjects/${id}`, { title });
    },
    onSuccess: invalidate,
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/subjects/${id}`);
    },
    onSuccess: invalidate,
  });

  const addModule = useMutation({
    mutationFn: async ({ subjectId, position }: { subjectId: number; position: number }) => {
      const res = await apiRequest("POST", "/api/admin/modules", {
        subjectId,
        title: `Module ${position + 1}`,
        position,
      });
      return res.json();
    },
    onSuccess: (data) => {
      invalidate();
      setExpandedModules((prev) => new Set<number>([...Array.from(prev), data.id]));
    },
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PATCH", `/api/admin/modules/${id}`, { title });
    },
    onSuccess: invalidate,
  });

  const deleteModule = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/modules/${id}`);
    },
    onSuccess: invalidate,
  });

  const addLesson = useMutation({
    mutationFn: async ({ moduleId, position }: { moduleId: number; position: number }) => {
      const res = await apiRequest("POST", "/api/admin/lessons", {
        moduleId,
        title: "New Lesson",
        type: "TEXT",
        position,
      });
      return res.json();
    },
    onSuccess: (data) => {
      invalidate();
      onSelectLesson(data.id);
    },
  });

  const updateLesson = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PATCH", `/api/admin/lessons/${id}`, { title });
    },
    onSuccess: invalidate,
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/lessons/${id}`);
    },
    onSuccess: invalidate,
  });

  const duplicateLesson = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/lessons/${id}/duplicate`);
      return res.json();
    },
    onSuccess: (data) => {
      invalidate();
      onSelectLesson(data.id);
    },
  });

  const reorderLessons = useMutation({
    mutationFn: async ({ moduleId, orderedIds }: { moduleId: number; orderedIds: number[] }) => {
      await apiRequest("POST", `/api/admin/modules/${moduleId}/lessons/reorder`, { orderedIds });
    },
    onSuccess: invalidate,
  });

  const moveLessonToModule = useMutation({
    mutationFn: async ({ lessonId, targetModuleId, position }: { lessonId: number; targetModuleId: number; position: number }) => {
      await apiRequest("PATCH", `/api/admin/lessons/${lessonId}`, { moduleId: targetModuleId, position });
    },
    onSuccess: invalidate,
  });

  const toggleSubject = (id: number) =>
    setExpandedSubjects((prev) => {
      const next = new Set<number>(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleModule = (id: number) =>
    setExpandedModules((prev) => {
      const next = new Set<number>(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sortedSubjects = [...subjects].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Course Content
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => addSubject.mutate()}
          title="Add section"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedSubjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No sections yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs h-7"
              onClick={() => addSubject.mutate()}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Section
            </Button>
          </div>
        )}

        {sortedSubjects.map((subject) => {
          const isExpanded = expandedSubjects.has(subject.id);
          const sortedModules = [...(subject.modules || [])].sort((a, b) => a.position - b.position);

          return (
            <div key={subject.id} className="space-y-0.5">
              {/* Subject row */}
              <SubjectRow
                subject={subject}
                isExpanded={isExpanded}
                onToggle={() => toggleSubject(subject.id)}
                onRename={(title) => updateSubject.mutate({ id: subject.id, title })}
                onDelete={() => {
                  if (confirm("Delete this section and all its content?")) {
                    deleteSubject.mutate(subject.id);
                  }
                }}
                onAddModule={() =>
                  addModule.mutate({ subjectId: subject.id, position: sortedModules.length })
                }
              />

              {/* Modules */}
              {isExpanded && (
                <div className="ml-3 space-y-0.5">
                  {sortedModules.map((mod) => {
                    const isModExpanded = expandedModules.has(mod.id);
                    const sortedLessons = [...(mod.lessons || [])].sort((a, b) => a.position - b.position);

                    return (
                      <div key={mod.id} className="space-y-0.5">
                        {/* Module row */}
                        <ModuleRow
                          mod={mod}
                          isExpanded={isModExpanded}
                          onToggle={() => toggleModule(mod.id)}
                          onRename={(title) => updateModule.mutate({ id: mod.id, title })}
                          onDelete={() => {
                            if (confirm("Delete this module and all its lessons?")) {
                              deleteModule.mutate(mod.id);
                            }
                          }}
                          onAddLesson={() =>
                            addLesson.mutate({ moduleId: mod.id, position: sortedLessons.length })
                          }
                        />

                        {/* Lessons */}
                        {isModExpanded && (
                          <div
                            className="ml-3 space-y-0.5"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (!dragLessonId || dragLessonSourceModuleId === mod.id) { setDragLessonId(null); setDragLessonSourceModuleId(null); return; }
                              moveLessonToModule.mutate({ lessonId: dragLessonId, targetModuleId: mod.id, position: sortedLessons.length });
                              setDragLessonId(null);
                              setDragLessonSourceModuleId(null);
                            }}
                          >
                            {sortedLessons.map((lesson) => (
                              <LessonItem
                                key={lesson.id}
                                lesson={lesson}
                                isSelected={selectedLessonId === lesson.id}
                                onSelect={() => onSelectLesson(lesson.id)}
                                onDelete={() => {
                                  if (confirm("Delete this lesson?")) {
                                    deleteLesson.mutate(lesson.id);
                                  }
                                }}
                                onRename={(title) => updateLesson.mutate({ id: lesson.id, title })}
                                onDuplicate={() => duplicateLesson.mutate(lesson.id)}
                                blockCount={(lesson as any).blockCount}
                                draggable
                                onDragStart={(e) => {
                                  setDragLessonId(lesson.id);
                                  setDragLessonSourceModuleId(mod.id);
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(e) => { e.preventDefault(); }}
                                onDrop={() => {
                                  if (!dragLessonId) return;
                                  if (dragLessonId === lesson.id) { setDragLessonId(null); setDragLessonSourceModuleId(null); return; }

                                  if (dragLessonSourceModuleId === mod.id) {
                                    // Same module - reorder
                                    const ids = sortedLessons.map((l) => l.id);
                                    const fromIdx = ids.indexOf(dragLessonId);
                                    const toIdx = ids.indexOf(lesson.id);
                                    if (fromIdx === -1 || toIdx === -1) { setDragLessonId(null); setDragLessonSourceModuleId(null); return; }
                                    const reordered = [...ids];
                                    reordered.splice(fromIdx, 1);
                                    reordered.splice(toIdx, 0, dragLessonId);
                                    reorderLessons.mutate({ moduleId: mod.id, orderedIds: reordered });
                                  } else {
                                    // Cross-module - move lesson to this module at this position
                                    const toIdx = sortedLessons.findIndex(l => l.id === lesson.id);
                                    moveLessonToModule.mutate({ lessonId: dragLessonId, targetModuleId: mod.id, position: toIdx });
                                  }
                                  setDragLessonId(null);
                                  setDragLessonSourceModuleId(null);
                                }}
                              />
                            ))}
                            <button
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 w-full rounded-md hover:bg-muted/60 transition-colors"
                              onClick={() =>
                                addLesson.mutate({ moduleId: mod.id, position: sortedLessons.length })
                              }
                            >
                              <Plus className="h-3 w-3" />
                              Add lesson
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 w-full rounded-md hover:bg-muted/60 transition-colors"
                    onClick={() =>
                      addModule.mutate({ subjectId: subject.id, position: sortedModules.length })
                    }
                  >
                    <Plus className="h-3 w-3" />
                    Add module
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubjectRow({
  subject,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  onAddModule,
}: {
  subject: Subject;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddModule: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subject.title);

  const commit = () => {
    setEditing(false);
    if (title.trim() && title !== subject.title) onRename(title.trim());
  };

  return (
    <div className="group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors">
      <button onClick={onToggle} className="text-muted-foreground shrink-0">
        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
      {editing ? (
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setTitle(subject.title); setEditing(false); }
          }}
          className="h-5 text-xs px-1 py-0 flex-1 bg-background font-semibold"
        />
      ) : (
        <span
          className="flex-1 text-xs font-semibold truncate cursor-text"
          onDoubleClick={() => setEditing(true)}
        >
          {subject.title}
        </span>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
        <button
          className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
          onClick={onAddModule}
          title="Add module"
        >
          <Plus className="h-3 w-3" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setEditing(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ModuleRow({
  mod,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  onAddLesson,
}: {
  mod: { id: number; title: string };
  isExpanded: boolean;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddLesson: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(mod.title);

  const commit = () => {
    setEditing(false);
    if (title.trim() && title !== mod.title) onRename(title.trim());
  };

  return (
    <div className="group flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/40 transition-colors">
      <button onClick={onToggle} className="text-muted-foreground shrink-0">
        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      <Box className="h-3 w-3 text-amber-500 shrink-0" />
      {editing ? (
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setTitle(mod.title); setEditing(false); }
          }}
          className="h-5 text-xs px-1 py-0 flex-1 bg-background"
        />
      ) : (
        <span
          className="flex-1 text-xs truncate cursor-text"
          onDoubleClick={() => setEditing(true)}
        >
          {mod.title}
        </span>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
        <button
          className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
          onClick={onAddLesson}
          title="Add lesson"
        >
          <Plus className="h-3 w-3" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setEditing(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
