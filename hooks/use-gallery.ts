'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  galleryApi,
  type GalleryItem,
  type GalleryPaginatedResponse,
  type GalleryQueryParams,
  type UpdateMediaVisibilityRequest,
} from '@/lib/api-client';

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const galleryKeys = {
  all: ['gallery'] as const,
  // My content
  myMedia: (params?: GalleryQueryParams) =>
    [...galleryKeys.all, 'my-media', params] as const,
  myVideos: (params?: GalleryQueryParams) =>
    [...galleryKeys.all, 'my-videos', params] as const,
  myImages: (params?: GalleryQueryParams) =>
    [...galleryKeys.all, 'my-images', params] as const,
  // Public content
  public: (params?: GalleryQueryParams) =>
    [...galleryKeys.all, 'public', params] as const,
  featured: (limit?: number) =>
    [...galleryKeys.all, 'featured', limit] as const,
  trending: (limit?: number) =>
    [...galleryKeys.all, 'trending', limit] as const,
  // Single items
  video: (id: string) =>
    [...galleryKeys.all, 'video', id] as const,
  image: (id: string) =>
    [...galleryKeys.all, 'image', id] as const,
} as const;

// ============================================================================
// QUERY OPTIONS (for consistent configuration)
// ============================================================================

const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 10,   // 10 minutes (garbage collection)
  retry: 2,
  refetchOnWindowFocus: false,
} as const;

const featuredQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 1000 * 60 * 15, // 15 minutes (featured changes less often)
} as const;

// ============================================================================
// QUERIES - MY CONTENT
// ============================================================================

/**
 * Get all my media (videos + images)
 */
export function useMyMedia(params?: GalleryQueryParams) {
  return useQuery({
    queryKey: galleryKeys.myMedia(params),
    queryFn: () => galleryApi.getMyMedia(params),
    ...defaultQueryOptions,
  });
}

/**
 * Get my videos only
 */
export function useMyVideos(params?: GalleryQueryParams) {
  return useQuery({
    queryKey: galleryKeys.myVideos(params),
    queryFn: () => galleryApi.getMyVideos(params),
    ...defaultQueryOptions,
  });
}

/**
 * Get my images only
 */
export function useMyImages(params?: GalleryQueryParams) {
  return useQuery({
    queryKey: galleryKeys.myImages(params),
    queryFn: () => galleryApi.getMyImages(params),
    ...defaultQueryOptions,
  });
}

// ============================================================================
// QUERIES - PUBLIC CONTENT
// ============================================================================

/**
 * Browse public gallery (authenticated - includes hasLiked)
 */
export function usePublicGallery(params?: GalleryQueryParams) {
  return useQuery({
    queryKey: galleryKeys.public(params),
    queryFn: () => galleryApi.browseAuth(params),
    ...defaultQueryOptions,
  });
}

/**
 * Get featured media
 */
export function useFeaturedMedia(limit?: number) {
  return useQuery({
    queryKey: galleryKeys.featured(limit),
    queryFn: () => galleryApi.getFeatured(limit),
    ...featuredQueryOptions,
  });
}

/**
 * Get trending media
 */
export function useTrendingMedia(limit?: number) {
  return useQuery({
    queryKey: galleryKeys.trending(limit),
    queryFn: () => galleryApi.getTrending(limit),
    ...defaultQueryOptions,
    staleTime: 1000 * 60 * 2, // 2 minutes (trending changes frequently)
  });
}

// ============================================================================
// QUERIES - SINGLE ITEMS
// ============================================================================

/**
 * Get single video by ID
 */
export function useGalleryVideo(videoId: string | null) {
  return useQuery({
    queryKey: galleryKeys.video(videoId ?? ''),
    queryFn: () => galleryApi.getVideo(videoId!),
    enabled: !!videoId,
    ...defaultQueryOptions,
  });
}

/**
 * Get single image by ID
 */
export function useGalleryImage(imageId: string | null) {
  return useQuery({
    queryKey: galleryKeys.image(imageId ?? ''),
    queryFn: () => galleryApi.getImage(imageId!),
    enabled: !!imageId,
    ...defaultQueryOptions,
  });
}

// ============================================================================
// MUTATIONS - LIKE
// ============================================================================

/**
 * Like/unlike a video with optimistic update
 */
export function useLikeVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (videoId: string) => galleryApi.likeVideo(videoId),
    onMutate: async (videoId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: galleryKeys.all });

      // Snapshot previous value
      const previousVideo = queryClient.getQueryData<GalleryItem>(
        galleryKeys.video(videoId)
      );

      // Optimistically update
      if (previousVideo) {
        queryClient.setQueryData<GalleryItem>(
          galleryKeys.video(videoId),
          {
            ...previousVideo,
            hasLiked: !previousVideo.hasLiked,
            likeCount: previousVideo.hasLiked
              ? previousVideo.likeCount - 1
              : previousVideo.likeCount + 1,
          }
        );
      }

      return { previousVideo };
    },
    onError: (_err, videoId, context) => {
      // Rollback on error
      if (context?.previousVideo) {
        queryClient.setQueryData(
          galleryKeys.video(videoId),
          context.previousVideo
        );
      }
    },
    onSettled: () => {
      // Refetch affected queries (targeted, not all)
      queryClient.invalidateQueries({ queryKey: galleryKeys.myMedia() });
      queryClient.invalidateQueries({ queryKey: galleryKeys.public() });
    },
  });
}

/**
 * Like/unlike an image with optimistic update
 */
export function useLikeImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => galleryApi.likeImage(imageId),
    onMutate: async (imageId) => {
      await queryClient.cancelQueries({ queryKey: galleryKeys.all });

      const previousImage = queryClient.getQueryData<GalleryItem>(
        galleryKeys.image(imageId)
      );

      if (previousImage) {
        queryClient.setQueryData<GalleryItem>(
          galleryKeys.image(imageId),
          {
            ...previousImage,
            hasLiked: !previousImage.hasLiked,
            likeCount: previousImage.hasLiked
              ? previousImage.likeCount - 1
              : previousImage.likeCount + 1,
          }
        );
      }

      return { previousImage };
    },
    onError: (_err, imageId, context) => {
      if (context?.previousImage) {
        queryClient.setQueryData(
          galleryKeys.image(imageId),
          context.previousImage
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.myMedia() });
      queryClient.invalidateQueries({ queryKey: galleryKeys.public() });
    },
  });
}

// ============================================================================
// MUTATIONS - VISIBILITY
// ============================================================================

/**
 * Update video visibility
 */
export function useUpdateVideoVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ videoId, data }: { videoId: string; data: UpdateMediaVisibilityRequest }) =>
      galleryApi.updateVideoVisibility(videoId, data),
    onSuccess: (updatedVideo, { videoId }) => {
      // Update cache directly
      queryClient.setQueryData(galleryKeys.video(videoId), updatedVideo);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: galleryKeys.myMedia() });
      queryClient.invalidateQueries({ queryKey: galleryKeys.myVideos() });
      queryClient.invalidateQueries({ queryKey: galleryKeys.public() });
    },
    onError: (error) => {
      console.error('Failed to update video visibility:', error);
    },
  });
}

/**
 * Update image visibility
 */
export function useUpdateImageVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, data }: { imageId: string; data: UpdateMediaVisibilityRequest }) =>
      galleryApi.updateImageVisibility(imageId, data),
    onSuccess: (updatedImage, { imageId }) => {
      queryClient.setQueryData(galleryKeys.image(imageId), updatedImage);
      queryClient.invalidateQueries({ queryKey: galleryKeys.myMedia() });
      queryClient.invalidateQueries({ queryKey: galleryKeys.myImages() });
      queryClient.invalidateQueries({ queryKey: galleryKeys.public() });
    },
    onError: (error) => {
      console.error('Failed to update image visibility:', error);
    },
  });
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type { GalleryItem, GalleryPaginatedResponse, GalleryQueryParams, UpdateMediaVisibilityRequest };
