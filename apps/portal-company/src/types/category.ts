export interface CategoryBase {
  name: string;
  image_url?: string;
}

export interface CategoryRead extends CategoryBase {
  id: string;
}
