"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@wifo/ui/toast";

import { ImageUpload } from "~/components/images/ImageUpload";
import { useTRPC } from "~/trpc/react";
import { AmenityChips } from "./amenity-chips";

interface StepPhotosProps {
  facilityId: string;
}

export function StepPhotos({ facilityId }: StepPhotosProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: facility } = useQuery(
    trpc.facility.getProfile.queryOptions({ facilityId }),
  );

  const photos = facility?.photos ?? [];
  const amenities = facility?.amenities ?? [];

  const updateProfile = useMutation(
    trpc.facility.updateProfile.mutationOptions(),
  );

  const handlePhotosChange = useCallback(
    (newPhotos: string[]) => {
      queryClient.setQueryData(
        trpc.facility.getProfile.queryOptions({ facilityId }).queryKey,
        (old: typeof facility | undefined) =>
          old ? { ...old, photos: newPhotos } : old,
      );
    },
    [facilityId, queryClient, trpc],
  );

  const handleAmenitiesChange = useCallback(
    (newAmenities: string[]) => {
      // Optimistic update
      queryClient.setQueryData(
        trpc.facility.getProfile.queryOptions({ facilityId }).queryKey,
        (old: typeof facility | undefined) =>
          old ? { ...old, amenities: newAmenities } : old,
      );

      if (!facility) return;

      updateProfile.mutate(
        {
          facilityId,
          name: facility.name,
          phone: facility.phone,
          email: facility.email,
          website: facility.website,
          description: facility.description,
          address: facility.address,
          amenities: newAmenities,
        },
        {
          onSuccess: () => {
            toast.success("Amenidades actualizadas");
          },
          onError: () => {
            // Revert optimistic update
            void queryClient.invalidateQueries({
              queryKey: trpc.facility.getProfile.queryOptions({ facilityId })
                .queryKey,
            });
            toast.error("Error al guardar amenidades");
          },
        },
      );
    },
    [facilityId, facility, queryClient, trpc, updateProfile],
  );

  return (
    <div className="space-y-8">
      {/* Photos Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Fotos del Local</h3>
          <p className="mt-1 text-sm text-gray-500">
            Agrega fotos de tu local para que los jugadores puedan conocerlo. La
            primera foto se usará como portada.
          </p>
        </div>

        <ImageUpload
          entityType="facility"
          entityId={facilityId}
          mode="gallery"
          value={photos}
          onChange={handlePhotosChange}
        />

        {photos.length === 0 && (
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            Recomendamos subir al menos 3 fotos para atraer más jugadores a tu
            local.
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Amenities Section */}
      <AmenityChips value={amenities} onChange={handleAmenitiesChange} />
    </div>
  );
}
