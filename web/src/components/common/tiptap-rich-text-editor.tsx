"use client";

import { type ChangeEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "../../../node_modules/@tiptap/extension-image/dist/index.js";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  RotateCcw,
  RotateCw,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MediaAsset } from "@/features/media/types";
import { cn } from "@/lib/utils";
import { normalizeRichTextHtml, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";

type TiptapRichTextEditorProps = {
  name: string;
  initialValue?: string | null;
  className?: string;
  onChange?: (value: string) => void;
};

type EditorMode = "visual" | "html";
type BlockType = "paragraph" | "h2" | "h3" | "h4";

const blockTypeOptions: Array<{ label: string; value: BlockType }> = [
  { label: "Paragraph", value: "paragraph" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
];

export function TiptapRichTextEditor({
  name,
  initialValue,
  className,
  onChange,
}: TiptapRichTextEditorProps) {
  const normalizedInitialValue = useMemo(
    () => normalizeRichTextHtml(initialValue || ""),
    [initialValue],
  );
  const [value, setValue] = useState(normalizedInitialValue);
  const [htmlValue, setHtmlValue] = useState(normalizedInitialValue);
  const [mode, setMode] = useState<EditorMode>("visual");
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [tablePickerSize, setTablePickerSize] = useState({ rows: 0, cols: 0 });
  const [, forceToolbarRefresh] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: normalizedInitialValue,
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = normalizeRichTextHtml(currentEditor.getHTML());
      setValue(nextValue);
      setHtmlValue(nextValue);
      onChange?.(nextValue);
    },
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[400px] rounded-b-lg border border-t-0 bg-background px-3 py-3 outline-none",
          RICH_TEXT_CONTENT_CLASSNAME,
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const refreshToolbar = () => {
      forceToolbarRefresh((current) => current + 1);
    };

    editor.on("selectionUpdate", refreshToolbar);
    editor.on("transaction", refreshToolbar);

    return () => {
      editor.off("selectionUpdate", refreshToolbar);
      editor.off("transaction", refreshToolbar);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      setValue(normalizedInitialValue);
      setHtmlValue(normalizedInitialValue);
      return;
    }

    if (editor.getHTML() !== normalizedInitialValue) {
      editor.commands.setContent(normalizedInitialValue || "<p></p>", { emitUpdate: true });
    } else {
      setValue(normalizedInitialValue);
      setHtmlValue(normalizedInitialValue);
    }
  }, [editor, normalizedInitialValue, onChange]);

  useEffect(() => {
    if (!isMediaOpen) {
      return;
    }

    let ignore = false;

    const fetchMedia = async () => {
      setLoading(true);

      try {
        const response = await fetch("/api/media?limit=50");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { items?: MediaAsset[] };
        if (!ignore) {
          setItems(data.items ?? []);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchMedia();

    return () => {
      ignore = true;
    };
  }, [isMediaOpen]);

  if (!editor) {
    return null;
  }

  const filteredItems = items.filter((item) =>
    item.originalName.toLowerCase().includes(search.toLowerCase()),
  );

  const currentBlockType = getCurrentBlockType(editor);

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl || "");

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const applyBlockType = (nextValue: BlockType) => {
    const chain = editor.chain().focus();

    if (nextValue === "paragraph") {
      chain.setParagraph().run();
      return;
    }

    const level = Number(nextValue.replace("h", ""));
    chain.toggleHeading({ level: level as 2 | 3 | 4 }).run();
  };

  const setModeAndSync = (nextMode: EditorMode) => {
    if (nextMode === mode) {
      return;
    }

    if (nextMode === "html") {
      setHtmlValue(value);
      setMode(nextMode);
      return;
    }

    const normalized = normalizeRichTextHtml(htmlValue);
    setValue(normalized);
    setHtmlValue(normalized);
    if (editor.getHTML() !== normalized) {
      editor.commands.setContent(normalized || "<p></p>", { emitUpdate: true });
    }
    setMode(nextMode);
  };

  const handleHtmlChange = (nextValue: string) => {
    setHtmlValue(nextValue);
    const normalized = normalizeRichTextHtml(nextValue);
    setValue(normalized);
    if (editor.getHTML() !== normalized) {
      editor.commands.setContent(normalized || "<p></p>", { emitUpdate: false });
    }
  };

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { item?: MediaAsset };
      if (data.item?.url) {
        insertImage(data.item.url, data.item.originalName);
        setItems((current) => [data.item as MediaAsset, ...current]);
      }
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  };

  const insertImage = (url: string, alt?: string) => {
    editor.chain().focus().setImage({ src: url, alt: alt || "" }).run();
    setIsMediaOpen(false);
  };

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setIsTablePickerOpen(false);
    setTablePickerSize({ rows: 0, cols: 0 });
  };

  const isInsideTable =
    editor.isActive("table") ||
    editor.isActive("tableRow") ||
    editor.isActive("tableCell") ||
    editor.isActive("tableHeader");

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-0">
        <div className="flex items-start justify-between gap-3 rounded-t-lg border bg-muted/30 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-8 min-w-34 rounded-lg border border-input bg-background px-2.5 pr-8 text-sm outline-none"
              value={currentBlockType}
              onChange={(event) => applyBlockType(event.target.value as BlockType)}
            >
              {blockTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().setParagraph().run()} active={currentBlockType === "paragraph"} title="Paragraph">
              <Pilcrow className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
              <Heading2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
              <Heading3 className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
              <Bold className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
              <Italic className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
              <UnderlineIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
              <Strikethrough className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
              <ListOrdered className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
              <Quote className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={setLink} active={editor.isActive("link")} title="Link">
              <LinkIcon className="size-4" />
            </ToolbarButton>

            <Dialog open={isMediaOpen} onOpenChange={setIsMediaOpen}>
              <DialogTrigger
                render={
                  <Button type="button" variant="outline">
                    <ImageIcon className="size-4" />
                    <span className="sr-only">Image</span>
                  </Button>
                }
              />
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Insert Image</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search media..."
                    />
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted">
                      {uploading ? "Uploading..." : "Upload"}
                      <input type="file" className="hidden" onChange={handleMediaUpload} />
                    </label>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto rounded-lg border p-3">
                    {loading ? (
                      <p className="text-sm text-muted-foreground">Loading media...</p>
                    ) : filteredItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No media found.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {filteredItems
                          .filter((item) => item.mimeType.startsWith("image/"))
                          .map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className="overflow-hidden rounded-lg border bg-background text-left transition-colors hover:bg-muted"
                              onClick={() => insertImage(item.url, item.originalName)}
                            >
                              <img
                                src={item.url}
                                alt={item.originalName}
                                className="aspect-square w-full object-cover"
                              />
                              <span className="block truncate px-2 py-2 text-xs">
                                {item.originalName}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div
              className="relative"
              onMouseEnter={() => setIsTablePickerOpen(true)}
              onMouseLeave={() => {
                setIsTablePickerOpen(false);
                setTablePickerSize({ rows: 0, cols: 0 });
              }}
            >
              <ToolbarButton
                editor={editor}
                onClick={() => setIsTablePickerOpen((current) => !current)}
                active={editor.isActive("table")}
                title="Table"
              >
                <Table2 className="size-4" />
              </ToolbarButton>

              {isTablePickerOpen ? (
                <>
                  <div className="absolute left-0 top-full z-10 h-2 w-56" />
                  <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border bg-background p-3 shadow-lg">
                  <div className="mb-2 text-sm font-medium">Insert table</div>
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 80 }, (_, index) => {
                      const row = Math.floor(index / 8) + 1;
                      const col = (index % 8) + 1;
                      const isActive = row <= tablePickerSize.rows && col <= tablePickerSize.cols;

                      return (
                        <button
                          key={`${row}-${col}`}
                          type="button"
                          className={cn(
                            "h-6 w-6 rounded-sm border transition-colors",
                            isActive ? "bg-muted" : "bg-background hover:bg-muted/50",
                          )}
                          onMouseEnter={() => setTablePickerSize({ rows: row, cols: col })}
                          onFocus={() => setTablePickerSize({ rows: row, cols: col })}
                          onClick={() => insertTable(row, col)}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {tablePickerSize.rows && tablePickerSize.cols
                      ? `${tablePickerSize.cols} x ${tablePickerSize.rows}`
                      : "Choose rows and columns"}
                  </div>
                  </div>
                </>
              ) : null}
            </div>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
              <Minus className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
              <AlignLeft className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
              <AlignCenter className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
              <AlignRight className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().undo().run()} title="Undo">
              <RotateCcw className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().redo().run()} title="Redo">
              <RotateCw className="size-4" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-2 border-l pl-2">
            <ToolbarButton editor={editor} onClick={() => setModeAndSync("visual")} active={mode === "visual"} title="Visual">
              <Eye className="size-4" />
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => setModeAndSync("html")} active={mode === "html"} title="HTML">
              <Code2 className="size-4" />
            </ToolbarButton>
          </div>
        </div>

        {mode === "visual" && isInsideTable ? (
          <div className="flex flex-wrap items-center gap-2 border-x border-b bg-muted/20 p-2">
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column before" className="h-7 px-2 text-xs">
              Add Col Before
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column after" className="h-7 px-2 text-xs">
              Add Col After
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row before" className="h-7 px-2 text-xs">
              Add Row Before
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row after" className="h-7 px-2 text-xs">
              Add Row After
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column" className="h-7 px-2 text-xs">
              Delete Col
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row" className="h-7 px-2 text-xs">
              Delete Row
            </ToolbarButton>
            <ToolbarButton editor={editor} onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table" className="h-7 px-2 text-xs">
              Delete Table
            </ToolbarButton>
          </div>
        ) : null}

        {mode === "visual" ? (
          <EditorContent editor={editor} />
        ) : (
          <textarea
            value={htmlValue}
            onChange={(event) => handleHtmlChange(event.target.value)}
            className="min-h-[400px] w-full rounded-b-lg border border-t-0 bg-background px-3 py-3 font-mono text-sm outline-none"
          />
        )}
      </div>

      <input type="hidden" name={name} value={value} />
    </div>
  );
}

function ToolbarButton({
  active = false,
  children,
  editor,
  onClick,
  title,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  editor: NonNullable<ReturnType<typeof useEditor>>;
  onClick: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      onClick={onClick}
      disabled={!editor.isEditable}
      title={title}
      className={className}
    >
      {children}
    </Button>
  );
}

function getCurrentBlockType(editor: NonNullable<ReturnType<typeof useEditor>>): BlockType {
  if (editor.isActive("heading", { level: 2 })) {
    return "h2";
  }

  if (editor.isActive("heading", { level: 3 })) {
    return "h3";
  }

  if (editor.isActive("heading", { level: 4 })) {
    return "h4";
  }

  return "paragraph";
}
