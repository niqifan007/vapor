import { useEffect, useRef } from "react";
import type Vditor from "vditor";

interface VditorEditorProps {
  id?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const URL_ATTRS = new Set(["href", "src", "xlink:href", "formaction"]);
const BLOCKED_TAGS = ["script", "iframe", "object", "embed", "link", "meta", "base"];
const DANGEROUS_PROTOCOL = /^\s*(?:javascript|vbscript):/i;
const VDITOR_LOCAL_CDN = "/vditor";
const MOBILE_MEDIA_QUERY = "(max-width: 768px)";

const DESKTOP_TOOLBAR = [
  "headings",
  "bold",
  "italic",
  "strike",
  "|",
  "list",
  "ordered-list",
  "check",
  "|",
  "quote",
  "code",
  "inline-code",
  "link",
  "table",
  "|",
  "undo",
  "redo",
  "|",
  "fullscreen",
] as const;

const MOBILE_TOOLBAR = [
  "bold",
  "italic",
  "strike",
  "|",
  "list",
  "ordered-list",
  "check",
  "|",
  "quote",
  "code",
  "link",
  "|",
  "undo",
  "redo",
] as const;

function hardenRenderedHtml(html: string): string {
  if (typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  for (const tagName of BLOCKED_TAGS) {
    template.content.querySelectorAll(tagName).forEach((element) => {
      element.remove();
    });
  }

  template.content.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (URL_ATTRS.has(name) && DANGEROUS_PROTOCOL.test(value)) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return template.innerHTML;
}

export function VditorEditor({
  id = "vditor",
  defaultValue = "",
  onChange,
  placeholder,
  minHeight = 200,
}: VditorEditorProps) {
  const editorRef = useRef<Vditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;
    const isMobileViewport = window.matchMedia(MOBILE_MEDIA_QUERY).matches;

    import("vditor").then((mod) => {
      if (destroyed || !containerRef.current) return;

      const VditorClass = mod.default;
      editorRef.current = new VditorClass(containerRef.current!, {
        cdn: VDITOR_LOCAL_CDN,
        value: defaultValue,
        placeholder,
        minHeight,
        mode: "ir",
        theme: "dark",
        icon: "ant",
        toolbar: isMobileViewport ? [...MOBILE_TOOLBAR] : [...DESKTOP_TOOLBAR],
        toolbarConfig: { pin: !isMobileViewport },
        counter: { enable: true, max: 50000, type: "text" },
        cache: { enable: false },
        preview: {
          theme: { current: "dark" },
          hljs: { style: "native" },
          markdown: { autoSpace: true, sanitize: true },
          transform: hardenRenderedHtml,
        },
        input: (value) => {
          onChange?.(value);
        },
        after: () => {
          if (!isMobileViewport) {
            editorRef.current?.focus();
          }
        },
      });
    });

    return () => {
      destroyed = true;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  return <div id={id} ref={containerRef} className="vditor-steampunk" />;
}

/**
 * Renders markdown content using Vditor's static preview method.
 */
export function VditorPreview({
  markdown,
  id = "vditor-preview",
}: {
  markdown: string;
  id?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    import("vditor/dist/method.min").then((VditorPreview) => {
      if (!containerRef.current) return;
      VditorPreview.default.preview(containerRef.current, markdown, {
        cdn: VDITOR_LOCAL_CDN,
        mode: "dark",
        hljs: { style: "native", lineNumber: true },
        theme: { current: "dark" },
        markdown: { autoSpace: true, sanitize: true },
        transform: hardenRenderedHtml,
      });
    });
  }, [markdown]);

  return (
    <div
      id={id}
      ref={containerRef}
      className="vditor-steampunk-preview"
    />
  );
}
