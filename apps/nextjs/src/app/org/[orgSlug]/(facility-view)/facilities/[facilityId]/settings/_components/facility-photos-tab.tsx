"use client";

import { useCallback } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { toast } from "@wifo/ui/toast";

import { ImageUpload } from "~/components/images/ImageUpload";
import { useTRPC } from "~/trpc/react";

interface FacilityPhotosTabProps {
  facilityId: string;
}

export function FacilityPhotosTab({ facilityId }: FacilityPhotosTabProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: facility } = useSuspenseQuery(
    trpc.facility.getProfile.queryOptions({ facilityId }),
  );

  const handleChange = useCallback(
    (newPhotos: string[]) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        trpc.facility.getProfile.queryOptions({ facilityId }).queryKey,
        (old: typeof facility | undefined) =>
          old ? { ...old, photos: newPhotos } : old,
      );
      toast.success("Fotos actualizadas");
    },
    [facilityId, queryClient, trpc],
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Fotos del Local</h2>
        <p className="mt-1 text-sm text-gray-500">
          Agrega fotos de tu local para que los jugadores puedan conocerlo. La
          primera foto se usara como portada.
        </p>
      </div>

      <ImageUpload
        entityType="facility"
        entityId={facilityId}
        mode="gallery"
        value={facility.photos}
        onChange={handleChange}
      />
    </div>
  );
}
