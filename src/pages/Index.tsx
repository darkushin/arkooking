
import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import RecipeCard from '../components/RecipeCard';
import AddRecipeModal from '../components/AddRecipeModal';
import RecipeDetailModal from '../components/RecipeDetailModal';
import { Recipe } from '../types/Recipe';

// Sample data to demonstrate the app
const sampleRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Grandma\'s Chocolate Chip Cookies',
    description: 'The perfect chewy and crispy cookies that remind you of home',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&h=300&fit=crop',
    cookTime: 25,
    prepTime: 15,
    servings: 24,
    tags: ['Dessert', 'Baking', 'Family Favorite'],
    ingredients: [
      '2¼ cups all-purpose flour',
      '1 tsp baking soda',
      '1 tsp salt',
      '1 cup butter, softened',
      '¾ cup granulated sugar',
      '¾ cup packed brown sugar',
      '2 large eggs',
      '2 tsp vanilla extract',
      '2 cups chocolate chips'
    ],
    instructions: [
      'Preheat oven to 375°F (190°C).',
      'In a medium bowl, whisk together flour, baking soda, and salt.',
      'In a large bowl, cream together butter and both sugars until light and fluffy.',
      'Beat in eggs one at a time, then vanilla.',
      'Gradually blend in flour mixture.',
      'Stir in chocolate chips.',
      'Drop rounded tablespoons of dough onto ungreased cookie sheets.',
      'Bake 9-11 minutes or until golden brown.',
      'Cool on baking sheet for 2 minutes before transferring to wire rack.'
    ]
  },
  {
    id: '2',
    title: 'Mediterranean Quinoa Bowl',
    description: 'A healthy and colorful bowl packed with fresh vegetables and herbs',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=300&fit=crop',
    cookTime: 20,
    prepTime: 15,
    servings: 4,
    tags: ['Healthy', 'Vegetarian', 'Mediterranean'],
    ingredients: [
      '1 cup quinoa',
      '2 cups vegetable broth',
      '1 cucumber, diced',
      '2 tomatoes, diced',
      '1/2 red onion, thinly sliced',
      '1/2 cup kalamata olives',
      '1/2 cup feta cheese, crumbled',
      '1/4 cup fresh parsley',
      '2 tbsp olive oil',
      '1 lemon, juiced',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Rinse quinoa under cold water until water runs clear.',
      'In a medium saucepan, bring vegetable broth to a boil.',
      'Add quinoa, reduce heat to low, cover and simmer for 15 minutes.',
      'Remove from heat and let stand 5 minutes, then fluff with a fork.',
      'Let quinoa cool to room temperature.',
      'In a large bowl, combine cooled quinoa with cucumber, tomatoes, and red onion.',
      'Add olives, feta cheese, and parsley.',
      'Whisk together olive oil and lemon juice, season with salt and pepper.',
      'Pour dressing over salad and toss gently to combine.',
      'Serve chilled or at room temperature.'
    ]
  },
  {
    id: '3',
    title: 'Creamy Tomato Basil Soup',
    description: 'A comforting classic that pairs perfectly with grilled cheese',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=300&fit=crop',
    cookTime: 30,
    prepTime: 10,
    servings: 6,
    tags: ['Soup', 'Comfort Food', 'Vegetarian'],
    ingredients: [
      '2 tbsp olive oil',
      '1 onion, diced',
      '3 cloves garlic, minced',
      '1 can (28 oz) crushed tomatoes',
      '2 cups vegetable broth',
      '1/2 cup heavy cream',
      '1/4 cup fresh basil leaves',
      '1 tsp sugar',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Heat olive oil in a large pot over medium heat.',
      'Add onion and cook until softened, about 5 minutes.',
      'Add garlic and cook for another minute.',
      'Stir in crushed tomatoes, broth, and sugar.',
      'Bring to a boil, then reduce heat and simmer for 20 minutes.',
      'Remove from heat and stir in cream and fresh basil.',
      'Use an immersion blender to blend until smooth, or transfer to a regular blender in batches.',
      'Season with salt and pepper to taste.',
      'Serve hot with fresh basil garnish.'
    ]
  }
];

const Index = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Get all unique tags from recipes
  const allTags = Array.from(new Set(recipes.flatMap(recipe => recipe.tags)));

  // Filter recipes based on search and tag
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || recipe.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleAddRecipe = (newRecipe: Omit<Recipe, 'id'>) => {
    const recipe: Recipe = {
      ...newRecipe,
      id: Date.now().toString()
    };
    setRecipes(prev => [recipe, ...prev]);
    setShowAddModal(false);
  };

  const handleEditRecipe = (updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(recipe => 
      recipe.id === updatedRecipe.id ? updatedRecipe : recipe
    ));
    setSelectedRecipe(null);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    setSelectedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-amber-900 text-center mb-4">My Recipes</h1>
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white/90"
            />
          </div>

          {/* Tag Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedTag('')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedTag 
                  ? 'bg-amber-200 text-amber-800' 
                  : 'bg-white/80 text-amber-700 hover:bg-amber-100'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedTag === tag 
                    ? 'bg-amber-200 text-amber-800' 
                    : 'bg-white/80 text-amber-700 hover:bg-amber-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="grid gap-4">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelectedRecipe(recipe)}
            />
          ))}
          
          {filteredRecipes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-amber-700 text-lg mb-2">No recipes found</p>
              <p className="text-amber-600">Try adjusting your search or add a new recipe!</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-rose-400 to-orange-400 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      {showAddModal && (
        <AddRecipeModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddRecipe}
        />
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
        />
      )}
    </div>
  );
};

export default Index;
