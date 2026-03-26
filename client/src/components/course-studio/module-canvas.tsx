import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/use-auto-save";
import { BlockBuilder } from "@/components/block-builder";
import { UploadCloud, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Module } from "./types";

interface ModuleCanvasProps {
  module: Module;
  courseId: number;
  onRefresh: () => void;
}

function SaveBadge({ status }: { status: string }) {
  if (status === "saving") return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>;
  if (status === "saved") return <span className="flex items-center gap-1 text-xs text-emerald-500"><CheckCircle2 className="h-3 w-3" /> Saved</span>;
  if (status === "unsaved") return <span className="flex items-center gap-1 text-xs text-amber-500"><Clock className="h-3 w-3" /> Unsaved changes</span>;
  return null;
}

export function ModuleCanvas({ module, courseId, onRefresh }: ModuleCanvasProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState((module as any).description || "");
  const [heroImage, setHeroImage] = useState((module as any).heroImage || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const moduleIdRef = useRef(module.id);
  useEffect(() => {
    if (moduleIdRef.current !== module.id) {
      moduleIdRef.current = module.id;
      setTitle(module.title);
      setDescription((module as any).description || "");
      setHeroImage((module as any).heroImage || "");
    }
  }, [module]);

  const saveData = { title, description, heroImage };
  const saveDataStr = JSON.stringify(saveData);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof saveData) => {
      await apiRequest("PATCH", `/api/admin/modules/${module.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
      onRefresh();
    },
  });

  const { status, markSaved } = useAutoSave(saveDataStr, async () => {
    await saveMutation.mutateAsync(JSON.parse(saveDataStr));
  }, { enabled: true });

  useEffect(() => { markSaved(); }, [module.id, markSaved]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (data.url) setHeroImage(data.url);
    } catch {}
    setUploading(false);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Module header */}
      <div className="border-b px-8 py-4 space-y-4 shrink-0 bg-card/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Module Page</span>
          </div>
          <SaveBadge status={status} />
        </div>

        {/* Hero Image */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Hero Image <span className="text-destructive">*</span></label>
          <div className="flex gap-2">
            <Input
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="Image URL or upload below"
              className="flex-1 h-8 text-xs"
            />
            <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <UploadCloud className="h-3.5 w-3.5 mr-1" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
          </div>
          {heroImage && (
            <img src={heroImage} alt="Hero preview" className="h-32 w-full object-cover rounded-lg border" />
          )}
          {!heroImage && (
            <div className="h-20 w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">No hero image set</div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Module Title <span className="text-destructive">*</span></label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Module title"
            className="text-lg font-semibold border-none bg-transparent shadow-none px-0 h-auto focus-visible:ring-0"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Description <span className="text-destructive">*</span></label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what students will learn in this module…"
            className="min-h-[80px] text-sm resize-none"
          />
        </div>
      </div>

      {/* Blocks area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Additional Content Blocks</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Optional blocks to add to this module's introduction page.</p>
        </div>
        <BlockBuilder
          lessonId={module.id}
          listUrl={`/api/modules/${module.id}/blocks`}
          createUrl={`/api/modules/${module.id}/blocks`}
          reorderUrl={`/api/modules/${module.id}/blocks/reorder`}
          blockPatchUrl={(id) => `/api/modules/blocks/${id}`}
          blockDeleteUrl={(id) => `/api/modules/blocks/${id}`}
          blockDuplicateUrl={(id) => `/api/modules/blocks/${id}/duplicate`}
        />
      </div>
    </div>
  );
}
