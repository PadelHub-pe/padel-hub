"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

import { cn } from "@wifo/ui";

import { getClientImageSrcSet, getClientImageUrl } from "~/lib/image-url";

interface PhotoCarouselProps {
  photos: string[];
  facilityName: string;
}

export function PhotoCarousel({ photos, facilityName }: PhotoCarouselProps) {
  const firstPhoto = photos[0];
  if (!firstPhoto) return null;

  // Single photo — no carousel needed
  if (photos.length === 1) {
    return (
      <div className="relative -mx-4 aspect-[4/3] overflow-hidden rounded-b-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getClientImageUrl(firstPhoto, "gallery")}
          srcSet={getClientImageSrcSet(firstPhoto)}
          alt={facilityName}
          className="absolute inset-0 size-full object-cover"
          sizes="(max-width: 480px) 100vw, 480px"
        />
      </div>
    );
  }

  return <MultiPhotoCarousel photos={photos} facilityName={facilityName} />;
}

/** Separate component so the hook is always called unconditionally */
function MultiPhotoCarousel({ photos, facilityName }: PhotoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Initialize dot count from photo length (1:1 with 100% width slides)
  const dotCount = photos.length;
  const dots = useMemo(
    () => Array.from({ length: dotCount }, (_, i) => i),
    [dotCount],
  );

  const handleSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", handleSelect);
    emblaApi.on("reInit", handleSelect);
    return () => {
      emblaApi.off("select", handleSelect);
      emblaApi.off("reInit", handleSelect);
    };
  }, [emblaApi, handleSelect]);

  return (
    <div className="relative -mx-4 overflow-hidden rounded-b-2xl">
      {/* Carousel viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {photos.map((photo, index) => (
            <div key={photo} className="min-w-0 flex-[0_0_100%]">
              <div className="relative aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getClientImageUrl(photo, "gallery")}
                  srcSet={getClientImageSrcSet(photo)}
                  alt={`${facilityName} - Foto ${index + 1}`}
                  className="absolute inset-0 size-full object-cover"
                  sizes="(max-width: 480px) 100vw, 480px"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {dots.map((index) => (
          <button
            key={index}
            type="button"
            className={cn(
              "size-2 rounded-full transition-all",
              selectedIndex === index ? "scale-110 bg-white" : "bg-white/50",
            )}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Ir a foto ${index + 1}`}
          />
        ))}
      </div>

      {/* Photo counter */}
      <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
        {selectedIndex + 1}/{photos.length}
      </div>
    </div>
  );
}
