import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, ChefHat, Link as LinkIcon, Check, Minus, Plus, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Recipe } from '../types/Recipe';
import { scaleIngredient } from '@/lib/recipe-utils';
import { supabase } from '@/integrations/supabase/client';

const SharedRecipe = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [desiredServings, setDesiredServings] = useState('1');
  const [adjustedIngredients, setAdjustedIngredients] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkedInstructions, setCheckedInstructions] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) {
        setError('Recipe ID is required');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('recipes')
          .select(`
            *,
            profiles(full_name)
          `)
          .eq('id', recipeId)
          .eq('visibility', 'public')
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError('Recipe not found or not publicly accessible');
          setLoading(false);
          return;
        }

        // Transform database format to Recipe type
        const transformedRecipe: Recipe = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          images: (data as any).images || [],
          cookTime: data.cook_time,
          prepTime: data.prep_time,
          servings: data.servings,
          tags: data.tags || [],
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          visibility: (data as any).visibility || 'public',
          user_id: data.user_id,
          user_full_name: data.profiles?.full_name || '',
          link: data.link || '',
        };

        setRecipe(transformedRecipe);
        setDesiredServings(String(transformedRecipe.servings));
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  useEffect(() => {
    if (!recipe) {
      setAdjustedIngredients([]);
      return;
    }

    const desired = parseFloat(desiredServings);

    if (isNaN(desired)) {
      const placeholder = recipe.ingredients.map(() => '—');
      setAdjustedIngredients(placeholder);
      return;
    }
    
    if (desired === recipe.servings) {
      setAdjustedIngredients(recipe.ingredients);
      return;
    }
    
    if (desired <= 0) {
      const placeholder = recipe.ingredients.map(() => '—');
      setAdjustedIngredients(placeholder);
      return;
    }

    const scaleFactor = desired / recipe.servings;
    const newIngredients = recipe.ingredients.map(ing => scaleIngredient(ing, scaleFactor));
    setAdjustedIngredients(newIngredients);
    
  }, [desiredServings, recipe]);

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  const handleDecrementServings = () => {
    setDesiredServings(s => {
      const current = parseFloat(s);
      const startValue = recipe?.servings ?? 1;
      const newAmount = Math.max(0.5, (isNaN(current) ? startValue : current) - 0.5);
      return String(newAmount);
    });
  };

  const handleIncrementServings = () => {
    setDesiredServings(s => {
      const current = parseFloat(s);
      const startValue = recipe?.servings ?? 1;
      const newAmount = (isNaN(current) ? startValue : current) + 0.5;
      return String(newAmount);
    });
  };

  const handleNextImage = () => {
    if (recipe && recipe.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % recipe.images.length);
    }
  };

  const handlePrevImage = () => {
    if (recipe && recipe.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + recipe.images.length) % recipe.images.length);
    }
  };

  const toggleInstruction = (index: number) => {
    const newChecked = new Set(checkedInstructions);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedInstructions(newChecked);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-rose-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="text-8xl font-dancing-script text-amber-900 mb-8">arkooking</div>
          <div className="w-16 h-16 border-4 border-amber-300 border-t-amber-700 rounded-full animate-spin mb-8"></div>
          <div className="text-4xl font-dancing-script text-amber-900 text-center">loading recipe...</div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-rose-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🍳</div>
          <h1 className="text-2xl font-bold text-amber-900 mb-4">Recipe Not Found</h1>
          <p className="text-amber-700 mb-6">{error || 'This recipe is not available or has been removed.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-rose-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-amber-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Image */}
        <div className="h-48 bg-gradient-to-br from-amber-100 to-rose-100 relative">
          {recipe.images && recipe.images.length > 0 ? (
            <>
              <img
                src={recipe.images[currentImageIndex]}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
              {recipe.images.length > 1 && (
                <>
                  <button onClick={handlePrevImage} className="absolute z-10 left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors focus:outline-none">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={handleNextImage} className="absolute z-10 right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors focus:outline-none">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {recipe.images.map((_, index) => (
                      <div key={index} className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}></div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl">🍳</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="bg-white">
          <div className="p-6">
            {/* Title and Meta */}
            <h1 className="text-2xl font-bold text-amber-900 mb-2">{recipe.title}</h1>
            <p className="text-amber-700 mb-4">{recipe.description}</p>
            {recipe.user_full_name && (
              <div className="flex items-center gap-2 mb-4 text-amber-800 text-sm">
                <ChefHat className="w-4 h-4" />
                <span>By {recipe.user_full_name}</span>
              </div>
            )}
            {recipe.link && (
              <div className="flex items-center gap-2 mb-4 text-amber-700 text-sm">
                <LinkIcon className="w-4 h-4" />
                <a
                  href={recipe.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-900 break-all"
                >
                  {recipe.link}
                </a>
              </div>
            )}

            <div className="flex items-center gap-4 mb-4 text-sm text-amber-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Prep: {recipe.prepTime}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Cook: {recipe.cookTime}m</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <div className="flex items-center gap-2 bg-amber-50 rounded-full px-2 py-1">
                  <button
                    onClick={handleDecrementServings}
                    className="p-1 rounded-full hover:bg-amber-100"
                    disabled={(parseFloat(desiredServings) || recipe.servings) <= 0.5}
                  >
                    <Minus className="w-3 h-3 text-amber-700"/>
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    value={desiredServings}
                    onChange={(e) => setDesiredServings(e.target.value)}
                    className="w-12 text-center bg-transparent font-medium text-amber-800 focus:outline-none"
                    placeholder={String(recipe.servings)}
                  />
                   <button
                    onClick={handleIncrementServings}
                    className="p-1 rounded-full hover:bg-amber-100"
                  >
                    <Plus className="w-3 h-3 text-amber-700"/>
                  </button>
                </div>
                <span>servings</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {recipe.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Ingredients */}
            <h2 className="text-xl font-bold text-amber-900 mb-3">Ingredients</h2>
            <div className="space-y-2 mb-6">
              {adjustedIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  onClick={() => toggleIngredient(index)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    checkedIngredients.has(index)
                      ? 'bg-green-50 text-green-800'
                      : 'bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    checkedIngredients.has(index)
                      ? 'border-green-500 bg-green-500'
                      : 'border-amber-300'
                  }`}>
                    {checkedIngredients.has(index) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className={checkedIngredients.has(index) ? 'line-through' : ''}>
                    {ingredient}
                  </span>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <h2 className="text-xl font-bold text-amber-900 mb-3">Instructions</h2>
            <div className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className={`flex gap-3 cursor-pointer select-none transition-colors ${checkedInstructions.has(index) ? 'bg-green-50' : ''}`}
                  onClick={() => toggleInstruction(index)}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-rose-400 to-orange-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className={`text-amber-800 leading-relaxed pt-1 ${checkedInstructions.has(index) ? 'line-through opacity-60' : ''}`}>{instruction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedRecipe; 