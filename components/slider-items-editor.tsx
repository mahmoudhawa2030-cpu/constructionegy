"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import { uploadSliderImageAction } from "@/lib/homepage/slider-upload-action";

export interface SliderItem {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  link?: string;
  backgroundColor?: string;
}

interface Props {
  items: SliderItem[];
  onChange: (items: SliderItem[]) => void;
}

export function SliderItemsEditor({ items, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--admin-text)]">
          Slides ({items.length})
        </label>
        <button
          type="button"
          onClick={() => {
            const newItem: SliderItem = {
              id: `slide_${Date.now()}`,
              image: "",
              title: "",
              subtitle: "",
              link: "",
              backgroundColor: "#ffffff",
            };
            onChange([...items, newItem]);
          }}
          className="rounded-sm border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
        >
          + Add Slide
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-sm border border-dashed border-[var(--admin-cell-border)] bg-gray-50 p-6 text-center text-sm text-gray-500">
          No slides yet. Click &quot;+ Add Slide&quot; to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <SlideCard
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              onUpdate={(updated) => {
                const next = [...items];
                next[index] = updated;
                onChange(next);
              }}
              onRemove={() => {
                onChange(items.filter((_, i) => i !== index));
              }}
              onMoveUp={() => {
                if (index === 0) return;
                const next = [...items];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                onChange(next);
              }}
              onMoveDown={() => {
                if (index === items.length - 1) return;
                const next = [...items];
                [next[index + 1], next[index]] = [next[index], next[index + 1]];
                onChange(next);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SlideCard({
  item,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  item: SliderItem;
  index: number;
  total: number;
  onUpdate: (item: SliderItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadSliderImageAction(formData);
    setUploading(false);

    if (result.ok) {
      onUpdate({ ...item, image: result.url });
    } else {
      setUploadError(result.error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-sm border border-[var(--admin-cell-border)] bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--admin-text-secondary)]">
          Slide {index + 1}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded-sm border border-[var(--admin-cell-border)] bg-white px-2 py-0.5 text-xs hover:bg-gray-50 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded-sm border border-[var(--admin-cell-border)] bg-white px-2 py-0.5 text-xs hover:bg-gray-50 disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-sm border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-600 hover:bg-red-100"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[160px_1fr]">
        {/* Image preview & upload */}
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-[var(--admin-cell-border)] bg-gray-100">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title || `Slide ${index + 1}`}
                fill
                className="object-cover"
                sizes="160px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                No image
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 w-full rounded-sm border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : item.image ? "Change Image" : "Upload Image"}
          </button>
          {uploadError && (
            <p className="mt-1 text-xs text-red-600">{uploadError}</p>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-[var(--admin-text)] mb-0.5">
              Title
            </label>
            <input
              type="text"
              value={item.title || ""}
              onChange={(e) => onUpdate({ ...item, title: e.target.value })}
              className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-white px-2 py-1 text-sm"
              placeholder="Slide title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--admin-text)] mb-0.5">
              Subtitle
            </label>
            <input
              type="text"
              value={item.subtitle || ""}
              onChange={(e) => onUpdate({ ...item, subtitle: e.target.value })}
              className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-white px-2 py-1 text-sm"
              placeholder="Slide subtitle"
            />
          </div>
          <div className="grid grid-cols-[1fr_70px] gap-2">
            <div>
              <label className="block text-xs font-medium text-[var(--admin-text)] mb-0.5">
                Link
              </label>
              <input
                type="text"
                value={item.link || ""}
                onChange={(e) => onUpdate({ ...item, link: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-white px-2 py-1 text-sm"
                placeholder="/gallery"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--admin-text)] mb-0.5">
                BG Color
              </label>
              <input
                type="color"
                value={item.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  onUpdate({ ...item, backgroundColor: e.target.value })
                }
                className="h-7 w-full rounded-sm border border-[var(--admin-cell-border)] bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
