import {
  Wheat,
  CookingPot,
  Drumstick,
  Fish,
  Beef,
  Cookie,
  Utensils,
  UtensilsCrossed,
  Vegan,
  Carrot,
  Circle,
  Bean,
  Salad,
  CakeSlice,
  Soup,
  Waves,
  Anvil,
  type LucideIcon,
} from 'lucide-react';

export interface Category {
  name: string;
  icon: LucideIcon;
}

export const categories: Category[] = [
  { name: 'Bread', icon: Wheat },
  { name: 'Casseroles', icon: CookingPot },
  { name: 'Chicken', icon: Drumstick },
  { name: 'Fish', icon: Fish },
  { name: 'Meat', icon: Beef },
  { name: 'Snacks', icon: Cookie },
  { name: 'Dips', icon: Anvil },
  { name: 'Pashtet', icon: UtensilsCrossed },
  { name: 'Vegan', icon: Vegan },
  { name: 'Vegetarian', icon: Carrot },
  { name: 'Rice', icon: Circle },
  { name: 'Lentils', icon: Bean },
  { name: 'Pasta', icon: Waves },
  { name: 'Salads', icon: Salad },
  { name: 'Desserts', icon: CakeSlice },
  { name: 'Soups', icon: Soup },
  { name: 'Others', icon: Utensils },
];

export const commonTags = categories.map(c => c.name); 