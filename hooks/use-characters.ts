'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiPostFormData,
} from '@/lib/api-client';
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
  UpdateCharacterVisibilityInput,
  PublicCharactersParams,
  PublicCharactersResponse,
} from '@/lib/lisa/types';
import { charactersApi as apiCharacters } from '@/lib/api-client';

// ============================================================================
// API TYPES
// ============================================================================

interface CharacterResponse {
  character: Character;
}

interface CharactersListResponse {
  characters: Character[];
}

interface UploadReferenceResponse {
  character: Character;
  imageUrl: string;
  storagePath: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const characterKeys = {
  all: ['characters'] as const,
  lists: () => [...characterKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...characterKeys.lists(), { filters }] as const,
  details: () => [...characterKeys.all, 'detail'] as const,
  detail: (id: string) => [...characterKeys.details(), id] as const,
  // Public gallery keys
  public: ['characters', 'public'] as const,
  publicList: (params?: PublicCharactersParams) =>
    [...characterKeys.public, 'list', params] as const,
  publicDetail: (id: string) => [...characterKeys.public, 'detail', id] as const,
  featured: () => [...characterKeys.public, 'featured'] as const,
  trending: () => [...characterKeys.public, 'trending'] as const,
  creator: (creatorId: string) =>
    [...characterKeys.public, 'creator', creatorId] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchCharacters(): Promise<Character[]> {
  const data = await apiGet<CharactersListResponse>('/characters');
  return data.characters;
}

async function fetchCharacter(id: string): Promise<Character> {
  const data = await apiGet<CharacterResponse>(`/characters/${id}`);
  return data.character;
}

async function createCharacter(input: CreateCharacterInput): Promise<Character> {
  const data = await apiPost<CharacterResponse>('/characters', input);
  return data.character;
}

async function updateCharacter({
  id,
  ...input
}: UpdateCharacterInput): Promise<Character> {
  const data = await apiPatch<CharacterResponse>(`/characters/${id}`, input);
  return data.character;
}

async function deleteCharacter(id: string): Promise<void> {
  await apiDelete<{ success: boolean }>(`/characters/${id}`);
}

async function uploadReferenceImage(
  characterId: string,
  file: File
): Promise<UploadReferenceResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiPostFormData<UploadReferenceResponse>(
    `/characters/${characterId}/upload-reference`,
    formData
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all characters for the current user
 */
export function useCharacters() {
  return useQuery({
    queryKey: characterKeys.lists(),
    queryFn: fetchCharacters,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single character by ID
 */
export function useCharacter(id: string | null) {
  return useQuery({
    queryKey: characterKeys.detail(id!),
    queryFn: () => fetchCharacter(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new character
 */
export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCharacter,
    onSuccess: (newCharacter) => {
      // Update the list cache
      queryClient.setQueryData<Character[]>(characterKeys.lists(), (old) => {
        if (!old) return [newCharacter];
        return [newCharacter, ...old];
      });
    },
    onError: () => {
      // Invalidate to refetch on error
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing character
 */
export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCharacter,
    onSuccess: (updatedCharacter) => {
      // Update the list cache
      queryClient.setQueryData<Character[]>(characterKeys.lists(), (old) =>
        old?.map((c) =>
          c.id === updatedCharacter.id ? updatedCharacter : c
        ) ?? []
      );
      // Update the detail cache
      queryClient.setQueryData(
        characterKeys.detail(updatedCharacter.id),
        updatedCharacter
      );
    },
  });
}

/**
 * Hook to delete a character
 */
export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCharacter,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: characterKeys.lists() });

      // Snapshot the previous value
      const previousCharacters = queryClient.getQueryData<Character[]>(
        characterKeys.lists()
      );

      // Optimistically update to the new value
      queryClient.setQueryData<Character[]>(characterKeys.lists(), (old) =>
        old?.filter((c) => c.id !== deletedId) ?? []
      );

      return { previousCharacters };
    },
    onError: (_err, _deletedId, context) => {
      // Rollback on error
      if (context?.previousCharacters) {
        queryClient.setQueryData(
          characterKeys.lists(),
          context.previousCharacters
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/**
 * Hook to upload a reference image for a character
 */
export function useUploadCharacterReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, file }: { characterId: string; file: File }) =>
      uploadReferenceImage(characterId, file),
    onSuccess: (data) => {
      // Update both list and detail caches
      queryClient.setQueryData<Character[]>(characterKeys.lists(), (old) =>
        old?.map((c) => (c.id === data.character.id ? data.character : c)) ?? []
      );
      queryClient.setQueryData(
        characterKeys.detail(data.character.id),
        data.character
      );
    },
  });
}

// ============================================================================
// PUBLIC GALLERY HOOKS
// ============================================================================

/**
 * Hook to fetch public characters with pagination and filters
 */
export function usePublicCharacters(params?: PublicCharactersParams) {
  return useQuery({
    queryKey: characterKeys.publicList(params),
    queryFn: () => apiCharacters.getPublicCharacters(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch a public character by ID
 */
export function usePublicCharacter(id: string | null) {
  return useQuery({
    queryKey: characterKeys.publicDetail(id!),
    queryFn: async () => {
      const data = await apiCharacters.getPublicCharacter(id!);
      return data.character;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch featured characters
 */
export function useFeaturedCharacters(limit?: number) {
  return useQuery({
    queryKey: characterKeys.featured(),
    queryFn: async () => {
      const data = await apiCharacters.getFeatured(limit);
      return data.characters;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch trending characters
 */
export function useTrendingCharacters(limit?: number) {
  return useQuery({
    queryKey: characterKeys.trending(),
    queryFn: async () => {
      const data = await apiCharacters.getTrending(limit);
      return data.characters;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch characters by creator
 */
export function useCreatorCharacters(
  creatorId: string | null,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: characterKeys.creator(creatorId!),
    queryFn: () => apiCharacters.getCreatorCharacters(creatorId!, params),
    enabled: !!creatorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// VISIBILITY & SHARING HOOKS
// ============================================================================

/**
 * Hook to update character visibility
 */
export function useUpdateCharacterVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: UpdateCharacterVisibilityInput & { id: string }) =>
      apiCharacters.updateVisibility(id, data),
    onSuccess: (response) => {
      const updatedCharacter = response.character;
      // Update the list cache
      queryClient.setQueryData<Character[]>(characterKeys.lists(), (old) =>
        old?.map((c) =>
          c.id === updatedCharacter.id ? updatedCharacter : c
        ) ?? []
      );
      // Update the detail cache
      queryClient.setQueryData(
        characterKeys.detail(updatedCharacter.id),
        updatedCharacter
      );
      // Invalidate public caches
      queryClient.invalidateQueries({ queryKey: characterKeys.public });
    },
  });
}

/**
 * Hook to clone a public character
 */
export function useCloneCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiCharacters.clone(id),
    onSuccess: (response) => {
      const newCharacter = response.character;
      // Add to the user's characters list
      queryClient.setQueryData<Character[]>(characterKeys.lists(), (old) => {
        if (!old) return [newCharacter];
        return [newCharacter, ...old];
      });
    },
  });
}

/**
 * Hook to like a public character
 */
export function useLikeCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiCharacters.like(id),
    onMutate: async (id) => {
      // Optimistically update the character
      await queryClient.cancelQueries({
        queryKey: characterKeys.publicDetail(id),
      });
      const previousCharacter = queryClient.getQueryData<Character>(
        characterKeys.publicDetail(id)
      );
      if (previousCharacter) {
        queryClient.setQueryData(characterKeys.publicDetail(id), {
          ...previousCharacter,
          likeCount: (previousCharacter.likeCount || 0) + 1,
          hasLiked: true,
        });
      }
      return { previousCharacter };
    },
    onError: (_err, id, context) => {
      if (context?.previousCharacter) {
        queryClient.setQueryData(
          characterKeys.publicDetail(id),
          context.previousCharacter
        );
      }
    },
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({
        queryKey: characterKeys.publicDetail(id),
      });
    },
  });
}

/**
 * Hook to unlike a public character
 */
export function useUnlikeCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiCharacters.unlike(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: characterKeys.publicDetail(id),
      });
      const previousCharacter = queryClient.getQueryData<Character>(
        characterKeys.publicDetail(id)
      );
      if (previousCharacter) {
        queryClient.setQueryData(characterKeys.publicDetail(id), {
          ...previousCharacter,
          likeCount: Math.max((previousCharacter.likeCount || 0) - 1, 0),
          hasLiked: false,
        });
      }
      return { previousCharacter };
    },
    onError: (_err, id, context) => {
      if (context?.previousCharacter) {
        queryClient.setQueryData(
          characterKeys.publicDetail(id),
          context.previousCharacter
        );
      }
    },
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({
        queryKey: characterKeys.publicDetail(id),
      });
    },
  });
}

/**
 * Hook to share a character
 */
export function useShareCharacter() {
  return useMutation({
    mutationFn: (id: string) => apiCharacters.share(id),
  });
}

// ============================================================================
// CHARACTERS API (for direct use)
// ============================================================================

export const charactersApi = {
  list: fetchCharacters,
  get: fetchCharacter,
  create: createCharacter,
  update: updateCharacter,
  delete: deleteCharacter,
  uploadReference: uploadReferenceImage,
};
