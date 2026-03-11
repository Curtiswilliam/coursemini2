import { useState } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Download, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

export type BlockType =
  | "TEXT" | "HEADING" | "IMAGE" | "VIDEO" | "BUTTON" | "DIVIDER"
  | "QUOTE" | "BULLETED_LIST" | "NUMBERED_LIST" | "ACCORDION" | "TABS"
  | "PROCESS" | "FLASHCARDS" | "KNOWLEDGE_CHECK" | "TABLE" | "GALLERY"
  | "CALLOUT" | "TIMELINE" | "CODE" | "FILE";

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
  const alignCls = content.align === "center" ? "mx-auto" : content.align === "right" ? "ml-auto" : "";
  return (
    <figure className={`${content.align === "full" ? "w-full" : "max-w-2xl"} ${alignCls}`}>
      <img src={content.url} alt={content.alt || ""} className="w-full rounded-lg" />
      {content.caption && <figcaption className="text-center text-sm text-muted-foreground mt-2">{content.caption}</figcaption>}
    </figure>
  );
}

function VideoBlock({ content }: { content: any }) {
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
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    const next = new Set(flipped);
    next.has(i) ? next.delete(i) : next.add(i);
    setFlipped(next);
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card, i) => (
        <button
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
              className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-medium rounded-xl bg-card"
              style={{ backfaceVisibility: "hidden" }}
            >
              {card.front}
              <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">click to flip</span>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm bg-primary/10 rounded-xl"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              {card.back}
            </div>
          </div>
        </button>
      ))}
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

function KnowledgeCheckBlock({ content }: { content: any }) {
  const options: Array<{ text: string; isCorrect: boolean }> = content.options || [];
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected !== null) setSubmitted(true);
  };

  const handleReset = () => { setSelected(null); setSubmitted(false); };

  return (
    <div className="border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="font-medium leading-snug">{content.question || "Question"}</p>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = opt.isCorrect;
          let cls = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-all ";
          if (!submitted) {
            cls += isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/50";
          } else if (isCorrect) {
            cls += "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400";
          } else if (isSelected && !isCorrect) {
            cls += "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400";
          } else {
            cls += "border-border opacity-60";
          }
          return (
            <button key={i} className={cls} onClick={() => !submitted && setSelected(i)} disabled={submitted}>
              <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? "border-primary" : "border-border"}`}>
                {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
              </span>
              {opt.text}
              {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />}
              {submitted && isSelected && !isCorrect && <X className="h-4 w-4 ml-auto text-red-500" />}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={handleSubmit} disabled={selected === null} className="w-full">
          Submit Answer
        </Button>
      ) : (
        <div className="space-y-3">
          <div className={`text-sm font-medium ${options[selected!]?.isCorrect ? "text-green-600" : "text-red-600"}`}>
            {options[selected!]?.isCorrect ? "Correct!" : "Incorrect. Try again!"}
          </div>
          {content.explanation && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>Explanation: </strong>{content.explanation}
            </div>
          )}
          {!options[selected!]?.isCorrect && (
            <Button variant="outline" size="sm" onClick={handleReset}>Try Again</Button>
          )}
        </div>
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

function ButtonBlock({ content }: { content: any }) {
  if (!content.text) return null;
  const alignCls = content.align === "center" ? "text-center" : content.align === "right" ? "text-right" : "text-left";
  const styleCls = content.style === "outline"
    ? "border border-primary text-primary hover:bg-primary/10"
    : content.style === "secondary"
    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    : "bg-primary text-primary-foreground hover:bg-primary/90";
  return (
    <div className={alignCls}>
      <a href={content.url || "#"} target="_blank" rel="noopener noreferrer">
        <button className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${styleCls}`}>
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
    default: return null;
  }
}

interface BlockRendererProps {
  blocks: Block[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        let settings: any = {};
        try { settings = JSON.parse(block.settings); } catch {}
        const paddingMap: Record<string, string> = { sm: "py-3 px-4", md: "py-5 px-0", lg: "py-8 px-0", none: "p-0" };
        const padding = paddingMap[settings.padding || "md"] || "py-5 px-0";
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
    </div>
  );
}
