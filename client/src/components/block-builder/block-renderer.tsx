import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, X, Download, Copy, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, StickyNote } from "lucide-react";

export type BlockType =
  | "TEXT" | "HEADING" | "IMAGE" | "VIDEO" | "BUTTON" | "DIVIDER"
  | "QUOTE" | "BULLETED_LIST" | "NUMBERED_LIST" | "ACCORDION" | "TABS"
  | "PROCESS" | "FLASHCARDS" | "KNOWLEDGE_CHECK" | "TABLE" | "GALLERY"
  | "CALLOUT" | "TIMELINE" | "CODE" | "FILE" | "NEXT_BUTTON" | "NOTES";

interface Block {
  id: number;
  type: BlockType;
  content: string;
  settings: string;
}

// =================== VIDEO EMBED HELPER ===================

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
  return null;
}

// =================== BLOCK RENDERERS ===================

function TextBlock({ content }: { content: any }) {
  if (!content.html) return <p className="text-muted-foreground italic">No content</p>;
  return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.html) }} />;
}

function HeadingBlock({ content }: { content: any }) {
  const align = content.align || "left";
  const level = typeof content.level === "string" ? content.level : "H2";
  const cls = `text-${align} font-bold ${level === "H1" ? "text-3xl" : level === "H3" ? "text-xl" : "text-2xl"}`;
  const Tag = (level.toLowerCase() || "h2") as keyof JSX.IntrinsicElements;
  return <Tag className={cls}>{content.text || ""}</Tag>;
}

function ImageBlock({ content }: { content: any }) {
  if (!content.url) return null;
  const align = content.align || "center";
  const alignCls = align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : "";
  const widthCls = align === "full" ? "w-full" : align === "bestfit" ? "w-auto max-w-full" : "max-w-2xl";
  const imgCls = align === "bestfit" ? "max-w-full h-auto rounded-lg" : "w-full rounded-lg";
  return (
    <figure className={`${widthCls} ${alignCls}`}>
      <img src={content.url} alt={content.alt || ""} className={imgCls} />
      {content.caption && <figcaption className="text-center text-sm text-muted-foreground mt-2">{content.caption}</figcaption>}
    </figure>
  );
}

function VideoBlock({ content }: { content: any }) {
  // If embed code is provided, use it directly
  if (content.embedCode) {
    return (
      <figure>
        <div
          className="aspect-video rounded-lg overflow-hidden bg-black relative [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0"
          dangerouslySetInnerHTML={{ __html: content.embedCode }}
        />
        {content.caption && <figcaption className="text-center text-sm text-muted-foreground mt-2">{content.caption}</figcaption>}
      </figure>
    );
  }
  const embedUrl = getEmbedUrl(content.url || "");
  return (
    <figure>
      {embedUrl ? (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={content.caption || "Video"} />
        </div>
      ) : content.url ? (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <video src={content.url} controls className="w-full h-full" />
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">No video URL</div>
      )}
      {content.caption && <figcaption className="text-center text-sm text-muted-foreground mt-2">{content.caption}</figcaption>}
    </figure>
  );
}

function QuoteBlock({ content }: { content: any }) {
  return (
    <blockquote className="relative border-l-4 border-primary pl-6 py-2">
      <span className="absolute top-0 left-3 text-5xl leading-none text-primary/20 font-serif select-none">"</span>
      <p className="text-lg italic text-foreground leading-relaxed">{content.text || ""}</p>
      {content.author && (
        <footer className="mt-3 text-sm text-muted-foreground">
          — <strong>{content.author}</strong>{content.role ? `, ${content.role}` : ""}
        </footer>
      )}
    </blockquote>
  );
}

function CalloutBlock({ content }: { content: any }) {
  const typeMap: Record<string, { bg: string; border: string; icon: string }> = {
    info:    { bg: "bg-blue-50 dark:bg-blue-950/40",    border: "border-blue-400",   icon: "ℹ️" },
    warning: { bg: "bg-yellow-50 dark:bg-yellow-950/40", border: "border-yellow-400", icon: "⚠️" },
    success: { bg: "bg-green-50 dark:bg-green-950/40",  border: "border-green-400",  icon: "✅" },
    error:   { bg: "bg-red-50 dark:bg-red-950/40",      border: "border-red-400",    icon: "❌" },
  };
  const t = typeMap[content.calloutType || "info"];
  return (
    <div className={`${t.bg} ${t.border} border-l-4 rounded-r-lg p-4 space-y-1`}>
      <div className="flex items-center gap-2">
        <span>{t.icon}</span>
        {content.title && <strong className="text-sm font-semibold">{content.title}</strong>}
      </div>
      {content.body && <p className="text-sm leading-relaxed">{content.body}</p>}
    </div>
  );
}

function CodeBlock({ content }: { content: any }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(content.code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-muted text-xs text-muted-foreground">
        <span>{content.language || "code"}</span>
        <button onClick={copy} className="flex items-center gap-1 hover:text-foreground transition-colors">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 bg-background text-sm font-mono leading-relaxed">
        <code>{content.code || ""}</code>
      </pre>
    </div>
  );
}

function BulletedListBlock({ content }: { content: any }) {
  const items: string[] = content.items || [];
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function NumberedListBlock({ content }: { content: any }) {
  const items: string[] = content.items || [];
  return (
    <ol className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="font-semibold text-primary shrink-0 w-5">{i + 1}.</span>
          {item}
        </li>
      ))}
    </ol>
  );
}

function AccordionBlock({ content }: { content: any }) {
  const [open, setOpen] = useState<number | null>(null);
  const items: Array<{ title: string; body: string }> = content.items || [];
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            {item.title}
            {open === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
              {item.body}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TabsBlock({ content }: { content: any }) {
  const [active, setActive] = useState(0);
  const items: Array<{ label: string; body: string }> = content.items || [];
  if (!items.length) return null;
  return (
    <div>
      <div className="flex border-b border-border overflow-x-auto">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              active === i
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label || `Tab ${i + 1}`}
          </button>
        ))}
      </div>
      <div className="pt-4 text-sm text-foreground leading-relaxed">
        {items[active]?.body || ""}
      </div>
    </div>
  );
}

function FlashcardsBlock({ content }: { content: any }) {
  const cards: Array<{ front: string; back: string }> = content.cards || [];
  const heading = content.heading !== undefined ? content.heading : "Test your knowledge";
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    const next = new Set(flipped);
    next.has(i) ? next.delete(i) : next.add(i);
    setFlipped(next);
  };
  return (
    <div className="space-y-4">
      {heading && <h3 className="text-lg font-semibold">{heading}</h3>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            className="relative h-36 rounded-xl border border-border cursor-pointer group"
            style={{ perspective: "1000px" }}
          >
            <div
              className="w-full h-full transition-transform duration-500"
              style={{ transformStyle: "preserve-3d", transform: flipped.has(i) ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 flex items-center justify-center p-4 pb-8 text-center text-sm font-medium rounded-xl bg-card"
                style={{ backfaceVisibility: "hidden" as const }}
              >
                <span>{card.front}</span>
                <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">click to flip</span>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 flex items-center justify-center p-4 pb-8 text-center text-sm rounded-xl bg-green-500/15"
                style={{ backfaceVisibility: "hidden" as const, transform: "rotateY(180deg)" }}
              >
                <span>{card.back}</span>
                <span className="absolute bottom-2 right-2 text-[10px] text-green-600/70">click to flip</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessBlock({ content }: { content: any }) {
  const steps: Array<{ title: string; description: string }> = content.steps || [];
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
              {i + 1}
            </div>
            {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1 mb-1" style={{ minHeight: 24 }} />}
          </div>
          <div className={`pb-6 flex-1 ${i === steps.length - 1 ? "pb-0" : ""}`}>
            <p className="font-semibold text-sm leading-tight mb-1">{step.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface KCProps {
  content: any;
  // Controlled mode props (passed from BlockRenderer for grouped behavior)
  controlled?: boolean;
  selected?: number | null;
  lockedCorrect?: boolean; // This answer is locked correct
  submitted?: boolean;
  onSelect?: (i: number) => void;
}

function KnowledgeCheckBlock({ content, controlled, selected, lockedCorrect, submitted, onSelect }: KCProps) {
  const options: Array<{ text: string; isCorrect: boolean }> = content.options || [];

  // Standalone mode state
  const [standaloneSelected, setStandaloneSelected] = useState<number | null>(null);
  const [standaloneSubmitted, setStandaloneSubmitted] = useState(false);
  const [prevWrong, setPrevWrong] = useState<number | null>(null);

  const isControlled = controlled === true;
  const activeSelected = isControlled ? (selected ?? null) : standaloneSelected;
  const activeSubmitted = isControlled ? (submitted ?? false) : standaloneSubmitted;

  const handleSelect = (i: number) => {
    if (isControlled) {
      onSelect?.(i);
    } else {
      if (standaloneSubmitted && options[standaloneSelected!]?.isCorrect) return; // locked
      setStandaloneSelected(i);
    }
  };

  const handleStandaloneSubmit = () => {
    if (standaloneSelected === null) return;
    if (!options[standaloneSelected]?.isCorrect) {
      setPrevWrong(standaloneSelected);
    }
    setStandaloneSubmitted(true);
  };

  const handleStandaloneReset = () => {
    setPrevWrong(standaloneSelected);
    setStandaloneSubmitted(false);
  };

  const isCorrectlyAnswered = options[activeSelected!]?.isCorrect;
  const isLocked = isControlled ? lockedCorrect : (standaloneSubmitted && isCorrectlyAnswered);

  return (
    <div className="border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="font-medium leading-snug">{content.question || "Question"}</p>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = activeSelected === i;
          const isCorrect = opt.isCorrect;
          // In standalone submitted mode
          let cls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-all ";
          if (isLocked) {
            // All locked green
            cls += isSelected && isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 cursor-default" : "border-border opacity-50 cursor-default";
          } else if (activeSubmitted) {
            if (isSelected && !isCorrect) {
              cls += "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400";
            } else if (isSelected && isCorrect) {
              cls += "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 cursor-default";
            } else if (isCorrect) {
              cls += "border-border opacity-60";
            } else {
              cls += "border-border hover:border-primary/40 hover:bg-muted/50";
            }
          } else {
            cls += isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/50";
          }
          const canClick = !isLocked && (!activeSubmitted || (activeSubmitted && !isCorrectlyAnswered));
          return (
            <button key={i} className={cls} onClick={() => canClick && handleSelect(i)} disabled={isLocked || (activeSubmitted && isCorrectlyAnswered)}>
              <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? "border-primary" : "border-border"}`}>
                {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
              </span>
              {opt.text}
              {activeSubmitted && isSelected && isCorrect && <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />}
              {activeSubmitted && isSelected && !isCorrect && <X className="h-4 w-4 ml-auto text-red-500" />}
            </button>
          );
        })}
      </div>
      {/* Feedback message */}
      {activeSubmitted && (
        <div className={`text-sm font-medium ${isCorrectlyAnswered ? "text-green-600" : "text-red-600"}`}>
          {isCorrectlyAnswered ? "Correct!" : "Incorrect — select a new answer and try again."}
        </div>
      )}
      {activeSubmitted && isCorrectlyAnswered && content.explanation && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <strong>Explanation: </strong>{content.explanation}
        </div>
      )}
      {/* Standalone-only: submit/try again buttons */}
      {!isControlled && !activeSubmitted && (
        <Button size="sm" onClick={handleStandaloneSubmit} disabled={standaloneSelected === null} className="w-full">
          Submit Answer
        </Button>
      )}
      {!isControlled && activeSubmitted && !isCorrectlyAnswered && (
        <Button variant="outline" size="sm" onClick={handleStandaloneReset}>Try Again</Button>
      )}
    </div>
  );
}

function TableBlock({ content }: { content: any }) {
  const rows: string[][] = content.rows || [];
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {rows[0].map((cell, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold bg-muted border-b border-border">{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GalleryBlock({ content }: { content: any }) {
  const images: Array<{ url: string; caption: string }> = content.images || [];
  const [lightbox, setLightbox] = useState<string | null>(null);
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <figure key={i} className="cursor-pointer group" onClick={() => setLightbox(img.url)}>
            <div className="overflow-hidden rounded-lg aspect-square bg-muted">
              <img src={img.url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            {img.caption && <figcaption className="text-xs text-muted-foreground mt-1 truncate">{img.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-full max-h-full rounded-lg" alt="Full size" />
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}

function TimelineBlock({ content }: { content: any }) {
  const events: Array<{ date: string; title: string; description: string }> = content.events || [];
  return (
    <div className="space-y-0">
      {events.map((ev, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary mt-1.5 shrink-0" />
            {i < events.length - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
          </div>
          <div className="pb-6 flex-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">{ev.date}</span>
            <p className="font-medium text-sm mt-0.5">{ev.title}</p>
            {ev.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{ev.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function FileBlock({ content }: { content: any }) {
  if (!content.url) return null;
  return (
    <a
      href={content.url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all group w-fit"
    >
      <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10">
        <Download className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{content.name || "Download File"}</p>
        {content.description && <p className="text-xs text-muted-foreground">{content.description}</p>}
      </div>
    </a>
  );
}

function NextButtonBlock({ content, navState }: { content: any; navState?: { onNext?: () => void; onPrev?: () => void; nextDisabled?: boolean } }) {
  const nextLabel = content.nextLabel || "Next";
  const prevLabel = content.prevLabel || "Previous";
  if (!navState) {
    // Editor preview
    return (
      <div className="flex items-center justify-between gap-2 py-2">
        <button className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> {prevLabel}
        </button>
        <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          {nextLabel} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div>
        {navState.onPrev && (
          <Button variant="ghost" onClick={navState.onPrev}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {prevLabel}
          </Button>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        {navState.onNext && (
          <Button
            onClick={navState.onNext}
            disabled={navState.nextDisabled}
          >
            {nextLabel} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
        {navState.nextDisabled && (
          <p className="text-[10px] text-muted-foreground">Answer all questions to continue</p>
        )}
      </div>
    </div>
  );
}

function NotesBlock({ content, noteState }: { content: any; noteState?: { content: string; onChange: (v: string) => void; saveStatus: string } }) {
  const label = content.label || "My Notes";
  if (!noteState) {
    return (
      <div className="border border-border rounded-xl p-4 bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="h-20 rounded-lg bg-muted/40 border border-dashed border-border" />
      </div>
    );
  }
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <StickyNote className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
        {noteState.saveStatus === "saving" && <span className="text-xs text-amber-500 ml-auto">Saving...</span>}
        {noteState.saveStatus === "saved" && noteState.content && <span className="text-xs text-emerald-500 ml-auto">Saved</span>}
      </div>
      <div className="px-4 pb-4 pt-3">
        <Textarea
          className="min-h-[120px] text-sm resize-none"
          placeholder="Write your notes for this lesson..."
          value={noteState.content}
          onChange={(e) => noteState.onChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">Notes auto-save as you type</p>
      </div>
    </div>
  );
}

function ButtonBlock({ content }: { content: any }) {
  if (!content.text) return null;
  const alignCls = content.align === "center" ? "text-center" : content.align === "right" ? "text-right" : "text-left";
  const size = content.size || 3; // 1-6 scale
  const paddingX = [8, 12, 20, 28, 36, 48][size - 1] || 20;
  const paddingY = [4, 6, 10, 14, 18, 24][size - 1] || 10;
  const fontSize = [10, 12, 14, 16, 18, 22][size - 1] || 14;
  const customColor = content.color;
  let styleCls = "";
  let inlineStyle: React.CSSProperties = { paddingLeft: paddingX, paddingRight: paddingX, paddingTop: paddingY, paddingBottom: paddingY, fontSize };
  if (customColor) {
    inlineStyle = { ...inlineStyle, backgroundColor: customColor, color: "#fff" };
  } else if (content.style === "outline") {
    styleCls = "border border-primary text-primary hover:bg-primary/10";
  } else if (content.style === "secondary") {
    styleCls = "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  } else {
    styleCls = "bg-primary text-primary-foreground hover:bg-primary/90";
  }
  return (
    <div className={alignCls}>
      <a href={content.url || "#"} target="_blank" rel="noopener noreferrer">
        <button className={`rounded-lg font-medium transition-colors ${styleCls}`} style={inlineStyle}>
          {content.text}
        </button>
      </a>
    </div>
  );
}

function DividerBlock({ content }: { content: any }) {
  if (content.style === "space") return <div className="h-8" />;
  if (content.style === "dots") return <div className="flex items-center justify-center gap-2 my-2"><span className="w-1.5 h-1.5 rounded-full bg-border" /><span className="w-1.5 h-1.5 rounded-full bg-border" /><span className="w-1.5 h-1.5 rounded-full bg-border" /></div>;
  return <hr className="border-border" />;
}

// =================== BLOCK RENDERER ===================

function renderBlock(block: Block) {
  let content: any = {};
  try { content = JSON.parse(block.content); } catch {}

  switch (block.type) {
    case "TEXT": return <TextBlock content={content} />;
    case "HEADING": return <HeadingBlock content={content} />;
    case "IMAGE": return <ImageBlock content={content} />;
    case "VIDEO": return <VideoBlock content={content} />;
    case "QUOTE": return <QuoteBlock content={content} />;
    case "CALLOUT": return <CalloutBlock content={content} />;
    case "CODE": return <CodeBlock content={content} />;
    case "BULLETED_LIST": return <BulletedListBlock content={content} />;
    case "NUMBERED_LIST": return <NumberedListBlock content={content} />;
    case "ACCORDION": return <AccordionBlock content={content} />;
    case "TABS": return <TabsBlock content={content} />;
    case "FLASHCARDS": return <FlashcardsBlock content={content} />;
    case "PROCESS": return <ProcessBlock content={content} />;
    case "KNOWLEDGE_CHECK": return <KnowledgeCheckBlock content={content} />;
    case "TABLE": return <TableBlock content={content} />;
    case "GALLERY": return <GalleryBlock content={content} />;
    case "TIMELINE": return <TimelineBlock content={content} />;
    case "FILE": return <FileBlock content={content} />;
    case "BUTTON": return <ButtonBlock content={content} />;
    case "DIVIDER": return <DividerBlock content={content} />;
    case "NEXT_BUTTON": return <NextButtonBlock content={content} />;
    case "NOTES": return <NotesBlock content={content} />;
    default: return null;
  }
}

interface BlockRendererProps {
  blocks: Block[];
  onKnowledgeChecksAnswered?: (allAnswered: boolean) => void;
  navState?: {
    onNext?: () => void;
    onPrev?: () => void;
    nextDisabled?: boolean;
  };
  noteState?: {
    content: string;
    onChange: (v: string) => void;
    saveStatus: string;
  };
}

export function BlockRenderer({ blocks, onKnowledgeChecksAnswered, navState, noteState }: BlockRendererProps) {
  const kcBlocks = blocks.filter(b => b.type === "KNOWLEDGE_CHECK");
  const hasKC = kcBlocks.length > 0;

  // Track selections: { blockId: selectedOptionIndex }
  const [kcSelections, setKcSelections] = useState<Record<number, number | null>>({});
  // Track which are locked (correctly answered)
  const [kcLocked, setKcLocked] = useState<Record<number, boolean>>({});
  // Track submitted state
  const [kcSubmitted, setKcSubmitted] = useState(false);
  // Track previous wrong selections (to show/hide)
  const [kcPrevWrong, setKcPrevWrong] = useState<Record<number, number | null>>({});

  const allKcAnswered = hasKC && kcBlocks.every(b => kcLocked[b.id] === true);

  useEffect(() => {
    if (onKnowledgeChecksAnswered) {
      onKnowledgeChecksAnswered(!hasKC || allKcAnswered);
    }
  }, [allKcAnswered, hasKC]);

  const handleKcSelect = (blockId: number, optionIndex: number) => {
    if (kcLocked[blockId]) return;
    setKcSelections(prev => ({ ...prev, [blockId]: optionIndex }));
  };

  const handleGroupSubmit = () => {
    // For each KC block: check if correct, lock correct ones, mark wrong ones
    const newLocked = { ...kcLocked };
    const newPrevWrong = { ...kcPrevWrong };
    kcBlocks.forEach(b => {
      if (kcLocked[b.id]) return; // already locked
      let content: any = {};
      try { content = JSON.parse(b.content); } catch {}
      const options: Array<{ text: string; isCorrect: boolean }> = content.options || [];
      const selected = kcSelections[b.id];
      if (selected !== null && selected !== undefined && options[selected]?.isCorrect) {
        newLocked[b.id] = true;
      } else {
        newPrevWrong[b.id] = selected ?? null;
      }
    });
    setKcLocked(newLocked);
    setKcPrevWrong(newPrevWrong);
    setKcSubmitted(true);
  };

  const allUnlockedAnswered = kcBlocks.every(b => kcLocked[b.id] || (kcSelections[b.id] !== null && kcSelections[b.id] !== undefined));
  const hasAnyWrong = kcSubmitted && kcBlocks.some(b => !kcLocked[b.id]);

  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        let settings: any = {};
        try { settings = JSON.parse(block.settings); } catch {}
        const paddingMap: Record<string, string> = { sm: "py-3 px-4", md: "py-5 px-0", lg: "py-8 px-0", none: "p-0" };
        const padding = paddingMap[settings.padding || "md"] || "py-5 px-0";

        if (block.type === "KNOWLEDGE_CHECK" && hasKC) {
          let content: any = {};
          try { content = JSON.parse(block.content); } catch {}
          return (
            <div key={block.id} className={padding} style={settings.background ? { background: settings.background } : {}}>
              <KnowledgeCheckBlock
                content={content}
                controlled
                selected={kcSelections[block.id] ?? null}
                lockedCorrect={kcLocked[block.id] ?? false}
                submitted={kcSubmitted}
                onSelect={(i) => handleKcSelect(block.id, i)}
              />
            </div>
          );
        }

        if (block.type === "NEXT_BUTTON") {
          let content: any = {};
          try { content = JSON.parse(block.content); } catch {}
          return (
            <div key={block.id} className={padding} style={settings.background ? { background: settings.background } : {}}>
              <NextButtonBlock content={content} navState={navState} />
            </div>
          );
        }

        if (block.type === "NOTES") {
          let content: any = {};
          try { content = JSON.parse(block.content); } catch {}
          return (
            <div key={block.id} className={padding} style={settings.background ? { background: settings.background } : {}}>
              <NotesBlock content={content} noteState={noteState} />
            </div>
          );
        }

        return (
          <div
            key={block.id}
            className={padding}
            style={settings.background ? { background: settings.background } : {}}
          >
            {renderBlock(block)}
          </div>
        );
      })}

      {/* Shared submit button for all knowledge checks */}
      {hasKC && !allKcAnswered && (
        <div className="pt-2">
          <Button
            onClick={handleGroupSubmit}
            disabled={!allUnlockedAnswered}
            className="w-full"
          >
            {hasAnyWrong ? "Re-submit Answers" : "Submit Answers"}
          </Button>
          {!allUnlockedAnswered && (
            <p className="text-xs text-muted-foreground text-center mt-2">Answer all questions before submitting</p>
          )}
        </div>
      )}
      {hasKC && allKcAnswered && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium pt-2">
          <CheckCircle2 className="h-4 w-4" />
          All questions answered correctly!
        </div>
      )}
    </div>
  );
}
