"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Music, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FileUploadProps {
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete?: (result: { url: string; path: string; metadata?: any }) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  currentValue?: string;
}

export function FileUpload({
  folder = "general/",
  accept = "image/*",
  maxSize = 10,
  onUploadComplete,
  onUploadError,
  className = "",
  currentValue,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentValue || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = accept.startsWith("image");

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > maxSize * 1024 * 1024) {
      const err = `File size exceeds ${maxSize}MB limit`;
      setError(err);
      onUploadError?.(err);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setPreview(data.url);
        onUploadComplete?.({
          url: data.url,
          path: data.path,
          metadata: data.metadata,
        });
      } else {
        setError(data.message || "Upload failed");
        onUploadError?.(data.message || "Upload failed");
      }
    } catch (err: any) {
      const errMsg = err.message || "Upload failed";
      setError(errMsg);
      onUploadError?.(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeFile = async () => {
    if (preview) {
      await fetch(`/api/upload?path=${encodeURIComponent(preview)}`, {
        method: "DELETE",
      });
    }
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={className}>
      {preview && isImage ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={removeFile}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Uploaded
            </span>
          </div>
        </div>
      ) : preview && !isImage ? (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">File uploaded</p>
              <p className="text-xs text-slate-500">{preview.split("/").pop()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Success
            </span>
            <button
              type="button"
              onClick={removeFile}
              className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />

          {uploading ? (
            <div className="py-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-slate-600">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                {isImage ? (
                  <ImageIcon className="h-6 w-6 text-slate-400" />
                ) : accept.includes("audio") ? (
                  <Music className="h-6 w-6 text-slate-400" />
                ) : (
                  <Upload className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                Drop file here or click to upload
              </p>
              <p className="text-xs text-slate-500">
                Max {maxSize}MB • {accept.replace("/*", "").replace(".", "") || "All files"}
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
