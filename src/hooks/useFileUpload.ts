"use client";

import { useState } from "react";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();

    setUploading(false);

    return data;
  };

  return { uploadFile, uploading };
}