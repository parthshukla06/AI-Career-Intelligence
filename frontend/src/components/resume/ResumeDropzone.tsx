import { useCallback, useRef, useState } from "react";
import { CloudUpload, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Must match backend: multer limit = 5 * 1024 * 1024 bytes
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_SIZE_LABEL = "5 MB";

export interface DropzoneFile {
  file: File;
  error: string | null;
}

interface ResumeDropzoneProps {
  /** Called when a valid PDF is confirmed and the user triggers upload */
  onUpload: (file: File) => void;
  /** 0–100 progress while uploading, undefined when idle */
  uploadProgress?: number;
  /** Whether an upload is currently in flight */
  isUploading: boolean;
  /** An error message to display from the server (after attempted upload) */
  serverError?: string | null;
}

function validateFile(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files are accepted.";
  if (file.size > MAX_SIZE_BYTES)
    return `File is too large. Maximum size is ${MAX_SIZE_LABEL}.`;
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ResumeDropzone({
  onUpload,
  uploadProgress,
  isUploading,
  serverError,
}: ResumeDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DropzoneFile | null>(null);

  // ── drag handlers ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile({ file, error: validateFile(file) });
  }, []);

  // ── click-to-browse ─────────────────────────────────────────────────────────
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile({ file, error: validateFile(file) });
      // Reset input so the same file can be re-selected after clearing
      e.target.value = "";
    },
    [],
  );

  const handleClear = () => {
    setSelectedFile(null);
  };

  const handleUploadClick = () => {
    if (selectedFile && !selectedFile.error) {
      onUpload(selectedFile.file);
    }
  };

  const isDisabled = isUploading;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label="Upload resume PDF"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isDisabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isDisabled)
            inputRef.current?.click();
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/40",
          isDisabled && "pointer-events-none opacity-60",
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={handleInputChange}
          disabled={isDisabled}
          aria-hidden="true"
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CloudUpload className="h-7 w-7 text-primary" />
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">
            {dragging ? "Drop your resume here" : "Drag & drop your resume"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or{" "}
            <span className="font-medium text-primary underline-offset-2 hover:underline">
              click to browse
            </span>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          PDF only · Maximum {MAX_SIZE_LABEL}
        </p>
      </div>

      {/* Selected file preview */}
      {selectedFile && !isUploading && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3",
            selectedFile.error
              ? "border-destructive/50 bg-destructive/5"
              : "border-border bg-muted/30",
          )}
        >
          <FileText
            className={cn(
              "h-5 w-5 shrink-0",
              selectedFile.error ? "text-destructive" : "text-primary",
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {selectedFile.file.name}
            </p>
            {selectedFile.error ? (
              <p className="text-xs text-destructive">{selectedFile.error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {formatBytes(selectedFile.file.size)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remove selected file"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <p className="text-sm font-medium text-foreground">
              {uploadProgress !== undefined && uploadProgress < 100
                ? "Uploading…"
                : "Analysing your resume with AI…"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-all duration-300",
                uploadProgress === 100 ? "animate-pulse" : "",
              )}
              style={{
                width: `${uploadProgress !== undefined ? uploadProgress : 10}%`,
              }}
            />
          </div>

          {uploadProgress !== undefined && (
            <p className="text-xs text-muted-foreground text-right">
              {uploadProgress < 100
                ? `${uploadProgress}% uploaded`
                : "Processing…"}
            </p>
          )}
        </div>
      )}

      {/* Server error */}
      {serverError && !isUploading && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* Upload button — only shown when a valid file is selected and not uploading */}
      {selectedFile && !selectedFile.error && !isUploading && (
        <Button className="w-full" onClick={handleUploadClick}>
          <CloudUpload className="mr-2 h-4 w-4" />
          Analyse resume
        </Button>
      )}
    </div>
  );
}
