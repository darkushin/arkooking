
export interface Recipe {
  id: string;
  title: string;
  description: string;
  image?: string;
  cookTime: number;
  prepTime: number;
  servings: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
}
