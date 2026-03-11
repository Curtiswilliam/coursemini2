import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Clock,
  Eye,
  Plus,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Type,
  Image,
  MousePointerClick,
  Minus,
  Space,
  Variable,
  Heading,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType = "HEADING" | "TEXT" | "IMAGE" | "BUTTON" | "DIVIDER" | "SPACER" | "VARIABLE";

interface Block {
  id: string;
  type: BlockType;
  content: Record<string, any>;
}

type SaveStatus = "idle" | "saving" | "saved" | "error" | "unsaved";

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType; defaultContent: Record<string, any> }[] = [
  { type: "HEADING", label: "Heading", icon: Heading, defaultContent: { text: "Your Heading Here", level: 1, align: "center" } },
  { type: "TEXT", label: "Text", icon: Type, defaultContent: { html: "Add your text content here." } },
  { type: "IMAGE", label: "Image", icon: Image, defaultContent: { url: "", alt: "", align: "center" } },
  { type: "BUTTON", label: "Button", icon: MousePointerClick, defaultContent: { text: "Click Here", url: "", color: "#6366f1", align: "center" } },
  { type: "DIVIDER", label: "Divider", icon: Minus, defaultContent: {} },
  { type: "SPACER", label: "Spacer", icon: Space, defaultContent: { height: 24 } },
  { type: "VARIABLE", label: "Variable", icon: Variable, defaultContent: { variable: "{{studentName}}" } },
];

const BUTTON_COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Green", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Red", value: "#ef4444" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Blue", value: "#3b82f6" },
];

const VARIABLES = [
  { key: "studentName", label: "Student's full name" },
  { key: "studentEmail", label: "Student's email" },
  { key: "courseTitle", label: "Course title" },
  { key: "courseUrl", label: "Link to course" },
  { key: "certificateUrl", label: "Certificate URL" },
  { key: "badgeName", label: "Badge name" },
  { key: "siteUrl", label: "Site URL" },
  { key: "verificationCode", label: "Verification code" },
];

const PREVIEW_VARIABLES = {
  studentName: "Jane Smith",
  studentEmail: "jane@example.com",
  courseTitle: "Introduction to Web Development",
  courseUrl: typeof window !== "undefined" ? window.location.origin + "/courses/intro-web-dev" : "/courses/intro-web-dev",
  certificateUrl: typeof window !== "undefined" ? window.location.origin + "/certificates/CERT-XXXXXXXXXX" : "/certificates/CERT-XXXXXXXXXX",
  badgeName: "Mini Pro",
  siteUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:5000",
  verificationCode: "123456",
};

// ─── API ──────────────────────────────────────────────────────────────────────

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

// ─── Block Preview ─────────────────────────────────────────────────────────────

function BlockPreview({ block }: { block: Block }) {
  const { type, content } = block;

  switch (type) {
    case "HEADING": {
      const sizes: Record<number, string> = { 1: "text-2xl", 2: "text-xl", 3: "text-lg" };
      const Tag = (`h${content.level ?? 1}`) as keyof JSX.IntrinsicElements;
      return (
        <Tag
          className={cn("font-bold text-gray-900 leading-tight", sizes[content.level ?? 1])}
          style={{ textAlign: content.align ?? "left" }}
        >
          {content.text || <span className="text-gray-400 italic">Empty heading</span>}
        </Tag>
      );
    }
    case "TEXT":
      return (
        <p className="text-base leading-relaxed text-gray-700" style={{ margin: 0 }}>
          {content.html || content.text || <span className="text-gray-400 italic">Empty text block</span>}
        </p>
      );
    case "IMAGE":
      return (
        <div style={{ textAlign: content.align ?? "center" }}>
          {content.url ? (
            <img src={content.url} alt={content.alt ?? ""} className="max-w-full h-auto rounded" />
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
              <Image className="h-6 w-6 mx-auto mb-2 opacity-40" />
              No image URL set
            </div>
          )}
        </div>
      );
    case "BUTTON":
      return (
        <div style={{ textAlign: content.align ?? "center" }}>
          <span
            className="inline-block px-6 py-3 rounded-md text-white font-semibold text-sm cursor-default"
            style={{ backgroundColor: content.color ?? "#6366f1" }}
          >
            {content.text || "Button"}
          </span>
        </div>
      );
    case "DIVIDER":
      return <hr className="border-t border-gray-200 my-0" />;
    case "SPACER":
      return <div style={{ height: `${content.height ?? 24}px` }} className="bg-gray-50 border border-dashed border-gray-200 rounded flex items-center justify-center">
        <span className="text-xs text-gray-400">{content.height ?? 24}px spacer</span>
      </div>;
    case "VARIABLE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-sm font-mono border border-indigo-200">
          {content.variable || "{{variable}}"}
        </span>
      );
    default:
      return null;
  }
}

// ─── Block Editor ─────────────────────────────────────────────────────────────

function BlockEditor({ block, onChange }: { block: Block; onChange: (content: Record<string, any>) => void }) {
  const { type, content } = block;

  const alignButtons = (align: string) => (
    <div className="flex gap-1">
      {(["left", "center", "right"] as const).map(a => {
        const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
        return (
          <button
            key={a}
            onClick={() => onChange({ ...content, align: a })}
            className={cn("p-1.5 rounded border transition-colors", align === a ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );

  switch (type) {
    case "HEADING":
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
          <div>
            <Label className="text-xs mb-1 block">Text</Label>
            <Input
              value={content.text ?? ""}
              onChange={e => onChange({ ...content, text: e.target.value })}
              placeholder="Heading text..."
            />
          </div>
          <div className="flex gap-3">
            <div>
              <Label className="text-xs mb-1 block">Level</Label>
              <div className="flex gap-1">
                {[1, 2, 3].map(l => (
                  <button
                    key={l}
                    onClick={() => onChange({ ...content, level: l })}
                    className={cn("px-2.5 py-1 rounded border text-sm font-bold transition-colors", content.level === l ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}
                  >
                    H{l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Align</Label>
              {alignButtons(content.align ?? "left")}
            </div>
          </div>
        </div>
      );

    case "TEXT":
      return (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <Label className="text-xs mb-1 block">Content</Label>
          <Textarea
            value={content.html ?? content.text ?? ""}
            onChange={e => onChange({ ...content, html: e.target.value })}
            placeholder="Enter your text..."
            rows={4}
          />
        </div>
      );

    case "IMAGE":
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
          <div>
            <Label className="text-xs mb-1 block">Image URL</Label>
            <Input
              value={content.url ?? ""}
              onChange={e => onChange({ ...content, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Alt text</Label>
            <Input
              value={content.alt ?? ""}
              onChange={e => onChange({ ...content, alt: e.target.value })}
              placeholder="Describe the image..."
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Align</Label>
            {alignButtons(content.align ?? "center")}
          </div>
        </div>
      );

    case "BUTTON":
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
          <div>
            <Label className="text-xs mb-1 block">Button text</Label>
            <Input
              value={content.text ?? ""}
              onChange={e => onChange({ ...content, text: e.target.value })}
              placeholder="Click here"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">URL</Label>
            <Input
              value={content.url ?? ""}
              onChange={e => onChange({ ...content, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Color</Label>
            <div className="flex gap-1.5">
              {BUTTON_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => onChange({ ...content, color: c.value })}
                  className={cn("h-6 w-6 rounded-full border-2 transition-all", content.color === c.value ? "border-foreground scale-110" : "border-transparent")}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Align</Label>
            {alignButtons(content.align ?? "center")}
          </div>
        </div>
      );

    case "DIVIDER":
      return (
        <div className="p-3 bg-muted/50 rounded-lg border text-xs text-muted-foreground italic">
          Horizontal divider — no configuration needed.
        </div>
      );

    case "SPACER":
      return (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <Label className="text-xs mb-1 block">Height (px)</Label>
          <Input
            type="number"
            min={4}
            max={200}
            value={content.height ?? 24}
            onChange={e => onChange({ ...content, height: parseInt(e.target.value) || 24 })}
          />
        </div>
      );

    case "VARIABLE":
      return (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <Label className="text-xs mb-1 block">Variable</Label>
          <Select value={content.variable ?? "{{studentName}}"} onValueChange={v => onChange({ ...content, variable: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VARIABLES.map(v => (
                <SelectItem key={v.key} value={`{{${v.key}}}`}>
                  <span className="font-mono text-sm">{`{{${v.key}}}`}</span>
                  <span className="text-muted-foreground ml-2 text-xs">— {v.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    default:
      return null;
  }
}

// ─── Save Indicator ───────────────────────────────────────────────────────────

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />Saving…
    </span>
  );
  if (status === "saved") return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <CheckCircle2 className="h-3 w-3 text-emerald-500" />Saved
    </span>
  );
  if (status === "error") return (
    <span className="flex items-center gap-1.5 text-xs text-destructive">
      Save failed
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs text-amber-500">
      <Clock className="h-3 w-3" />Unsaved
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmailTemplateEditor() {
  const [, params] = useRoute("/admin/email-templates/:id/edit");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const templateId = params?.id ? parseInt(params.id) : null;

  const [name, setName] = useState("Untitled Template");
  const [subject, setSubject] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef({ name: "", subject: "", blocks: "" });

  // Load template on mount
  useEffect(() => {
    if (!templateId) return;
    apiFetch(`/api/admin/email-templates/${templateId}`)
      .then(tmpl => {
        setName(tmpl.name);
        setSubject(tmpl.subject ?? "");
        setBlocks(Array.isArray(tmpl.blocks) ? tmpl.blocks : []);
        lastSavedRef.current = { name: tmpl.name, subject: tmpl.subject ?? "", blocks: JSON.stringify(tmpl.blocks ?? []) };
        setLoaded(true);
      })
      .catch(e => toast({ title: "Failed to load template", description: e.message, variant: "destructive" }));
  }, [templateId]);

  // Auto-save with 800ms debounce
  const triggerSave = useCallback(() => {
    if (!templateId || !loaded) return;
    const currentState = { name, subject, blocks: JSON.stringify(blocks) };
    if (JSON.stringify(currentState) === JSON.stringify(lastSavedRef.current)) return;

    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await apiFetch(`/api/admin/email-templates/${templateId}`, {
          method: "PATCH",
          body: JSON.stringify({ name, subject, blocks }),
        });
        lastSavedRef.current = currentState;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 800);
  }, [templateId, loaded, name, subject, blocks]);

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("unsaved");
    triggerSave();
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [name, subject, blocks]);

  function addBlock(type: BlockType, insertAfterIndex?: number) {
    const def = BLOCK_TYPES.find(b => b.type === type)!;
    const newBlock: Block = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      content: { ...def.defaultContent },
    };
    setBlocks(prev => {
      if (insertAfterIndex !== undefined) {
        const next = [...prev];
        next.splice(insertAfterIndex + 1, 0, newBlock);
        return next;
      }
      return [...prev, newBlock];
    });
    setSelectedBlockId(newBlock.id);
  }

  function updateBlock(id: string, content: Record<string, any>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  }

  function moveBlock(id: string, direction: "up" | "down") {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  function duplicateBlock(id: string) {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const clone: Block = {
        ...prev[idx],
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        content: { ...prev[idx].content },
      };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }

  function deleteBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  }

  async function openPreview() {
    if (!templateId) return;
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const result = await apiFetch(`/api/admin/email-templates/${templateId}/preview`, {
        method: "POST",
        body: JSON.stringify({ variables: PREVIEW_VARIABLES }),
      });
      setPreviewHtml(result.html);
      setPreviewSubject(result.subject);
    } catch (e: any) {
      toast({ title: "Preview failed", description: e.message, variant: "destructive" });
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }

  function copyVariable(v: string) {
    navigator.clipboard.writeText(`{{${v}}}`).then(() => {
      toast({ title: "Copied!", description: `{{${v}}} copied to clipboard` });
    });
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header bar */}
      <header className="h-14 border-b bg-card flex items-center gap-3 px-4 shrink-0 z-10">
        <button
          onClick={() => navigate("/admin/email-templates")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm mr-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Input
            className="h-8 text-sm font-medium max-w-64"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Template name..."
          />
          <Input
            className="h-8 text-xs text-muted-foreground max-w-80"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject line..."
          />
        </div>

        <SaveIndicator status={saveStatus} />

        <Button variant="outline" size="sm" onClick={openPreview} disabled={previewLoading}>
          <Eye className="h-4 w-4 mr-1.5" />
          Preview
        </Button>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[280px] shrink-0 border-r bg-card overflow-y-auto flex flex-col">
          <Accordion type="multiple" defaultValue={["blocks", "variables"]} className="flex-1">
            {/* Add Blocks */}
            <AccordionItem value="blocks" className="border-b">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                Add Blocks
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {BLOCK_TYPES.map(bt => {
                    const Icon = bt.icon;
                    return (
                      <button
                        key={bt.type}
                        onClick={() => addBlock(bt.type)}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border hover:bg-muted hover:border-primary/40 transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        <Icon className="h-4 w-4" />
                        {bt.label}
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Template Variables */}
            <AccordionItem value="variables" className="border-b-0">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                Variables
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <p className="text-xs text-muted-foreground mb-2">Click to copy to clipboard</p>
                <div className="space-y-1.5">
                  {VARIABLES.map(v => (
                    <button
                      key={v.key}
                      onClick={() => copyVariable(v.key)}
                      className="w-full flex items-start gap-2 p-1.5 rounded-md hover:bg-muted transition-colors text-left group"
                    >
                      <code className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0 group-hover:bg-indigo-100 transition-colors">
                        {`{{${v.key}}}`}
                      </code>
                      <span className="text-xs text-muted-foreground leading-tight pt-0.5">{v.label}</span>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Block editor (when selected) */}
          {selectedBlock && (
            <div className="border-t p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Edit {selectedBlock.type.charAt(0) + selectedBlock.type.slice(1).toLowerCase()}
                </span>
                <button onClick={() => setSelectedBlockId(null)} className="text-xs text-muted-foreground hover:text-foreground">
                  Done
                </button>
              </div>
              <BlockEditor
                block={selectedBlock}
                onChange={content => updateBlock(selectedBlock.id, content)}
              />
            </div>
          )}
        </aside>

        {/* Canvas */}
        <main
          className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-8"
          onClick={() => setSelectedBlockId(null)}
        >
          <div
            className="mx-auto bg-white rounded-xl shadow-sm overflow-hidden"
            style={{ maxWidth: "600px", minHeight: "400px" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "40px" }}>
              {blocks.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                  <div className="text-3xl mb-3">✉️</div>
                  <p className="font-medium text-sm">Your email is empty</p>
                  <p className="text-xs mt-1">Click a block type in the sidebar to start building</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Add block at top */}
                  <AddBlockButton onAdd={type => addBlock(type, -1)} />

                  {blocks.map((block, idx) => {
                    const isSelected = block.id === selectedBlockId;
                    return (
                      <div key={block.id}>
                        <div
                          className={cn(
                            "relative group transition-all rounded",
                            isSelected ? "ring-2 ring-primary ring-offset-1" : "hover:ring-1 hover:ring-primary/30 hover:ring-offset-1"
                          )}
                          onClick={e => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                        >
                          {/* Block toolbar (visible on hover/select) */}
                          {(isSelected) && (
                            <div
                              className="absolute -top-8 left-0 right-0 flex items-center justify-between z-10"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1 bg-card border rounded-md shadow-sm px-1 py-0.5">
                                <button
                                  onClick={() => moveBlock(block.id, "up")}
                                  disabled={idx === 0}
                                  className="p-1 rounded hover:bg-muted disabled:opacity-30"
                                  title="Move up"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => moveBlock(block.id, "down")}
                                  disabled={idx === blocks.length - 1}
                                  className="p-1 rounded hover:bg-muted disabled:opacity-30"
                                  title="Move down"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <div className="w-px h-4 bg-border mx-0.5" />
                                <button
                                  onClick={() => duplicateBlock(block.id)}
                                  className="p-1 rounded hover:bg-muted"
                                  title="Duplicate"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteBlock(block.id)}
                                  className="p-1 rounded hover:bg-destructive/10 text-destructive"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="text-[10px] text-muted-foreground bg-card border rounded px-1.5 py-0.5 font-mono">
                                {block.type}
                              </span>
                            </div>
                          )}

                          {/* Block content */}
                          <div className="py-2">
                            <BlockPreview block={block} />
                          </div>
                        </div>

                        {/* Add block after */}
                        <AddBlockButton onAdd={type => addBlock(type, idx)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-10 py-5 bg-gray-50 border-t text-center text-xs text-gray-400">
              Sent by CourseMini •{" "}
              <a href="#" className="text-gray-400 hover:underline">
                {typeof window !== "undefined" ? window.location.origin : ""}
              </a>
            </div>
          </div>
        </main>
      </div>

      {/* Preview modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Email Preview</DialogTitle>
            {previewSubject && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Subject:</span> {previewSubject}
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
            {previewLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                title="Email preview"
                sandbox="allow-same-origin"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Add Block Button ─────────────────────────────────────────────────────────

function AddBlockButton({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center justify-center my-1 group/add">
      <div className="w-full h-px bg-gray-100 group-hover/add:bg-primary/20 transition-colors" />
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="absolute z-10 h-5 w-5 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-primary hover:border-primary hover:text-white transition-all opacity-0 group-hover/add:opacity-100"
      >
        <Plus className="h-3 w-3" />
      </button>
      {open && (
        <div
          className="absolute top-6 z-20 bg-card border rounded-lg shadow-lg p-2 flex gap-1.5 flex-wrap w-56"
          onClick={e => e.stopPropagation()}
        >
          {BLOCK_TYPES.map(bt => {
            const Icon = bt.icon;
            return (
              <button
                key={bt.type}
                onClick={() => { onAdd(bt.type); setOpen(false); }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {bt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
