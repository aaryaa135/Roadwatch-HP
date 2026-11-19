import { useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { uploadImage } from "../../services/api";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "../../utils/constants";
import { InlineError } from "../ui/States";

export function ImageUploader({
  value,
  onChange,
  maxFiles = 3,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");

  const pickFiles = () => inputRef.current?.click();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError("");
    const files = Array.from(fileList);
    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${maxFiles} photographs.`);
      return;
    }
    const selected = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(
        `Only ${remaining} more photograph${remaining === 1 ? "" : "s"} can be attached.`
      );
    }
    for (const file of selected) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError("Use a JPEG, PNG, or WebP image.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("Each photograph must be 10 MB or smaller.");
        return;
      }
    }

    setUploading(true);
    setProgress({ current: 0, total: selected.length });
    const uploaded: string[] = [];
    try {
      for (let index = 0; index < selected.length; index += 1) {
        setProgress({ current: index + 1, total: selected.length });
        const result = await uploadImage(selected[index]);
        uploaded.push(result.url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The photograph could not be uploaded."
      );
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0 });
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {error && <InlineError>{error}</InlineError>}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface"
            >
              <img
                src={url}
                alt={`Attached hazard photograph ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== url))}
                className="absolute right-1.5 top-1.5 rounded-full bg-charcoal-900/80 p-1 text-white opacity-0 transition-opacity hover:bg-charcoal-900 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={`Remove photograph ${index + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-charcoal-900/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {value.length < maxFiles && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-7 text-center transition-colors ${
            dragging
              ? "border-brand-500 bg-brand-50"
              : "border-line bg-surface/60 hover:border-brand-300"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-brand-700">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">
            {uploading
              ? `Uploading ${progress.current} of ${progress.total}…`
              : "Drop a photograph here"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            JPEG, PNG or WebP · up to 10 MB · {value.length}/{maxFiles} attached
          </p>
          <button
            type="button"
            onClick={pickFiles}
            disabled={uploading}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface disabled:opacity-50"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            multiple={maxFiles > 1}
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>
      )}
    </div>
  );
}
