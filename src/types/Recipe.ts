export interface Recipe {
  id: string;
  title: string;
  description: string;
  images: string[];
  cookTime: number;
  prepTime: number;
  servings: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  visibility: 'public' | 'private';
  user_id: string;
  user_full_name?: string;
}
