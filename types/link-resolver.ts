export type LinkType = 'x' | 'facebook' | 'instagram' | 'tiktok' | 'web';

export type LinkMetadata = {
  text: string;
  images: string[];
  videos: string[];
  author: string;
  publishedAt?: string;
  raw: unknown;
};

export type LinkResolvedResponse = {
  linkType: LinkType;
  linkMetadata: LinkMetadata;
};
