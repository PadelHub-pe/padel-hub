"use client";

import { useState } from "react";

import { cn } from "@wifo/ui";

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function RetryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

export interface ImagePreviewProps {
  src: string;
  alt?: string;
  isUploading?: boolean;
  progress?: number;
  hasError?: boolean;
  errorMessage?: string;
  onDelete?: () => void;
  onRetry?: () => void;
  aspectRatio?: string;
  className?: string;
}

export function ImagePreview({
  src,
  alt = "",
  isUploading,
  progress = 0,
  hasError,
  errorMessage,
  onDelete,
  onRetry,
  aspectRatio = "3/2",
  className,
}: ImagePreviewProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete?.();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  }

  function handleMouseLeave() {
    setConfirmDelete(false);
  }

  return (
    <div
      className={cn(
        "group border-border bg-muted relative overflow-hidden rounded-lg border",
        className,
      )}
      style={{ aspectRatio }}
      onMouseLeave={handleMouseLeave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URLs and Cloudflare-optimized images don't benefit from next/image */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-opacity",
          (isUploading === true || hasError === true) && "opacity-50",
        )}
      />

      {/* Upload progress overlay */}
      {isUploading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <SpinnerIcon className="mb-2 h-6 w-6 animate-spin text-white" />
          <div className="mx-4 h-1.5 w-3/4 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="mt-1 text-xs text-white">{progress}%</span>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/50">
          <p className="mb-2 text-xs text-white">
            {errorMessage ?? "Error al subir"}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="flex items-center gap-1 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-white"
            >
              <RetryIcon className="h-3 w-3" />
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* Delete overlay (hover) */}
      {!isUploading && !hasError && onDelete && (
        <div className="absolute inset-0 flex items-start justify-end bg-black/0 p-1.5 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleDeleteClick}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white transition-colors",
              confirmDelete
                ? "bg-red-600 hover:bg-red-700"
                : "bg-black/50 hover:bg-black/70",
            )}
          >
            <TrashIcon className="h-3 w-3" />
            {confirmDelete ? "Confirmar" : "Eliminar"}
          </button>
        </div>
      )}
    </div>
  );
}
