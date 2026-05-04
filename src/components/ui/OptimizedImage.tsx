"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  fallback?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className = "",
  priority = false,
  sizes,
  objectFit = "cover",
  fallback,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine if it's an external URL
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 ${className}`}
        style={{
          width: fill ? "100%" : width || 200,
          height: fill ? "100%" : height || 200,
        }}
      >
        {fallback ? (
          <img src={fallback} alt={alt} className="object-cover w-full h-full" />
        ) : (
          <ImageIcon className="h-8 w-8 text-slate-400" />
        )}
      </div>
    );
  }

  // For external URLs, use regular img with lazy loading
  if (isExternal) {
    return (
      <div className={`relative ${className}`} style={{ width: fill ? "100%" : width, height: fill ? "100%" : height }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          onError={() => setError(true)}
          onLoad={() => setLoading(false)}
          className={`${objectFit === "contain" ? "object-contain" : objectFit === "fill" ? "object-fill" : "object-cover"} ${
            loading ? "opacity-0" : "opacity-100"
          } transition-opacity ${className}`}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    );
  }

  // For local images, use Next.js Image
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      priority={priority}
      sizes={sizes}
      onError={() => setError(true)}
      onLoad={() => setLoading(false)}
      className={`${objectFit === "contain" ? "object-contain" : objectFit === "fill" ? "object-fill" : "object-cover"} ${className}`}
    />
  );
}

// Simplified version for thumbnails
export function ProductThumbnail({
  src,
  alt,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <ImageIcon className="h-12 w-12 text-slate-400" />
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
