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
} from '@/lib/lisa/types';

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
