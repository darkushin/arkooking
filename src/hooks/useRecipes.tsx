import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recipe } from '../types/Recipe';
import { useAuth, UserRole } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch recipes from database
  const fetchRecipes = async () => {
    if (!user) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database format to Recipe type
      const transformedRecipes: Recipe[] = data.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description || '',
        images: (recipe as any).images || [],
        cookTime: recipe.cook_time,
        prepTime: recipe.prep_time,
        servings: recipe.servings,
        tags: recipe.tags || [],
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        visibility: (recipe as any).visibility || 'public',
        user_id: recipe.user_id,
        user_full_name: recipe.profiles?.full_name || '',
        link: recipe.link || '',
      }));

      setRecipes(transformedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: "Error",
        description: "Failed to load recipes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add new recipe
  const addRecipe = async (newRecipe: Omit<Recipe, 'id'>, role: UserRole) => {
    if (!user) return;
    
    let visibility = newRecipe.visibility;
    if (role === 'Editor') {
      visibility = 'private';
    } else if (role === 'Admin') {
      visibility = 'public';
    }

    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: newRecipe.title,
          description: newRecipe.description,
          images: newRecipe.images,
          cook_time: newRecipe.cookTime,
          prep_time: newRecipe.prepTime,
          servings: newRecipe.servings,
          tags: newRecipe.tags,
          ingredients: newRecipe.ingredients,
          instructions: newRecipe.instructions,
          visibility: visibility,
          link: newRecipe.link,
        })
        .select()
        .single();

      if (error) throw error;

      // Transform and add to local state
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

      setRecipes(prev => [transformedRecipe, ...prev]);
      
      toast({
        title: "Success!",
        description: "Recipe added successfully.",
      });
    } catch (error) {
      console.error('Error adding recipe:', error);
      toast({
        title: "Error",
        description: "Failed to add recipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update recipe
  const updateRecipe = async (updatedRecipe: Recipe) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .update({
          title: updatedRecipe.title,
          description: updatedRecipe.description,
          images: updatedRecipe.images,
          cook_time: updatedRecipe.cookTime,
          prep_time: updatedRecipe.prepTime,
          servings: updatedRecipe.servings,
          tags: updatedRecipe.tags,
          ingredients: updatedRecipe.ingredients,
          instructions: updatedRecipe.instructions,
          visibility: updatedRecipe.visibility,
          link: updatedRecipe.link,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedRecipe.id);

      if (error) throw error;

      setRecipes(prev => prev.map(recipe => 
        recipe.id === updatedRecipe.id ? updatedRecipe : recipe
      ));

      toast({
        title: "Success!",
        description: "Recipe updated successfully.",
      });
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast({
        title: "Error",
        description: "Failed to update recipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete recipe
  const deleteRecipe = async (recipeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      
      toast({
        title: "Success!",
        description: "Recipe deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [user]);

  return {
    recipes,
    loading,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    refetch: fetchRecipes
  };
};
