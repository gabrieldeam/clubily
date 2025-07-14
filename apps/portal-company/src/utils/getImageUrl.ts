export const getImageUrl = (path?: string | null) => {
  if (!path) return undefined;
  const base = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};
