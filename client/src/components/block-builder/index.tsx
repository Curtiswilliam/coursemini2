import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  Plus, Trash2, GripVertical, Copy, Settings,
  Type, Heading, Image, Video, Quote, Info, Code,
  List, ListOrdered, Minus, MousePointer,
  ChevronDown, ChevronUp, ChevronRight, LayoutDashboard, RefreshCw, ListChecks, Clock,
  Grid, Download, Table, CheckCircle2, X, Pencil, UploadCloud, Loader2, Sparkles,
} from "lucide-react";

export type BlockType =
  | "TEXT" | "HEADING" | "IMAGE" | "VIDEO" | "BUTTON" | "DIVIDER"
  | "QUOTE" | "BULLETED_LIST" | "NUMBERED_LIST" | "ACCORDION" | "TABS"
  | "PROCESS" | "FLASHCARDS" | "KNOWLEDGE_CHECK" | "TABLE" | "GALLERY"
  | "CALLOUT" | "TIMELINE" | "CODE" | "FILE" | "NEXT_BUTTON" | "NOTES" | "VIDEO_DESCRIPTION";

interface Block {
  id: number;
  lessonId: number;
  type: BlockType;
  content: string;
  position: number;
  settings: string;
  createdAt: string;
}

interface BlockPickerProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const BLOCK_CATEGORIES = [
  {
    label: "Content",
    blocks: [
      { type: "TEXT" as BlockType, label: "Text", icon: Type, desc: "Rich text paragraph" },
      { type: "HEADING" as BlockType, label: "Heading", icon: Heading, desc: "H1, H2, or H3 heading" },
      { type: "IMAGE" as BlockType, label: "Image", icon: Image, desc: "Image with caption" },
      { type: "VIDEO" as BlockType, label: "Video", icon: Video, desc: "YouTube or Vimeo embed" },
      { type: "VIDEO_DESCRIPTION" as BlockType, label: "Video Description", icon: Sparkles, desc: "AI-generated video summary" },
      { type: "QUOTE" as BlockType, label: "Quote", icon: Quote, desc: "Blockquote with author" },
      { type: "CALLOUT" as BlockType, label: "Callout", icon: Info, desc: "Info, warning, or tip box" },
      { type: "CODE" as BlockType, label: "Code", icon: Code, desc: "Code block with syntax" },
    ],
  },
  {
    label: "Lists & Structure",
    blocks: [
      { type: "BULLETED_LIST" as BlockType, label: "Bulleted List", icon: List, desc: "Unordered list" },
      { type: "NUMBERED_LIST" as BlockType, label: "Numbered List", icon: ListOrdered, desc: "Ordered list" },
      { type: "DIVIDER" as BlockType, label: "Divider", icon: Minus, desc: "Visual separator" },
      { type: "BUTTON" as BlockType, label: "Button", icon: MousePointer, desc: "Call-to-action button" },
    ],
  },
  {
    label: "Interactive",
    blocks: [
      { type: "ACCORDION" as BlockType, label: "Accordion", icon: ChevronDown, desc: "Expandable sections" },
      { type: "TABS" as BlockType, label: "Tabs", icon: LayoutDashboard, desc: "Tabbed content" },
      { type: "FLASHCARDS" as BlockType, label: "Flashcards", icon: RefreshCw, desc: "Flip cards" },
      { type: "PROCESS" as BlockType, label: "Process", icon: ListChecks, desc: "Step-by-step process" },
      { type: "TIMELINE" as BlockType, label: "Timeline", icon: Clock, desc: "Chronological events" },
    ],
  },
  {
    label: "Media",
    blocks: [
      { type: "GALLERY" as BlockType, label: "Gallery", icon: Grid, desc: "Image grid" },
      { type: "FILE" as BlockType, label: "File Download", icon: Download, desc: "Downloadable file" },
      { type: "TABLE" as BlockType, label: "Table", icon: Table, desc: "Data table" },
    ],
  },
  {
    label: "Assessment",
    blocks: [
      { type: "KNOWLEDGE_CHECK" as BlockType, label: "Knowledge Check", icon: CheckCircle2, desc: "Inline quiz question" },
    ],
  },
  {
    label: "Lesson Controls",
    blocks: [
      { type: "NEXT_BUTTON" as BlockType, label: "Next Button", icon: ChevronRight, desc: "Navigation button for students" },
      { type: "NOTES" as BlockType, label: "My Notes", icon: Pencil, desc: "Student notes section" },
    ],
  },
];

function BlockPicker({ onSelect, onClose }: BlockPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-card border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Add a Block</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-5">
          {BLOCK_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{cat.label}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cat.blocks.map((b) => {
                  const Icon = b.icon;
                  return (
                    <button
                      key={b.type}
                      onClick={() => { onSelect(b.type); onClose(); }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{b.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{b.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =================== BLOCK EDITORS ===================

function TextEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <RichTextEditor
      content={content.html || ""}
      onChange={(html) => onChange({ ...content, html })}
      placeholder="Write something..."
    />
  );
}

function HeadingEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Input
        value={content.text || ""}
        onChange={(e) => onChange({ ...content, text: e.target.value })}
        placeholder="Heading text"
        className="text-lg font-bold"
      />
      <div className="flex gap-2">
        <Select value={content.level || "H2"} onValueChange={(v) => onChange({ ...content, level: v })}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="H1">H1</SelectItem>
            <SelectItem value="H2">H2</SelectItem>
            <SelectItem value="H3">H3</SelectItem>
          </SelectContent>
        </Select>
        <Select value={content.align || "left"} onValueChange={(v) => onChange({ ...content, align: v })}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ImageEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (data.url) onChange({ ...content, url: data.url });
    } catch {}
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={content.url || ""} onChange={(e) => onChange({ ...content, url: e.target.value })} placeholder="Image URL" className="flex-1" />
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <UploadCloud className="h-3.5 w-3.5 mr-1" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
      </div>
      <Input value={content.alt || ""} onChange={(e) => onChange({ ...content, alt: e.target.value })} placeholder="Alt text" />
      <Input value={content.caption || ""} onChange={(e) => onChange({ ...content, caption: e.target.value })} placeholder="Caption (optional)" />
      <Select value={content.align || "center"} onValueChange={(v) => onChange({ ...content, align: v })}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="left">Left</SelectItem>
          <SelectItem value="center">Center</SelectItem>
          <SelectItem value="right">Right</SelectItem>
          <SelectItem value="full">Full Width</SelectItem>
          <SelectItem value="bestfit">Best Fit</SelectItem>
        </SelectContent>
      </Select>
      {content.url && (
        <img src={content.url} alt={content.alt || ""} className="max-h-48 rounded-md object-cover" />
      )}
    </div>
  );
}

function getYouTubeThumbnail(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  return null;
}

function getYouTubeTitle(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `YouTube video (${ytMatch[1]})`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `Loom video (${loomMatch[1]})`;
  return null;
}

function VideoEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const [mode, setMode] = useState<"url" | "embed">(content.embedCode ? "embed" : "url");
  const thumbnail = mode === "url" && content.url ? getYouTubeThumbnail(content.url) : null;
  const videoLabel = mode === "url" && content.url ? getYouTubeTitle(content.url) : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button type="button" size="sm" variant={mode === "url" ? "default" : "outline"} className="h-7 text-xs" onClick={() => { setMode("url"); onChange({ ...content, embedCode: undefined }); }}>URL</Button>
        <Button type="button" size="sm" variant={mode === "embed" ? "default" : "outline"} className="h-7 text-xs" onClick={() => { setMode("embed"); onChange({ ...content, url: undefined }); }}>Embed Code</Button>
      </div>
      {mode === "url" ? (
        <>
          <Input value={content.url || ""} onChange={(e) => onChange({ ...content, url: e.target.value })} placeholder="YouTube, Vimeo, Loom, or direct video URL" />
          <p className="text-xs text-muted-foreground">Supports YouTube, Vimeo, Loom (loom.com/share/...) and direct MP4 links</p>
          {thumbnail && (
            <div className="flex items-center gap-3 p-2 bg-muted/40 rounded-lg border border-border">
              <img src={thumbnail} alt="Video thumbnail" className="h-14 w-24 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{videoLabel || "Video"}</p>
                <p className="text-xs text-muted-foreground">{content.url}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <Textarea value={content.embedCode || ""} onChange={(e) => onChange({ ...content, embedCode: e.target.value })} placeholder="Paste embed code (e.g. <iframe ...>)" className="min-h-[80px] font-mono text-xs" />
      )}
      <Input value={content.caption || ""} onChange={(e) => onChange({ ...content, caption: e.target.value })} placeholder="Caption (optional)" />
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground shrink-0">Video duration (min):</label>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={content.duration || ""}
          onChange={(e) => onChange({ ...content, duration: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="e.g. 5"
          className="h-7 text-xs w-20"
        />
        <span className="text-xs text-muted-foreground">Used to auto-calculate lesson duration</span>
      </div>
    </div>
  );
}

function QuoteEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Textarea value={content.text || ""} onChange={(e) => onChange({ ...content, text: e.target.value })} placeholder="Quote text" className="min-h-[80px]" />
      <Input value={content.author || ""} onChange={(e) => onChange({ ...content, author: e.target.value })} placeholder="Author name" />
      <Input value={content.role || ""} onChange={(e) => onChange({ ...content, role: e.target.value })} placeholder="Author role / title (optional)" />
    </div>
  );
}

function CalloutEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Select value={content.calloutType || "info"} onValueChange={(v) => onChange({ ...content, calloutType: v })}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="info">Info</SelectItem>
          <SelectItem value="warning">Warning</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="error">Error</SelectItem>
        </SelectContent>
      </Select>
      <Input value={content.title || ""} onChange={(e) => onChange({ ...content, title: e.target.value })} placeholder="Title (optional)" />
      <Textarea value={content.body || ""} onChange={(e) => onChange({ ...content, body: e.target.value })} placeholder="Callout content" className="min-h-[80px]" />
    </div>
  );
}

function CodeEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Select value={content.language || "javascript"} onValueChange={(v) => onChange({ ...content, language: v })}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          {["javascript","typescript","python","html","css","sql","bash","json","rust","go","java","php","ruby","swift","kotlin","cpp","csharp"].map((l) => (
            <SelectItem key={l} value={l}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        value={content.code || ""}
        onChange={(e) => onChange({ ...content, code: e.target.value })}
        placeholder="// Your code here"
        className="min-h-[140px] font-mono text-sm"
      />
    </div>
  );
}

function ListEditor({ content, onChange, numbered }: { content: any; onChange: (c: any) => void; numbered: boolean }) {
  const items: string[] = content.items || [""];
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm w-5 shrink-0">{numbered ? `${i + 1}.` : "•"}</span>
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items]; next[i] = e.target.value; onChange({ ...content, items: next });
            }}
            placeholder={`Item ${i + 1}`}
          />
          {items.length > 1 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
              const next = items.filter((_, j) => j !== i); onChange({ ...content, items: next });
            }}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange({ ...content, items: [...items, ""] })}>
        <Plus className="h-3 w-3 mr-1" /> Add Item
      </Button>
    </div>
  );
}

function AccordionEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const items: Array<{ title: string; body: string }> = content.items || [{ title: "", body: "" }];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input value={item.title} onChange={(e) => {
              const next = [...items]; next[i] = { ...item, title: e.target.value }; onChange({ ...content, items: next });
            }} placeholder="Section title" className="font-medium" />
            {items.length > 1 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange({ ...content, items: items.filter((_, j) => j !== i) })}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Textarea value={item.body} onChange={(e) => {
            const next = [...items]; next[i] = { ...item, body: e.target.value }; onChange({ ...content, items: next });
          }} placeholder="Section content" className="min-h-[60px]" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange({ ...content, items: [...items, { title: "", body: "" }] })}>
        <Plus className="h-3 w-3 mr-1" /> Add Section
      </Button>
    </div>
  );
}

function TabsEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const items: Array<{ label: string; body: string }> = content.items || [{ label: "", body: "" }];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input value={item.label} onChange={(e) => {
              const next = [...items]; next[i] = { ...item, label: e.target.value }; onChange({ ...content, items: next });
            }} placeholder="Tab label" />
            {items.length > 1 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange({ ...content, items: items.filter((_, j) => j !== i) })}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Textarea value={item.body} onChange={(e) => {
            const next = [...items]; next[i] = { ...item, body: e.target.value }; onChange({ ...content, items: next });
          }} placeholder="Tab content" className="min-h-[60px]" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange({ ...content, items: [...items, { label: "", body: "" }] })}>
        <Plus className="h-3 w-3 mr-1" /> Add Tab
      </Button>
    </div>
  );
}

function ProcessEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const steps: Array<{ title: string; description: string }> = content.steps || [{ title: "", description: "" }];
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
            {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
          </div>
          <div className="flex-1 pb-3 space-y-2">
            <div className="flex gap-2">
              <Input value={step.title} onChange={(e) => {
                const next = [...steps]; next[i] = { ...step, title: e.target.value }; onChange({ ...content, steps: next });
              }} placeholder={`Step ${i + 1} title`} />
              {steps.length > 1 && (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onChange({ ...content, steps: steps.filter((_, j) => j !== i) })}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Textarea value={step.description} onChange={(e) => {
              const next = [...steps]; next[i] = { ...step, description: e.target.value }; onChange({ ...content, steps: next });
            }} placeholder="Step description" className="min-h-[60px]" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange({ ...content, steps: [...steps, { title: "", description: "" }] })}>
        <Plus className="h-3 w-3 mr-1" /> Add Step
      </Button>
    </div>
  );
}

function FlashcardsEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const cards: Array<{ front: string; back: string }> = content.cards || [{ front: "", back: "" }];
  const heading = content.heading !== undefined ? content.heading : "Test your knowledge";
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Section heading</label>
        <Input value={heading} onChange={(e) => onChange({ ...content, heading: e.target.value })} placeholder="Test your knowledge" />
      </div>
      {cards.map((card, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Card {i + 1}</span>
            {cards.length > 1 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange({ ...content, cards: cards.filter((_, j) => j !== i) })}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Textarea value={card.front} onChange={(e) => {
            const next = [...cards]; next[i] = { ...card, front: e.target.value }; onChange({ ...content, cards: next });
          }} placeholder="Front (question/term)" className="min-h-[60px]" />
          <Textarea value={card.back} onChange={(e) => {
            const next = [...cards]; next[i] = { ...card, back: e.target.value }; onChange({ ...content, cards: next });
          }} placeholder="Back (answer/definition)" className="min-h-[60px]" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange({ ...content, cards: [...cards, { front: "", back: "" }] })}>
        <Plus className="h-3 w-3 mr-1" /> Add Card
      </Button>
    </div>
  );
}

function KnowledgeCheckEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const options: Array<{ text: string; isCorrect: boolean }> = content.options || [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ];
  return (
    <div className="space-y-3">
      <Textarea value={content.question || ""} onChange={(e) => onChange({ ...content, question: e.target.value })} placeholder="Question" className="min-h-[60px]" />
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Options (select correct answer)</p>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="kc-correct" checked={opt.isCorrect} onChange={() => {
              const next = options.map((o, j) => ({ ...o, isCorrect: j === i })); onChange({ ...content, options: next });
            }} />
            <Input value={opt.text} onChange={(e) => {
              const next = [...options]; next[i] = { ...opt, text: e.target.value }; onChange({ ...content, options: next });
            }} placeholder={`Option ${i + 1}`} />
            {options.length > 2 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange({ ...content, options: options.filter((_, j) => j !== i) })}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <Button variant="outline" size="sm" onClick={() => onChange({ ...content, options: [...options, { text: "", isCorrect: false }] })}>
            <Plus className="h-3 w-3 mr-1" /> Add Option
          </Button>
        )}
      </div>
      <Textarea value={content.explanation || ""} onChange={(e) => onChange({ ...content, explanation: e.target.value })} placeholder="Explanation (shown after answering)" className="min-h-[60px]" />
    </div>
  );
}

function TableEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const rows: string[][] = content.rows || [["Header 1", "Header 2"], ["Cell", "Cell"]];

  const updateCell = (ri: number, ci: number, val: string) => {
    const next = rows.map((r, ri2) => ri2 === ri ? r.map((c, ci2) => ci2 === ci ? val : c) : r);
    onChange({ ...content, rows: next });
  };
  const addRow = () => onChange({ ...content, rows: [...rows, Array(rows[0]?.length || 2).fill("")] });
  const addCol = () => onChange({ ...content, rows: rows.map((r) => [...r, ""]) });
  const removeRow = (ri: number) => rows.length > 1 && onChange({ ...content, rows: rows.filter((_, i) => i !== ri) });
  const removeCol = (ci: number) => (rows[0]?.length || 0) > 1 && onChange({ ...content, rows: rows.map((r) => r.filter((_, i) => i !== ci)) });

  return (
    <div className="space-y-3 overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className={`border border-border p-1 ${ri === 0 ? "bg-muted" : ""}`}>
                  <Input value={cell} onChange={(e) => updateCell(ri, ci, e.target.value)} className="h-7 text-xs border-none" placeholder={ri === 0 ? "Header" : "Cell"} />
                </td>
              ))}
              <td className="p-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(ri)}><X className="h-3 w-3" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-3 w-3 mr-1" />Row</Button>
        <Button variant="outline" size="sm" onClick={addCol}><Plus className="h-3 w-3 mr-1" />Column</Button>
        {(rows[0]?.length || 0) > 1 && (
          <Button variant="outline" size="sm" onClick={() => removeCol((rows[0]?.length || 1) - 1)}>Remove Last Col</Button>
        )}
      </div>
    </div>
  );
}

function GalleryEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const images: Array<{ url: string; caption: string }> = content.images || [{ url: "", caption: "" }];
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleUpload = async (file: File, i: number) => {
    setUploadingIdx(i);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (data.url) {
        const next = [...images]; next[i] = { ...next[i], url: data.url }; onChange({ ...content, images: next });
      }
    } catch {}
    setUploadingIdx(null);
  };

  return (
    <div className="space-y-3">
      {images.map((img, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <div className="flex gap-1">
              <Input value={img.url} onChange={(e) => {
                const next = [...images]; next[i] = { ...img, url: e.target.value }; onChange({ ...content, images: next });
              }} placeholder="Image URL" className="flex-1" />
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 text-xs px-2" onClick={() => fileInputRefs.current[i]?.click()} disabled={uploadingIdx === i}>
                <UploadCloud className="h-3.5 w-3.5" />
              </Button>
              <input ref={el => { fileInputRefs.current[i] = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, i); e.target.value = ""; }} />
            </div>
            <Input value={img.caption} onChange={(e) => {
              const next = [...images]; next[i] = { ...img, caption: e.target.value }; onChange({ ...content, images: next });
            }} placeholder="Caption (optional)" />
          </div>
          {images.length > 1 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5" onClick={() => onChange({ ...content, images: images.filter((_, j) => j !== i) })}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange({ ...content, images: [...images, { url: "", caption: "" }] })}>
        <Plus className="h-3 w-3 mr-1" /> Add Image
      </Button>
    </div>
  );
}

function TimelineEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const events: Array<{ date: string; title: string; description: string }> = content.events || [{ date: "", title: "", description: "" }];
  return (
    <div className="space-y-3">
      {events.map((ev, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2">
          <div className="flex gap-2">
            <Input value={ev.date} onChange={(e) => {
              const next = [...events]; next[i] = { ...ev, date: e.target.value }; onChange({ ...content, events: next });
            }} placeholder="Date or period" className="w-40" />
            <Input value={ev.title} onChange={(e) => {
              const next = [...events]; next[i] = { ...ev, title: e.target.value }; onChange({ ...content, events: next });
            }} placeholder="Event title" className="flex-1" />
            {events.length > 1 && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onChange({ ...content, events: events.filter((_, j) => j !== i) })}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Textarea value={ev.description} onChange={(e) => {
            const next = [...events]; next[i] = { ...ev, description: e.target.value }; onChange({ ...content, events: next });
          }} placeholder="Event description" className="min-h-[60px]" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange({ ...content, events: [...events, { date: "", title: "", description: "" }] })}>
        <Plus className="h-3 w-3 mr-1" /> Add Event
      </Button>
    </div>
  );
}

function FileEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload/file", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (data.url) onChange({ ...content, url: data.url, name: content.name || data.name || file.name });
    } catch {}
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={content.url || ""} onChange={(e) => onChange({ ...content, url: e.target.value })} placeholder="File URL" className="flex-1" />
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <UploadCloud className="h-3.5 w-3.5 mr-1" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
      </div>
      <Input value={content.name || ""} onChange={(e) => onChange({ ...content, name: e.target.value })} placeholder="Display name" />
      <Textarea value={content.description || ""} onChange={(e) => onChange({ ...content, description: e.target.value })} placeholder="File description (optional)" className="min-h-[60px]" />
    </div>
  );
}

function ButtonEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Input value={content.text || ""} onChange={(e) => onChange({ ...content, text: e.target.value })} placeholder="Button label" />
      <Input value={content.url || ""} onChange={(e) => onChange({ ...content, url: e.target.value })} placeholder="URL (https://...)" />
      <div className="flex gap-2">
        <Select value={content.style || "primary"} onValueChange={(v) => onChange({ ...content, style: v })}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
          </SelectContent>
        </Select>
        <Select value={content.align || "left"} onValueChange={(v) => onChange({ ...content, align: v })}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Button size: {content.size || 3}</label>
        <input
          type="range"
          min={1}
          max={6}
          value={content.size || 3}
          onChange={(e) => onChange({ ...content, size: parseInt(e.target.value) })}
          className="w-full h-2 accent-primary"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground shrink-0">Custom colour:</label>
        <input
          type="color"
          value={content.color || "#6366f1"}
          onChange={(e) => onChange({ ...content, color: e.target.value })}
          className="h-8 w-10 rounded cursor-pointer border border-border"
        />
        <Input
          value={content.color || ""}
          onChange={(e) => onChange({ ...content, color: e.target.value || undefined })}
          placeholder="#hex or empty for default"
          className="flex-1 text-xs h-8"
        />
        {content.color && (
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onChange({ ...content, color: undefined })}>Reset</Button>
        )}
      </div>
    </div>
  );
}

function DividerEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div>
      <Select value={content.style || "line"} onValueChange={(v) => onChange({ ...content, style: v })}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="line">Line</SelectItem>
          <SelectItem value="dots">Dots</SelectItem>
          <SelectItem value="space">Space</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function NextButtonEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Next button label</label>
        <Input value={content.nextLabel || ""} onChange={(e) => onChange({ ...content, nextLabel: e.target.value })} placeholder="Next" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Previous button label</label>
        <Input value={content.prevLabel || ""} onChange={(e) => onChange({ ...content, prevLabel: e.target.value })} placeholder="Previous" />
      </div>
      <p className="text-xs text-muted-foreground">These labels appear on the navigation buttons in the student view. Leave empty to use defaults.</p>
    </div>
  );
}

function NotesEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Section label</label>
        <Input value={content.label || ""} onChange={(e) => onChange({ ...content, label: e.target.value })} placeholder="My Notes" />
      </div>
      <p className="text-xs text-muted-foreground">This adds a student notes section inline in the lesson. Students can write and save notes here.</p>
    </div>
  );
}

function VideoDescriptionEditor({ content, onChange, blockId }: { content: any; onChange: (c: any) => void; blockId?: number }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const url = content.videoUrl || "";
    if (!url.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-video-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoUrl: url, previousText: content.text || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onChange({ ...content, text: data.description });
    } catch (e: any) {
      alert("AI error: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Video URL (YouTube or Loom)</label>
        <div className="flex gap-2">
          <Input
            value={content.videoUrl || ""}
            onChange={(e) => onChange({ ...content, videoUrl: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={generating || !content.videoUrl?.trim()}
            className="shrink-0"
          >
            {generating ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating…</> : <><Sparkles className="h-3 w-3 mr-1" />Generate</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">AI will generate an exciting description of what students will learn.</p>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Description text</label>
        <Textarea
          value={content.text || ""}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          placeholder="AI-generated description will appear here. You can also write your own."
          className="min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-1">Edit the generated text to match your style. Your edits help the AI learn how you communicate.</p>
      </div>
    </div>
  );
}

// =================== BLOCK PREVIEW ===================

function BlockPreview({ block }: { block: Block }) {
  let content: any = {};
  try { content = JSON.parse(block.content); } catch {}

  switch (block.type) {
    case "TEXT":
      return content.html
        ? <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3 text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.html) }} />
        : <p className="text-sm text-muted-foreground italic">No content yet</p>;
    case "HEADING":
      return <p className="font-bold text-base truncate">{content.text || <span className="text-muted-foreground italic">No heading text</span>}</p>;
    case "IMAGE":
      return content.url
        ? <div className="flex items-center gap-3"><img src={content.url} alt={content.alt} className="h-16 w-24 object-cover rounded" /><span className="text-xs text-muted-foreground">{content.caption || content.alt || "Image"}</span></div>
        : <p className="text-sm text-muted-foreground italic">No image URL set</p>;
    case "VIDEO": {
      const ytThumb = content.url ? getYouTubeThumbnail(content.url) : null;
      return content.url
        ? <div className="flex items-center gap-3">
            {ytThumb && <img src={ytThumb} alt="thumbnail" className="h-12 w-20 object-cover rounded" />}
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{getYouTubeTitle(content.url) || "Video"}</p>
              <p className="text-xs text-muted-foreground truncate">{content.url}</p>
              {content.duration && <p className="text-xs text-muted-foreground">{content.duration} min</p>}
            </div>
          </div>
        : <p className="text-sm text-muted-foreground italic">No video URL set</p>;
    }
    case "QUOTE":
      return content.text
        ? <blockquote className="border-l-4 border-primary pl-3 text-sm italic line-clamp-2">"{content.text}" {content.author ? `— ${content.author}` : ""}</blockquote>
        : <p className="text-sm text-muted-foreground italic">No quote text</p>;
    case "CALLOUT":
      return <div className="text-sm p-2 rounded bg-muted line-clamp-2">{content.title ? <strong>{content.title}: </strong> : null}{content.body || <span className="italic text-muted-foreground">No content</span>}</div>;
    case "CODE":
      return <code className="text-xs bg-muted px-2 py-1 rounded block truncate">{content.code || "// No code yet"}</code>;
    case "BULLETED_LIST":
      return <ul className="text-sm space-y-0.5 list-disc list-inside">{(content.items || ["Item"]).slice(0, 3).map((item: string, i: number) => <li key={i} className="truncate">{item || "..."}</li>)}</ul>;
    case "NUMBERED_LIST":
      return <ol className="text-sm space-y-0.5 list-decimal list-inside">{(content.items || ["Item"]).slice(0, 3).map((item: string, i: number) => <li key={i} className="truncate">{item || "..."}</li>)}</ol>;
    case "ACCORDION":
      return <p className="text-sm text-muted-foreground">{(content.items || []).length} accordion section{(content.items || []).length !== 1 ? "s" : ""}</p>;
    case "TABS":
      return <div className="flex gap-1">{(content.items || [{ label: "Tab" }]).slice(0, 4).map((t: any, i: number) => <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded">{t.label || `Tab ${i + 1}`}</span>)}</div>;
    case "PROCESS":
      return <p className="text-sm text-muted-foreground">{(content.steps || []).length} step{(content.steps || []).length !== 1 ? "s" : ""}</p>;
    case "FLASHCARDS":
      return <p className="text-sm text-muted-foreground">{(content.cards || []).length} flashcard{(content.cards || []).length !== 1 ? "s" : ""}</p>;
    case "KNOWLEDGE_CHECK":
      return <p className="text-sm line-clamp-2">{content.question || <span className="text-muted-foreground italic">No question set</span>}</p>;
    case "TABLE":
      return <p className="text-sm text-muted-foreground">{(content.rows || []).length} rows × {(content.rows?.[0] || []).length} columns</p>;
    case "GALLERY":
      return <p className="text-sm text-muted-foreground">{(content.images || []).length} image{(content.images || []).length !== 1 ? "s" : ""}</p>;
    case "TIMELINE":
      return <p className="text-sm text-muted-foreground">{(content.events || []).length} event{(content.events || []).length !== 1 ? "s" : ""}</p>;
    case "FILE":
      return <p className="text-sm truncate">{content.name || content.url || <span className="text-muted-foreground italic">No file set</span>}</p>;
    case "BUTTON":
      return <div className="inline-flex"><span className="text-sm px-3 py-1 rounded bg-primary text-primary-foreground">{content.text || "Button"}</span></div>;
    case "DIVIDER":
      return <div className="border-t border-border w-full my-1" />;
    case "NEXT_BUTTON":
      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground">{content.prevLabel || "← Previous"}</span>
          <span className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground">{content.nextLabel || "Next →"}</span>
        </div>
      );
    case "NOTES":
      return (
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground">{content.label || "My Notes"} — student notes section</span>
        </div>
      );
    case "VIDEO_DESCRIPTION":
      return content.text
        ? <div className="space-y-1">
            {content.videoUrl && <p className="text-xs text-muted-foreground truncate">📹 {content.videoUrl}</p>}
            <p className="text-sm line-clamp-3">{content.text}</p>
          </div>
        : <p className="text-sm text-muted-foreground italic">No description yet — click edit to generate with AI</p>;
    default:
      return <p className="text-sm text-muted-foreground italic">{block.type}</p>;
  }
}

// =================== BLOCK EDITOR DISPATCHER ===================

function BlockEditorPanel({ block, onSave, onClose }: { block: Block; onSave: (content: any) => void; onClose: () => void }) {
  const [localContent, setLocalContent] = useState(() => {
    try { return JSON.parse(block.content); } catch { return {}; }
  });

  const handleSave = () => {
    onSave(localContent);
    onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [localContent]);

  const renderEditor = () => {
    switch (block.type) {
      case "TEXT": return <TextEditor content={localContent} onChange={setLocalContent} />;
      case "HEADING": return <HeadingEditor content={localContent} onChange={setLocalContent} />;
      case "IMAGE": return <ImageEditor content={localContent} onChange={setLocalContent} />;
      case "VIDEO": return <VideoEditor content={localContent} onChange={setLocalContent} />;
      case "QUOTE": return <QuoteEditor content={localContent} onChange={setLocalContent} />;
      case "CALLOUT": return <CalloutEditor content={localContent} onChange={setLocalContent} />;
      case "CODE": return <CodeEditor content={localContent} onChange={setLocalContent} />;
      case "BULLETED_LIST": return <ListEditor content={localContent} onChange={setLocalContent} numbered={false} />;
      case "NUMBERED_LIST": return <ListEditor content={localContent} onChange={setLocalContent} numbered={true} />;
      case "ACCORDION": return <AccordionEditor content={localContent} onChange={setLocalContent} />;
      case "TABS": return <TabsEditor content={localContent} onChange={setLocalContent} />;
      case "PROCESS": return <ProcessEditor content={localContent} onChange={setLocalContent} />;
      case "FLASHCARDS": return <FlashcardsEditor content={localContent} onChange={setLocalContent} />;
      case "KNOWLEDGE_CHECK": return <KnowledgeCheckEditor content={localContent} onChange={setLocalContent} />;
      case "TABLE": return <TableEditor content={localContent} onChange={setLocalContent} />;
      case "GALLERY": return <GalleryEditor content={localContent} onChange={setLocalContent} />;
      case "TIMELINE": return <TimelineEditor content={localContent} onChange={setLocalContent} />;
      case "FILE": return <FileEditor content={localContent} onChange={setLocalContent} />;
      case "BUTTON": return <ButtonEditor content={localContent} onChange={setLocalContent} />;
      case "DIVIDER": return <DividerEditor content={localContent} onChange={setLocalContent} />;
      case "NEXT_BUTTON": return <NextButtonEditor content={localContent} onChange={setLocalContent} />;
      case "NOTES": return <NotesEditor content={localContent} onChange={setLocalContent} />;
      case "VIDEO_DESCRIPTION": return <VideoDescriptionEditor content={localContent} onChange={setLocalContent} blockId={block.id} />;
      default: return <p className="text-muted-foreground">No editor for {block.type}</p>;
    }
  };

  return (
    <div className="border rounded-lg bg-card p-4 space-y-4 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">{block.type.replace(/_/g, " ")}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-3 w-3" /></Button>
      </div>
      <div>{renderEditor()}</div>
      <div className="flex justify-end gap-2 pt-1 border-t">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave}>Save Block <span className="ml-1 text-xs opacity-60">⌘S</span></Button>
      </div>
    </div>
  );
}

// =================== BLOCK SETTINGS ===================

function BlockSettingsPanel({ settings, onSave, onClose }: { settings: any; onSave: (s: any) => void; onClose: () => void }) {
  const [local, setLocal] = useState(settings);
  return (
    <div className="border rounded-lg bg-card p-4 space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Block Settings</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-3 w-3" /></Button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Background</label>
          <Input value={local.background || ""} onChange={(e) => setLocal({ ...local, background: e.target.value })} placeholder="e.g. #f9fafb or transparent" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Padding</label>
          <Select value={local.padding || "md"} onValueChange={(v) => setLocal({ ...local, padding: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => { onSave(local); onClose(); }}>Apply</Button>
      </div>
    </div>
  );
}

// =================== SINGLE BLOCK ROW ===================

interface BlockRowProps {
  block: Block;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
  isEditing: boolean;
  isSettingsOpen: boolean;
  onSaveContent: (content: any) => void;
  onCloseEdit: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  onSaveSettings: (settings: any) => void;
}

function BlockRow({
  block, onEdit, onDelete, onDuplicate,
  onMoveUp, onMoveDown, isFirst, isLast,
  onDragStart, onDragOver, onDrop, onDragEnd, isDragging,
  isEditing, isSettingsOpen,
  onSaveContent, onCloseEdit,
  onOpenSettings, onCloseSettings, onSaveSettings,
}: BlockRowProps) {
  const settings = (() => { try { return JSON.parse(block.settings); } catch { return {}; } })();
  const paddingMap: Record<string, string> = { sm: "p-3", md: "p-5", lg: "p-8", none: "p-0" };
  const padding = paddingMap[settings.padding || "md"] || "p-5";
  const dragHandleActive = useRef(false);

  return (
    <div
      draggable
      onDragStart={(e) => { if (!dragHandleActive.current) { e.preventDefault(); return; } onDragStart(e); }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={(e) => { dragHandleActive.current = false; onDragEnd(e); }}
      className={`group relative transition-all ${isDragging ? "opacity-40" : ""}`}
      style={settings.background ? { background: settings.background } : {}}
    >
      <div className={`rounded-lg border border-border hover:border-primary/30 ${padding} relative`}>
        {/* Toolbar */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-card border rounded-md shadow-sm px-1 py-0.5">
          <button onClick={onMoveUp} disabled={isFirst} className="text-muted-foreground hover:text-foreground p-1 disabled:opacity-20" title="Move up">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="text-muted-foreground hover:text-foreground p-1 disabled:opacity-20" title="Move down">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-3.5 bg-border mx-0.5" />
          <button
            className="cursor-grab text-muted-foreground hover:text-foreground p-1"
            title="Drag to reorder"
            onMouseDown={() => { dragHandleActive.current = true; }}
            onMouseUp={() => { dragHandleActive.current = false; }}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button onClick={onEdit} className="text-muted-foreground hover:text-primary p-1" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onOpenSettings} className="text-muted-foreground hover:text-foreground p-1" title="Settings">
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDuplicate} className="text-muted-foreground hover:text-foreground p-1" title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-1" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Block type badge */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-wide">
            {block.type.replace(/_/g, " ")}
          </span>
        </div>

        <div className="pt-4">
          <BlockPreview block={block} />
        </div>
      </div>

      {isEditing && (
        <BlockEditorPanel block={block} onSave={onSaveContent} onClose={onCloseEdit} />
      )}
      {isSettingsOpen && (
        <BlockSettingsPanel settings={settings} onSave={onSaveSettings} onClose={onCloseSettings} />
      )}
    </div>
  );
}

// =================== ADD BLOCK BUTTON ===================

function AddBlockButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-2 px-4 rounded-md text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-border hover:border-primary/40 transition-all group"
    >
      <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
      Add Block
    </button>
  );
}

function InlineAddZone({ onClick }: { onClick: () => void }) {
  return (
    <div className="group/addzone relative h-5 flex items-center cursor-pointer" onClick={onClick}>
      <div className="absolute inset-x-0 top-1/2 h-px bg-transparent group-hover/addzone:bg-primary/30 transition-colors" />
      <div className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover/addzone:opacity-100 transition-all">
        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
          <Plus className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

// =================== MAIN BLOCK BUILDER ===================

interface BlockBuilderProps {
  lessonId: number;
  onSave?: () => void;
}

export function BlockBuilder({ lessonId, onSave }: BlockBuilderProps) {
  const { toast } = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [settingsBlockId, setSettingsBlockId] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after">("after");
  const [history, setHistory] = useState<number[][]>([]);

  const { data: blocks = [], isLoading } = useQuery<Block[]>({
    queryKey: ["/api/lessons", lessonId, "blocks"],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/${lessonId}/blocks`, { credentials: "include" });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ type, position }: { type: BlockType; position: number }) => {
      const res = await apiRequest("POST", `/api/lessons/${lessonId}/blocks`, { type, position, content: "{}", settings: "{}" });
      return res.json();
    },
    onSuccess: (newBlock: Block) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "blocks"] });
      if (newBlock.type !== "DIVIDER") {
        setEditingBlockId(newBlock.id);
      }
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/lessons/blocks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "blocks"] });
      toast({ title: "Block saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/lessons/blocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "blocks"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/lessons/blocks/${id}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "blocks"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await apiRequest("POST", `/api/lessons/${lessonId}/blocks/reorder`, { orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "blocks"] });
    },
  });

  const handleAddBlock = (type: BlockType) => {
    let position: number;
    if (insertAfterIndex === null) position = blocks.length;
    else if (insertAfterIndex === -1) position = 0;
    else position = insertAfterIndex + 1;
    createMutation.mutate({ type, position });
    setInsertAfterIndex(null);
  };

  const handleSaveContent = (blockId: number, content: any) => {
    updateMutation.mutate({ id: blockId, data: { content: JSON.stringify(content) } });
    setEditingBlockId(null);
  };

  const handleSaveSettings = (blockId: number, settings: any) => {
    updateMutation.mutate({ id: blockId, data: { settings: JSON.stringify(settings) } });
    setSettingsBlockId(null);
  };

  const handleDrop = (targetId: number, position: "before" | "after") => {
    if (!dragId || dragId === targetId) return;
    const ids = blocks.map((b) => b.id);
    const fromIdx = ids.indexOf(dragId);
    let toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    // push current order to history for undo
    setHistory(prev => [...prev.slice(-19), ids]);
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    // recalculate toIdx after removal
    toIdx = reordered.indexOf(targetId);
    const insertAt = position === "after" ? toIdx + 1 : toIdx;
    reordered.splice(insertAt, 0, dragId);
    reorderMutation.mutate(reordered);
    setDragId(null);
    setDragOverId(null);
  };

  const handleUndo = useCallback(() => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory(h => h.slice(0, -1));
    reorderMutation.mutate(prev);
  }, [history, reorderMutation]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        if (history.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [history, handleUndo]);

  const handleMove = (id: number, direction: "up" | "down") => {
    const sorted = [...blocks].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((b) => b.id === id);
    if (direction === "up" && idx > 0) {
      const reordered = sorted.map((b) => b.id);
      [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
      reorderMutation.mutate(reordered);
    } else if (direction === "down" && idx < sorted.length - 1) {
      const reordered = sorted.map((b) => b.id);
      [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
      reorderMutation.mutate(reordered);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleUndo}>
            <RefreshCw className="h-3 w-3" /> Undo
          </Button>
        </div>
      )}
      {blocks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <div className="text-5xl mb-4">✦</div>
          <p className="text-muted-foreground font-medium mb-4">No blocks yet. Start building your lesson.</p>
          <Button onClick={() => { setInsertAfterIndex(null); setPickerOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add First Block
          </Button>
        </div>
      ) : (
        <>
          <InlineAddZone onClick={() => { setInsertAfterIndex(-1); setPickerOpen(true); }} />
          {blocks.map((block, idx) => (
            <div key={block.id}>
              {/* Drop line BEFORE block */}
              {dragId && dragOverId === block.id && dropPosition === "before" && (
                <div className="h-0.5 bg-primary rounded-full mx-1 my-1 shadow-sm shadow-primary/50" />
              )}
              <BlockRow
                block={block}
                onEdit={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                onDelete={() => {
                  if (confirm("Delete this block?")) {
                    setHistory(prev => [...prev.slice(-19), blocks.map(b => b.id)]);
                    deleteMutation.mutate(block.id);
                  }
                }}
                onDuplicate={() => duplicateMutation.mutate(block.id)}
                onMoveUp={() => handleMove(block.id, "up")}
                onMoveDown={() => handleMove(block.id, "down")}
                isFirst={idx === 0}
                isLast={idx === blocks.length - 1}
                onDragStart={(e) => { setDragId(block.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverId(block.id);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropPosition(e.clientY < rect.top + rect.height / 2 ? "before" : "after");
                }}
                onDrop={() => handleDrop(block.id, dropPosition)}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                isDragging={dragId === block.id}
                isEditing={editingBlockId === block.id}
                isSettingsOpen={settingsBlockId === block.id}
                onSaveContent={(content) => handleSaveContent(block.id, content)}
                onCloseEdit={() => setEditingBlockId(null)}
                onOpenSettings={() => setSettingsBlockId(settingsBlockId === block.id ? null : block.id)}
                onCloseSettings={() => setSettingsBlockId(null)}
                onSaveSettings={(s) => handleSaveSettings(block.id, s)}
              />
              {/* Drop line AFTER block */}
              {dragId && dragOverId === block.id && dropPosition === "after" && (
                <div className="h-0.5 bg-primary rounded-full mx-1 my-1 shadow-sm shadow-primary/50" />
              )}
              {!dragId && <InlineAddZone onClick={() => { setInsertAfterIndex(idx); setPickerOpen(true); }} />}
            </div>
          ))}
        </>
      )}

      {pickerOpen && (
        <BlockPicker
          onSelect={handleAddBlock}
          onClose={() => { setPickerOpen(false); setInsertAfterIndex(null); }}
        />
      )}
    </div>
  );
}
