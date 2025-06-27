import { useState, useEffect } from 'react';
import { Plus, Search, LogOut, User, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RecipeCard from '../components/RecipeCard';
import RecipeDetailModal from '../components/RecipeDetailModal';
import AddRecipeModal from '../components/AddRecipeModal';
import EditRecipeModal from '@/components/EditRecipeModal';
import { Recipe } from '../types/Recipe';
import { useAuth } from '../hooks/useAuth';
import { useRecipes } from '../hooks/useRecipes';
import { useNavigate } from 'react-router-dom';
import { categories } from '@/lib/categories';
import Sidebar from '@/components/Sidebar';


const getInitialFormState = (initialTag, userRole) => {
  const saved = localStorage.getItem('addRecipeFormState');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return {
    title: '',
    description: '',
    images: [],
    cookTime: 0,
    prepTime: 0,
    servings: 0,
    tags: initialTag ? [initialTag] : [],
    newTag: '',
    ingredients: [''],
    instructions: [''],
    isPrivate: userRole === 'Editor',
    link: ''
  };
};

const getInitialEditFormState = (recipe) => {
  if (!recipe) return null;
  const saved = localStorage.getItem(`editRecipeFormState_${recipe.id}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return {
    title: recipe.title,
    description: recipe.description || '',
    images: recipe.images || [],
    cookTime: recipe.cookTime,
    prepTime: recipe.prepTime,
    servings: recipe.servings,
    tags: recipe.tags,
    newTag: '',
    ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [''],
    instructions: recipe.instructions.length > 0 ? recipe.instructions : [''],
    isPrivate: recipe.visibility === 'private',
    link: recipe.link || ''
  };
};

const Index = () => {
  const { user, loading: authLoading, signOut, isGuest, exitGuestMode } = useAuth();
  const { recipes, loading: recipesLoading, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(() => {
    const stored = localStorage.getItem('isAddModalOpen');
    return stored === 'true';
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [addRecipeForm, setAddRecipeForm] = useState(() => getInitialFormState(null, null));
  const [editRecipeForm, setEditRecipeForm] = useState(null);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    localStorage.setItem('isAddModalOpen', isAddModalOpen ? 'true' : 'false');
  }, [isAddModalOpen]);

  useEffect(() => {
    if (isAddModalOpen) {
      localStorage.setItem('addRecipeFormState', JSON.stringify(addRecipeForm));
    }
  }, [addRecipeForm, isAddModalOpen]);

  useEffect(() => {
    if (isAddModalOpen) {
      const saved = localStorage.getItem('addRecipeFormState');
      if (saved) {
        try {
          setAddRecipeForm(JSON.parse(saved));
        } catch {}
      }
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    if (isEditModalOpen && selectedRecipe && editRecipeForm) {
      localStorage.setItem(`editRecipeFormState_${selectedRecipe.id}`, JSON.stringify(editRecipeForm));
    }
  }, [editRecipeForm, isEditModalOpen, selectedRecipe]);

  useEffect(() => {
    if (isEditModalOpen && selectedRecipe) {
      const saved = localStorage.getItem(`editRecipeFormState_${selectedRecipe.id}`);
      if (saved) {
        try {
          setEditRecipeForm(JSON.parse(saved));
        } catch {}
      } else {
        setEditRecipeForm(getInitialEditFormState(selectedRecipe));
      }
    }
  }, [isEditModalOpen, selectedRecipe]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    if (isGuest) {
      exitGuestMode();
    } else {
      await signOut();
    }
    navigate('/auth');
  };

  const getRecipeCountForCategory = (categoryName: string) => {
    return recipes.filter(recipe => recipe.tags.includes(categoryName)).length;
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSearchTerm('');
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    setSearchTerm('');
  };

  // Only show public recipes or private recipes owned by the current user
  const visibleRecipes = recipes.filter(
    recipe => recipe.visibility === 'public' || (user && recipe.user_id === user.id)
  );

  const recipesInCategory = selectedCategory
    ? visibleRecipes.filter(recipe => recipe.tags.includes(selectedCategory))
    : visibleRecipes;

  const filteredRecipes = recipesInCategory.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setAddRecipeForm(getInitialFormState(selectedCategory, user?.role));
    setIsAddModalOpen(true);
    localStorage.setItem('isAddModalOpen', 'true');
  };

  const handleAddRecipe = async (newRecipe) => {
    if (!user) return;
    await addRecipe(newRecipe, user.role);
    setIsAddModalOpen(false);
    localStorage.setItem('isAddModalOpen', 'false');
    localStorage.removeItem('addRecipeFormState');
  };

  const openEditModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailModalOpen(false);
    setEditRecipeForm(getInitialEditFormState(recipe));
    setIsEditModalOpen(true);
  };

  const handleUpdateRecipe = async (updatedRecipe: Recipe) => {
    await updateRecipe(updatedRecipe);
    setIsEditModalOpen(false);
    setSelectedRecipe(updatedRecipe);
    setIsDetailModalOpen(true);
    if (updatedRecipe.id) {
      localStorage.removeItem(`editRecipeFormState_${updatedRecipe.id}`);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    await deleteRecipe(recipeId);
    setIsDetailModalOpen(false);
  };

  if ((authLoading || recipesLoading || showLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-rose-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="text-8xl font-dancing-script text-amber-900 mb-8">arkooking</div>
          <div className="w-16 h-16 border-4 border-amber-300 border-t-amber-700 rounded-full animate-spin mb-8"></div>
          <div className="text-4xl font-dancing-script text-amber-900">great food takes time to load</div>
        </div>
      </div>
    );
  }

  // This check is important. It ensures that we don't render the main content
  // for a moment before the redirect useEffect kicks in.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center relative">
          <div className="absolute left-4">
            {isGuest && (
              <Button
                onClick={() => { exitGuestMode(); navigate('/auth'); }}
                variant="ghost"
                size="icon"
                className="text-amber-700 hover:text-amber-800"
                aria-label="Back to Auth"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
          </div>
          <h1 className="text-6xl font-dancing-script text-amber-900">arkooking</h1>
          <div className="absolute right-4">
            {isGuest ? (
              <Button
                onClick={() => { exitGuestMode(); navigate('/auth'); }}
                variant="ghost"
                size="sm"
                className="text-amber-700 hover:text-amber-800"
              >
                Sign In
              </Button>
            ) : (
              <Button
                onClick={() => setIsSidebarOpen(true)}
                variant="ghost"
                size="icon"
                className="text-amber-700 hover:text-amber-800"
              >
                <User className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {selectedCategory ? (
          <>
            <Button
              onClick={handleClearCategory}
              variant="ghost"
              className="mb-4 text-amber-700 hover:text-amber-800 -ml-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Categories
            </Button>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
              <Input
                type="text"
                placeholder={`Search in ${selectedCategory}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/90 backdrop-blur-sm border-amber-200 focus:border-amber-400"
              />
            </div>

            {/* Recipes Grid */}
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍳</div>
                <h3 className="text-lg font-medium text-amber-800 mb-2">No recipes in {selectedCategory}</h3>
                <p className="text-amber-600 mb-6">Want to add one?</p>
                {(user.role === 'Editor' || user.role === 'Admin') && (
                  <Button
                    onClick={() => handleOpenAddModal()}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Recipe
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => handleRecipeClick(recipe)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div>
            {/* Global Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search all recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/90 backdrop-blur-sm border-amber-200 focus:border-amber-400"
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-600 hover:text-amber-900"
                  onClick={() => setSearchTerm('')}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm ? (
              <>
                {filteredRecipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍳</div>
                    <h3 className="text-lg font-medium text-amber-800 mb-2">No recipes found</h3>
                    <p className="text-amber-600 mb-6">Try a different search or add a new recipe!</p>
                    {(user.role === 'Editor' || user.role === 'Admin') && (
                      <Button
                        onClick={() => handleOpenAddModal()}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Recipe
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRecipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        onClick={() => handleRecipeClick(recipe)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-amber-900 mb-4">Categories</h2>
                <div className="grid grid-cols-3 gap-4">
                  {categories.map(category => (
                    <div
                      key={category.name}
                      onClick={() => handleCategoryClick(category.name)}
                      className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center text-center"
                    >
                      <category.icon className="w-10 h-10 text-amber-600 mb-2" />
                      <h3 className="font-bold text-amber-900">{category.name}</h3>
                      <p className="text-sm text-amber-700">({getRecipeCountForCategory(category.name)} recipes)</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      {user && (user.role === 'Editor' || user.role === 'Admin') && (selectedCategory === null || filteredRecipes.length > 0) && (
        <Button
          onClick={() => handleOpenAddModal()}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* Modals */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        user={user}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={openEditModal}
        onDelete={handleDeleteRecipe}
      />
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          localStorage.setItem('isAddModalOpen', 'false');
          localStorage.removeItem('addRecipeFormState');
        }}
        onAdd={handleAddRecipe}
        userRole={user?.role}
        initialTag={selectedCategory}
        isAddModalOpen={isAddModalOpen}
        form={addRecipeForm}
        setForm={setAddRecipeForm}
      />
      <EditRecipeModal
        recipe={selectedRecipe}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          if (selectedRecipe?.id) {
            localStorage.removeItem(`editRecipeFormState_${selectedRecipe.id}`);
          }
        }}
        onEdit={handleUpdateRecipe}
        form={editRecipeForm}
        setForm={setEditRecipeForm}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
};

export default Index;
