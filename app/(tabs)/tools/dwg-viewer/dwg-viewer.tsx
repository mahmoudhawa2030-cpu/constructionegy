"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { FileUp, X, FileText, ZoomIn, ZoomOut, RotateCcw, Download, Loader2 } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";

interface ConversionResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
}

export default function DWGViewer() {
  const t = useTranslations("dwgViewer");
  
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".dwg")) {
      setError(t("invalidFileType"));
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError(t("fileTooLarge"));
      return;
    }
    setFile(selectedFile);
    setError(null);
    setResult(null);
  }, [t]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    
    setConverting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/dwg/convert", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t("conversionFailed"));
      }
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        throw new Error(data.error || t("conversionFailed"));
      }
    } catch (err) {
      console.error("Conversion error:", err);
      setError(err instanceof Error ? err.message : t("conversionFailed"));
    } finally {
      setConverting(false);
    }
  }, [file, t]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (result?.url) {
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [result]);

  return (
    <div className="flex flex-1 flex-col bg-[var(--bina-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--bina-border)] px-4 py-3">
        <h1 className="font-bina-display text-lg font-bold text-[var(--bina-text)]">{t("title")}</h1>
        {(file || result) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--bina-primary)] hover:bg-[var(--bina-primary)]/10"
          >
            <RotateCcw className="h-4 w-4" />
            {t("newFile")}
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        {!file && !result ? (
          /* Upload Area */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleBrowse}
            className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 transition-colors ${
              dragActive
                ? "border-[var(--bina-primary)] bg-[var(--bina-primary)]/5"
                : "border-[var(--bina-border)] hover:border-[var(--bina-primary)]/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".dwg"
              onChange={handleFileInput}
              className="hidden"
            />
            
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bina-primary)]/10">
              <FileUp className="h-10 w-10 text-[var(--bina-primary)]" />
            </div>
            
            <div className="text-center">
              <p className="font-semibold text-[var(--bina-text)]">{t("dragDrop")}</p>
              <p className="mt-1 text-sm text-[var(--bina-muted)]">{t("orBrowse")}</p>
              <p className="mt-2 text-xs text-[var(--bina-muted)]">{t("maxSize")}</p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowse();
              }}
              className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--bina-primary)] px-6 py-3 text-base font-semibold text-white shadow-lg active:scale-95 transition-transform"
            >
              <FileUp className="h-5 w-5" />
              {t("uploadFile")}
            </button>
          </div>
        ) : (
          /* File Selected or Result */
          <div className="flex flex-1 flex-col gap-4">
            {/* File Info Card */}
            <div className="flex items-center gap-4 rounded-xl border border-[var(--bina-border)] bg-white p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--bina-primary)]/10">
                <FileText className="h-6 w-6 text-[var(--bina-primary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--bina-text)]">{file?.name || result?.originalName}</p>
                <p className="text-sm text-[var(--bina-muted)]">
                  {file ? formatFileSize(file.size) : formatFileSize(result?.size || 0)}
                </p>
              </div>
              {!result && (
                <button
                  onClick={() => setFile(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bina-border)]"
                >
                  <X className="h-5 w-5 text-[var(--bina-muted)]" />
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-red-600">
                <p className="text-sm font-medium">{t("error")}</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* PDF Viewer */}
            {result ? (
              <div className="flex flex-1 flex-col gap-4">
                {/* Viewer Toolbar */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--bina-muted)]">{t("convertedToPDF")}</p>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 rounded-lg bg-[var(--bina-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--bina-primary)]/90"
                  >
                    <Download className="h-4 w-4" />
                    {t("download")}
                  </button>
                </div>
                
                {/* PDF Iframe */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-[var(--bina-border)] bg-white">
                  <iframe
                    src={result.url}
                    className="h-full w-full"
                    title={t("pdfViewer")}
                  />
                </div>
              </div>
            ) : (
              /* Convert Button */
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <button
                  onClick={handleConvert}
                  disabled={converting}
                  className="flex items-center gap-2 rounded-xl bg-[var(--bina-primary)] px-8 py-3 text-base font-semibold text-white hover:bg-[var(--bina-primary)]/90 disabled:opacity-50"
                >
                  {converting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t("converting")}
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      {t("convert")}
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-[var(--bina-muted)]">{t("conversionTime")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
