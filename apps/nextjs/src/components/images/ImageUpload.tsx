"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import type { EntityType, ImageVariant } from "@wifo/images";
import { LIMITS } from "@wifo/images";
import { cn } from "@wifo/ui";
import { toast } from "@wifo/ui/toast";

import { env } from "~/env";
import { useTRPC } from "~/trpc/react";
import { ImageGallery } from "./ImageGallery";
import { ImagePreview } from "./ImagePreview";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ImagePlusIcon({ className }: { className?: string }) {
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
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
      <line x1="16" x2="22" y1="5" y2="5" />
      <line x1="19" x2="19" y1="2" y2="8" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageUploadProps {
  entityType: EntityType;
  entityId: string;
  mode: "single" | "gallery";
  value: string[];
  onChange: (ids: string[]) => void;
  maxImages?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  variant?: ImageVariant;
  aspectRatio?: string;
  placeholder?: string;
  className?: string;
}

interface UploadingFile {
  tempId: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "confirming" | "error";
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildImageUrl(imageId: string, variant: ImageVariant): string {
  if (imageId.startsWith("http")) return imageId;
  return `https://imagedelivery.net/${env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH}/${imageId}/${variant}`;
}

function uploadToCloudflare(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Error ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Error de red")));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let tempIdCounter = 0;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImageUpload({
  entityType,
  entityId,
  mode,
  value,
  onChange,
  maxImages,
  maxFileSize = LIMITS.maxFileSize,
  acceptedTypes = [...LIMITS.allowedTypes],
  variant = "thumbnail",
  aspectRatio = "3/2",
  placeholder,
  className,
}: ImageUploadProps) {
  const trpc = useTRPC();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const maxCount = maxImages ?? LIMITS.maxPhotos[entityType];
  const activeUploads = uploading.filter((u) => u.status !== "error").length;
  const totalCount = value.length + activeUploads;
  const canUpload = mode === "single" || totalCount < maxCount;

  const getUploadUrl = useMutation(trpc.images.getUploadUrl.mutationOptions());
  const confirmUpload = useMutation(
    trpc.images.confirmUpload.mutationOptions(),
  );
  const deleteMutation = useMutation(trpc.images.delete.mutationOptions());
  const reorderMutation = useMutation(trpc.images.reorder.mutationOptions());

  // -------------------------------------------------------------------------
  // Upload logic
  // -------------------------------------------------------------------------

  const updateUploadState = useCallback(
    (tempId: string, updates: Partial<UploadingFile>) => {
      setUploading((prev) =>
        prev.map((u) => (u.tempId === tempId ? { ...u, ...updates } : u)),
      );
    },
    [],
  );

  const removeUploadState = useCallback((tempId: string) => {
    setUploading((prev) => {
      const item = prev.find((u) => u.tempId === tempId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((u) => u.tempId !== tempId);
    });
  }, []);

  const processFile = useCallback(
    async (file: File, tempId: string) => {
      try {
        // 1. Get upload URL from backend
        const { uploadUrl, imageId } = await getUploadUrl.mutateAsync({
          entityType,
          entityId,
        });

        // 2. Upload to Cloudflare
        await uploadToCloudflare(uploadUrl, file, (pct) =>
          updateUploadState(tempId, { progress: pct }),
        );

        // 3. Confirm upload
        updateUploadState(tempId, { status: "confirming", progress: 100 });
        await confirmUpload.mutateAsync({
          entityType,
          entityId,
          imageId,
        });

        // 4. Success — update parent value
        removeUploadState(tempId);
        if (mode === "single") {
          onChange([imageId]);
        } else {
          onChange([...value, imageId]);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        updateUploadState(tempId, { status: "error", error: message });
      }
    },
    [
      entityType,
      entityId,
      mode,
      value,
      onChange,
      getUploadUrl,
      confirmUpload,
      updateUploadState,
      removeUploadState,
    ],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        // Validate type
        if (!acceptedTypes.includes(file.type)) {
          toast.error(
            `Tipo de archivo no soportado: ${file.type.split("/")[1] ?? file.type}`,
          );
          continue;
        }
        // Validate size
        if (file.size > maxFileSize) {
          toast.error(
            `Archivo muy grande (${formatFileSize(file.size)}). Maximo: ${formatFileSize(maxFileSize)}`,
          );
          continue;
        }
        // Check count limit (gallery mode)
        if (mode === "gallery") {
          const currentTotal =
            value.length + uploading.filter((u) => u.status !== "error").length;
          if (currentTotal >= maxCount) {
            toast.error(`Maximo ${maxCount} fotos permitidas`);
            break;
          }
        }

        const tempId = `temp-${++tempIdCounter}`;
        const previewUrl = URL.createObjectURL(file);

        setUploading((prev) => [
          ...prev,
          {
            tempId,
            file,
            previewUrl,
            progress: 0,
            status: "uploading",
          },
        ]);

        void processFile(file, tempId);
      }
    },
    [
      acceptedTypes,
      maxFileSize,
      maxCount,
      mode,
      value.length,
      uploading,
      processFile,
    ],
  );

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (canUpload) setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (!canUpload) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) handleFiles(files);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleZoneClick() {
    if (canUpload) inputRef.current?.click();
  }

  // -------------------------------------------------------------------------
  // Delete & reorder
  // -------------------------------------------------------------------------

  function handleDelete(imageId: string) {
    // Check if it's a temp upload (error state)
    const tempItem = uploading.find((u) => u.tempId === imageId);
    if (tempItem) {
      removeUploadState(imageId);
      return;
    }

    const newValue = value.filter((id) => id !== imageId);
    onChange(newValue);
    void deleteMutation.mutateAsync({ entityType, entityId, imageId });
  }

  function handleRetry(tempId: string) {
    const item = uploading.find((u) => u.tempId === tempId);
    if (!item) return;
    updateUploadState(tempId, {
      status: "uploading",
      progress: 0,
      error: undefined,
    });
    void processFile(item.file, tempId);
  }

  function handleReorder(newIds: string[]) {
    onChange(newIds);
    void reorderMutation.mutateAsync({
      entityType,
      entityId,
      imageIds: newIds,
    });
  }

  // -------------------------------------------------------------------------
  // Build gallery items
  // -------------------------------------------------------------------------

  const galleryItems = [
    ...value.map((id) => ({
      id,
      src: buildImageUrl(id, variant),
    })),
    ...uploading.map((u) => ({
      id: u.tempId,
      src: u.previewUrl,
      isUploading: u.status !== "error",
      progress: u.progress,
      hasError: u.status === "error",
      errorMessage: u.error,
    })),
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const dropZone = (
    <div
      role="button"
      tabIndex={0}
      onClick={handleZoneClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleZoneClick();
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        dragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        !canUpload && "pointer-events-none opacity-40",
      )}
      style={{ aspectRatio: mode === "single" ? aspectRatio : undefined }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        multiple={mode === "gallery"}
        onChange={handleInputChange}
        className="hidden"
      />
      {dragOver ? (
        <>
          <UploadIcon className="text-primary mb-2 h-8 w-8" />
          <span className="text-primary text-sm font-medium">
            Suelta para subir
          </span>
        </>
      ) : (
        <>
          <ImagePlusIcon className="text-muted-foreground mb-2 h-8 w-8" />
          <span className="text-muted-foreground text-sm">
            {placeholder ?? "Arrastra o haz clic para subir"}
          </span>
          <span className="text-muted-foreground/70 mt-1 text-xs">
            JPG, PNG, WebP, GIF &middot; Max {formatFileSize(maxFileSize)}
          </span>
        </>
      )}
    </div>
  );

  // -- Single mode --
  if (mode === "single") {
    const existingId = value[0];
    const uploadingItem = uploading[0];

    // Show current image (uploaded or uploading)
    if (existingId && !uploadingItem) {
      return (
        <div
          className={cn("relative", className)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <ImagePreview
            src={buildImageUrl(existingId, variant)}
            onDelete={() => handleDelete(existingId)}
            aspectRatio={aspectRatio}
          />
          {dragOver && (
            <div className="border-primary bg-primary/10 absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed">
              <span className="text-primary text-sm font-medium">
                Suelta para reemplazar
              </span>
            </div>
          )}
        </div>
      );
    }

    if (uploadingItem) {
      return (
        <div className={className}>
          <ImagePreview
            src={uploadingItem.previewUrl}
            isUploading={uploadingItem.status !== "error"}
            progress={uploadingItem.progress}
            hasError={uploadingItem.status === "error"}
            errorMessage={uploadingItem.error}
            onRetry={() => handleRetry(uploadingItem.tempId)}
            aspectRatio={aspectRatio}
          />
        </div>
      );
    }

    return <div className={className}>{dropZone}</div>;
  }

  // -- Gallery mode --
  return (
    <div className={cn("space-y-3", className)}>
      {/* Photo count */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {value.length}/{maxCount} fotos
        </span>
      </div>

      {/* Gallery grid */}
      {galleryItems.length > 0 && (
        <ImageGallery
          items={galleryItems}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onRetry={handleRetry}
          aspectRatio={aspectRatio}
        />
      )}

      {/* Drop zone (hidden when max reached) */}
      {canUpload && <div className="min-h-[120px]">{dropZone}</div>}
    </div>
  );
}
