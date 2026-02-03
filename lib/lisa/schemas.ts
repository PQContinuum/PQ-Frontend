import { z } from 'zod';

// ============================================================================
// CHARACTER SCHEMAS
// ============================================================================

export const CharacterTypeSchema = z.enum([
  'human',
  'mascot',
  'fantasy',
  'animal',
  'product',
  'other',
]);

export const VisualStyleSchema = z.enum([
  'realistic',
  'cartoon',
  'anime',
  '3d',
  'pixel',
  'watercolor',
  'oil-painting',
  'sketch',
]);

export const CharacterLocksSchema = z.object({
  face: z.boolean().optional(),
  eyeColor: z.boolean().optional(),
  hairStyle: z.boolean().optional(),
  bodyType: z.boolean().optional(),
  colorPalette: z.boolean().optional(),
  baseOutfit: z.boolean().optional(),
});

export const PhysicalTraitsSchema = z.object({
  gender: z.string().optional(),
  age: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  skinTone: z.string().optional(),
  bodyType: z.string().optional(),
  height: z.string().optional(),
  distinguishingFeatures: z.string().optional(),
});

export const CharacterSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  visualStyle: VisualStyleSchema.optional(),
  physicalTraits: PhysicalTraitsSchema.nullable().optional(),
  referenceImageUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Gallery fields
  characterType: CharacterTypeSchema.optional(),
  isPublic: z.boolean().optional(),
  galleryTitle: z.string().nullable().optional(),
  galleryDescription: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  locks: CharacterLocksSchema.nullable().optional(),
  version: z.number().optional(),
  viewCount: z.number().optional(),
  likeCount: z.number().optional(),
  shareCount: z.number().optional(),
  isFeatured: z.boolean().optional(),
  allowCloning: z.boolean().optional(),
  hasLiked: z.boolean().optional(),
});

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const CreateCharacterInputSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().max(2000).optional(),
  visualStyle: VisualStyleSchema.optional(),
  physicalTraits: PhysicalTraitsSchema.optional(),
  referenceImageUrl: z.string().url().optional(),
  characterType: CharacterTypeSchema.optional(),
  locks: CharacterLocksSchema.optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const UpdateCharacterVisibilityInputSchema = z.object({
  isPublic: z.boolean(),
  galleryTitle: z.string().max(100).optional(),
  galleryDescription: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(5).optional(),
  allowCloning: z.boolean().optional(),
});

// ============================================================================
// QUERY PARAMS SCHEMAS
// ============================================================================

export const PublicCharactersParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  characterType: CharacterTypeSchema.optional(),
  visualStyle: VisualStyleSchema.optional(),
  sortBy: z.enum(['recent', 'popular', 'likes']).optional(),
  tags: z.string().optional(),
});

export const GalleryQueryParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.enum(['recent', 'popular', 'trending', 'likes']).optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', 'all']).optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  mediaType: z.enum(['video', 'image', 'all']).optional(),
});

// ============================================================================
// GALLERY SCHEMAS
// ============================================================================

export const GalleryItemSchema = z.object({
  id: z.string(),
  mediaType: z.enum(['video', 'image']),
  title: z.string(),
  description: z.string().nullable(),
  prompt: z.string(),
  tags: z.array(z.string()),
  viewCount: z.number(),
  likeCount: z.number(),
  shareCount: z.number(),
  isFeatured: z.boolean(),
  createdAt: z.string(),
  creator: z.object({
    id: z.string(),
    fullName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  hasLiked: z.boolean().optional(),
  // Video specific
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  aspectRatio: z.string().optional(),
  duration: z.string().optional(),
  // Image specific
  imageUrl: z.string().optional(),
  size: z.string().optional(),
  quality: z.string().optional(),
  stylePreset: z.string().nullable().optional(),
});

export const GalleryPaginatedResponseSchema = z.object({
  items: z.array(GalleryItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasMore: z.boolean(),
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type CharacterType = z.infer<typeof CharacterTypeSchema>;
export type VisualStyle = z.infer<typeof VisualStyleSchema>;
export type CharacterLocks = z.infer<typeof CharacterLocksSchema>;
export type PhysicalTraits = z.infer<typeof PhysicalTraitsSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type CreateCharacterInput = z.infer<typeof CreateCharacterInputSchema>;
export type UpdateCharacterVisibilityInput = z.infer<typeof UpdateCharacterVisibilityInputSchema>;
export type PublicCharactersParams = z.infer<typeof PublicCharactersParamsSchema>;
export type GalleryQueryParams = z.infer<typeof GalleryQueryParamsSchema>;
export type GalleryItem = z.infer<typeof GalleryItemSchema>;
export type GalleryPaginatedResponse = z.infer<typeof GalleryPaginatedResponseSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateCharacter(data: unknown): Character {
  return CharacterSchema.parse(data);
}

export function validateGalleryItem(data: unknown): GalleryItem {
  return GalleryItemSchema.parse(data);
}

export function safeParseCharacter(data: unknown) {
  return CharacterSchema.safeParse(data);
}

export function safeParseGalleryItem(data: unknown) {
  return GalleryItemSchema.safeParse(data);
}
