"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { useCallback } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@wifo/ui";

import { ImagePreview } from "./ImagePreview";

function GripIcon({ className }: { className?: string }) {
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
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

interface GalleryItem {
  id: string;
  src: string;
  isUploading?: boolean;
  progress?: number;
  hasError?: boolean;
  errorMessage?: string;
}

export interface ImageGalleryProps {
  items: GalleryItem[];
  onReorder: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onRetry?: (id: string) => void;
  aspectRatio?: string;
  className?: string;
}

function SortableItem({
  item,
  onDelete,
  onRetry,
  aspectRatio,
}: {
  item: GalleryItem;
  onDelete: (id: string) => void;
  onRetry?: (id: string) => void;
  aspectRatio?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: item.isUploading === true || item.hasError === true,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-10 opacity-70")}
    >
      {/* Drag handle */}
      {!item.isUploading && !item.hasError && (
        <button
          type="button"
          className="absolute top-1.5 left-1.5 z-10 cursor-grab rounded-md bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70 [div:hover>&]:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripIcon className="h-3.5 w-3.5" />
        </button>
      )}
      <ImagePreview
        src={item.src}
        isUploading={item.isUploading}
        progress={item.progress}
        hasError={item.hasError}
        errorMessage={item.errorMessage}
        onDelete={item.isUploading ? undefined : () => onDelete(item.id)}
        onRetry={item.hasError && onRetry ? () => onRetry(item.id) : undefined}
        aspectRatio={aspectRatio}
      />
    </div>
  );
}

export function ImageGallery({
  items,
  onReorder,
  onDelete,
  onRetry,
  aspectRatio = "3/2",
  className,
}: ImageGalleryProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const confirmedItems = items.filter((i) => !i.isUploading && !i.hasError);
      const oldIndex = confirmedItems.findIndex((i) => i.id === active.id);
      const newIndex = confirmedItems.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(confirmedItems, oldIndex, newIndex);
      onReorder(reordered.map((i) => i.id));
    },
    [items, onReorder],
  );

  const sortableIds = items
    .filter((i) => !i.isUploading && !i.hasError)
    .map((i) => i.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
        <div
          className={cn(
            "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
            className,
          )}
        >
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onDelete={onDelete}
              onRetry={onRetry}
              aspectRatio={aspectRatio}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
