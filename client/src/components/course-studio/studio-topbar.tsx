import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import { SaveStatus } from "@/hooks/use-auto-save";
import { StudioTab } from "./types";
import { cn } from "@/lib/utils";

interface StudioTopbarProps {
  courseTitle: string;
  courseSlug?: string;
  selectedLessonId?: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  saveStatus: SaveStatus;
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

function AutoSaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        Saved
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-500">
        <Clock className="h-3 w-3" />
        Unsaved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" />
        Save failed
      </span>
    );
  }
  return null;
}

const TABS: { id: StudioTab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "settings", label: "Settings" },
];

export function StudioTopbar({
  courseTitle,
  courseSlug,
  selectedLessonId,
  status,
  saveStatus,
  activeTab,
  onTabChange,
  onPublish,
  isPublishing,
}: StudioTopbarProps) {
  const previewUrl = courseSlug
    ? `/learn/${courseSlug}${selectedLessonId ? `?lesson=${selectedLessonId}` : ""}`
    : null;
  return (
    <div className="h-14 bg-card border-b flex items-center px-4 gap-4 shrink-0 z-50">
      {/* Back */}
      <Link href="/admin">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      {/* Course title */}
      <span className="font-semibold text-sm truncate max-w-[200px]" title={courseTitle}>
        {courseTitle || "Untitled Course"}
      </span>

      {/* Tabs */}
      <div className="flex items-center gap-1 ml-2 border rounded-md p-0.5 bg-muted/40">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-all",
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Auto-save indicator */}
      <AutoSaveIndicator status={saveStatus} />

      {/* Status badge */}
      <Badge
        variant="outline"
        className={cn(
          "text-xs",
          status === "PUBLISHED" && "border-emerald-500 text-emerald-500",
          status === "DRAFT" && "border-amber-500 text-amber-500",
          status === "ARCHIVED" && "border-muted-foreground text-muted-foreground"
        )}
      >
        {status === "PUBLISHED" ? "Published" : status === "ARCHIVED" ? "Archived" : "Draft"}
      </Badge>

      {/* Preview */}
      {previewUrl && (
        <Link href={previewUrl}>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        </Link>
      )}

      {/* Publish / Unpublish */}
      <Button
        size="sm"
        className="h-8 text-xs"
        onClick={onPublish}
        disabled={isPublishing}
        variant={status === "PUBLISHED" ? "outline" : "default"}
      >
        {isPublishing && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        {status === "PUBLISHED" ? "Unpublish" : "Publish"}
      </Button>
    </div>
  );
}
