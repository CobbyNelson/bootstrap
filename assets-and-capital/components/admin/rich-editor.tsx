"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered,
  Link2, Quote, Image as ImageIcon, Undo2, Redo2, Eraser, Pilcrow,
} from "lucide-react";
import { MediaPickerModal, type MediaAssetDTO } from "./media-library";
import { cn } from "@/lib/utils";

/**
 * Classic-style rich text editor.
 *
 * Built on contenteditable + document.execCommand. execCommand is formally
 * deprecated, and that is a trade-off taken knowingly: it is still implemented
 * in every browser, it gives native undo/redo and selection handling for free,
 * and the alternative is a 100KB+ editor framework or hand-writing selection
 * maths. For a few staff writing marketing posts, the dependency and the bug
 * surface are the larger cost.
 *
 * The markup this produces is NOT trusted. It is sanitised server-side against
 * an allowlist before storage (lib/sanitize.ts) — this component's job is
 * authoring comfort, not security.
 */

type Cmd = { icon: typeof Bold; label: string; run: () => void; state?: string };

/** Serialise the editable area without reaching for innerHTML. */
function serialize(el: HTMLElement): string {
  return [...el.childNodes]
    .map((n) => (n instanceof Element ? n.outerHTML : n.textContent ?? ""))
    .join("");
}

/**
 * Replace the editable area's content.
 *
 * DOMParser rather than an innerHTML assignment: parseFromString builds an
 * inert document, so nothing in the markup can run during parsing, and
 * replaceChildren swaps the nodes in one operation. The stored value is already
 * sanitised, so this is belt and braces — but it is the cheap kind.
 */
function setContent(el: HTMLElement, html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  el.replaceChildren(...Array.from(parsed.body.childNodes));
}

export function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const savedRange = useRef<Range | null>(null);

  /**
   * Seed the DOM when the value arrives from outside. The activeElement guard
   * matters: re-writing the nodes on every keystroke would drop the caret back
   * to the start and make typing impossible.
   */
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && serialize(el) !== value) {
      setContent(el, value);
    }
  }, [value]);

  const emit = useCallback(() => {
    if (ref.current) onChange(serialize(ref.current));
  }, [onChange]);

  /** Track which marks apply at the caret so the toolbar can show state. */
  const syncActive = useCallback(() => {
    if (typeof document === "undefined") return;
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  }, []);

  const applyCmd = useCallback(
    (command: string, arg?: string) => {
      ref.current?.focus();
      document.execCommand(command, false, arg);
      emit();
      syncActive();
    },
    [emit, syncActive]
  );

  /**
   * Opening the media modal moves focus out of the editable area, which drops
   * the selection — so the insertion point is remembered first and restored
   * before inserting.
   */
  function rememberSelection() {
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
  }

  function restoreSelection() {
    const range = savedRange.current;
    if (!range) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  function insertImage(asset: MediaAssetDTO) {
    ref.current?.focus();
    restoreSelection();
    // A figure, so a caption can follow. alt comes from the library record —
    // set once there rather than retyped at every insertion.
    const html =
      `<figure><img src="${asset.url}" alt="${escapeAttr(asset.alt)}" ` +
      `width="${asset.width}" height="${asset.height}" /></figure><p><br /></p>`;
    document.execCommand("insertHTML", false, html);
    emit();
  }

  function addLink() {
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    if (!/^https?:\/\/|^mailto:|^\//i.test(url)) {
      window.alert("Use an https:// address, a mailto: link, or a path starting with /");
      return;
    }
    applyCmd("createLink", url);
  }

  const groups: Cmd[][] = [
    [
      { icon: Bold, label: "Bold", run: () => applyCmd("bold"), state: "bold" },
      { icon: Italic, label: "Italic", run: () => applyCmd("italic"), state: "italic" },
      { icon: Underline, label: "Underline", run: () => applyCmd("underline"), state: "underline" },
    ],
    [
      { icon: Heading2, label: "Heading", run: () => applyCmd("formatBlock", "<h2>") },
      { icon: Heading3, label: "Subheading", run: () => applyCmd("formatBlock", "<h3>") },
      { icon: Quote, label: "Quote", run: () => applyCmd("formatBlock", "<blockquote>") },
      { icon: Pilcrow, label: "Paragraph", run: () => applyCmd("formatBlock", "<p>") },
    ],
    [
      { icon: List, label: "Bulleted list", run: () => applyCmd("insertUnorderedList"), state: "insertUnorderedList" },
      { icon: ListOrdered, label: "Numbered list", run: () => applyCmd("insertOrderedList"), state: "insertOrderedList" },
    ],
    [
      { icon: Link2, label: "Insert link", run: addLink },
      {
        icon: ImageIcon,
        label: "Insert image",
        run: () => {
          rememberSelection();
          setPickerOpen(true);
        },
      },
    ],
    [
      { icon: Undo2, label: "Undo", run: () => applyCmd("undo") },
      { icon: Redo2, label: "Redo", run: () => applyCmd("redo") },
      { icon: Eraser, label: "Clear formatting", run: () => applyCmd("removeFormat") },
    ],
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-ink/12 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-ink/[0.08] bg-paper-2/60 p-2">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <span className="mx-1 h-5 w-px bg-ink/10" aria-hidden />}
            {group.map((c) => (
              <button
                key={c.label}
                type="button"
                title={c.label}
                aria-label={c.label}
                aria-pressed={c.state ? !!active[c.state] : undefined}
                // onMouseDown, not onClick: clicking a button blurs the editable
                // area and collapses the selection before the command can run.
                onMouseDown={(e) => {
                  e.preventDefault();
                  c.run();
                }}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg text-ink/70 transition-colors hover:bg-white hover:text-ink",
                  c.state && active[c.state] && "bg-ink text-white hover:bg-ink hover:text-white"
                )}
              >
                <c.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article body"
        onInput={emit}
        onBlur={emit}
        onKeyUp={syncActive}
        onMouseUp={syncActive}
        // Paste as plain text. Pasting from Word or a web page otherwise drags
        // in fonts, colours and tracking spans the sanitiser strips anyway —
        // better never to create the gap between what the author sees and what
        // actually gets stored.
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          emit();
        }}
        className="prose-editor min-h-[26rem] px-5 py-4 text-[0.95rem] leading-relaxed text-ink outline-none"
      />

      <MediaPickerModal
        open={pickerOpen}
        folder="insights"
        onPick={insertImage}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
