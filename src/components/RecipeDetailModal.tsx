import { useState, useEffect, useRef } from 'react';
import { X, Clock, Users, Edit, Delete, Check, Minus, Plus, ChevronLeft, ChevronRight, ChefHat, Link as LinkIcon, Share2 } from 'lucide-react';
import { Recipe } from '../types/Recipe';
import { scaleIngredient } from '@/lib/recipe-utils';
import { Profile } from '@/hooks/useAuth';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  user: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
}

const RecipeDetailModal = ({ recipe, user, isOpen, onClose, onEdit, onDelete }: RecipeDetailModalProps) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [desiredServings, setDesiredServings] = useState(String(recipe?.servings || ''));
  const [adjustedIngredients, setAdjustedIngredients] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkedInstructions, setCheckedInstructions] = useState<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  // Restore checked state when modal is opened or recipe changes
  useEffect(() => {
    if (isOpen && recipe) {
      // Restore checked ingredients
      const savedCheckedIngredients = localStorage.getItem(`recipe-checked-ingredients-${recipe.id}`);
      if (savedCheckedIngredients) {
        try {
          setCheckedIngredients(new Set(JSON.parse(savedCheckedIngredients)));
        } catch {
          setCheckedIngredients(new Set());
        }
      } else {
        setCheckedIngredients(new Set());
      }
      // Restore checked instructions
      const savedCheckedInstructions = localStorage.getItem(`recipe-checked-instructions-${recipe.id}`);
      if (savedCheckedInstructions) {
        try {
          setCheckedInstructions(new Set(JSON.parse(savedCheckedInstructions)));
        } catch {
          setCheckedInstructions(new Set());
        }
      } else {
        setCheckedInstructions(new Set());
      }
    }
  }, [isOpen, recipe]);

  // Persist checkedIngredients to localStorage
  useEffect(() => {
    if (recipe) {
      localStorage.setItem(
        `recipe-checked-ingredients-${recipe.id}`,
        JSON.stringify(Array.from(checkedIngredients))
      );
    }
  }, [checkedIngredients, recipe]);

  // Persist checkedInstructions to localStorage
  useEffect(() => {
    if (recipe) {
      localStorage.setItem(
        `recipe-checked-instructions-${recipe.id}`,
        JSON.stringify(Array.from(checkedInstructions))
      );
    }
  }, [checkedInstructions, recipe]);

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

  // Clear scroll position when modal is closed
  useEffect(() => {
    if (!isOpen && recipe) {
      // Clear the saved scroll position when modal is closed
      localStorage.removeItem(`recipe-scroll-${recipe.id}`);
      isClosingRef.current = false;
    }
  }, [isOpen, recipe]);

  // Save scroll position on scroll events (only when modal is open)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !recipe || !isOpen) return;

    const handleScroll = () => {
      if (!isClosingRef.current) {
        const scrollPosition = scrollContainer.scrollTop;
        localStorage.setItem(`recipe-scroll-${recipe.id}`, scrollPosition.toString());
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [recipe, isOpen]);

  // Handle page visibility changes (tab switching) - only when modal is open
  useEffect(() => {
    if (!isOpen || !recipe) return;

    const handleVisibilityChange = () => {
      if (document.hidden && scrollContainerRef.current && !isClosingRef.current) {
        // Save scroll position when tab becomes hidden
        const scrollPosition = scrollContainerRef.current.scrollTop;
        localStorage.setItem(`recipe-scroll-${recipe.id}`, scrollPosition.toString());
      } else if (!document.hidden && scrollContainerRef.current) {
        // Restore scroll position when tab becomes visible
        const savedScrollPosition = localStorage.getItem(`recipe-scroll-${recipe.id}`);
        if (savedScrollPosition) {
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = parseInt(savedScrollPosition);
            }
          }, 50);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [recipe, isOpen]);

  // Restore scroll position when modal is opened
  useEffect(() => {
    if (isOpen && recipe && scrollContainerRef.current) {
      const savedScrollPosition = localStorage.getItem(`recipe-scroll-${recipe.id}`);
      if (savedScrollPosition) {
        // Use setTimeout to ensure the content is rendered before scrolling
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = parseInt(savedScrollPosition);
          }
        }, 100);
      }
    }
  }, [isOpen, recipe]);

  // Clear checked state when modal is closed
  useEffect(() => {
    if (!isOpen && recipe) {
      localStorage.removeItem(`recipe-checked-ingredients-${recipe.id}`);
      localStorage.removeItem(`recipe-checked-instructions-${recipe.id}`);
    }
  }, [isOpen, recipe]);

  if (!isOpen || !recipe) return null;

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  const handleClose = () => {
    isClosingRef.current = true;
    onClose();
  };

  const handleDelete = () => {
    onDelete(recipe.id);
    setShowDeleteConfirm(false);
    handleClose();
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

  const canEditOrDelete = user && recipe && (
    (user.role === 'Admin' && recipe.visibility === 'public') ||
    (user.role === 'Editor' && recipe.user_id === user.id)
  );

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/arkooking/shared/${recipe.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      // You could add a toast notification here if you want
      alert('Recipe link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Recipe link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl max-w-md w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="relative">
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
                    <button onClick={handlePrevImage} className="absolute z-10 left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors focus:outline-none"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={handleNextImage} className="absolute z-10 right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors focus:outline-none"><ChevronRight className="w-6 h-6" /></button>
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

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="absolute bottom-4 right-16 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
          >
            <Share2 className="w-5 h-5 text-amber-700" />
          </button>

          {/* Action Buttons */}
          {canEditOrDelete && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              <button
                onClick={() => onEdit(recipe)}
                className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
              >
                <Edit className="w-4 h-4 text-amber-700" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
              >
                <Delete className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-12rem)]" ref={scrollContainerRef}>
          <div className="p-6">
            {/* Title and Meta */}
            <h1 className="text-2xl font-bold text-amber-900 mb-2">{recipe.title}</h1>
            <p className="text-amber-700 mb-4">{recipe.description}</p>
            {recipe.user_full_name && (
              <div className="flex items-center gap-2 mb-4 text-amber-800 text-sm">
                <ChefHat className="w-4 h-4" />
                <span>{recipe.user_full_name}</span>
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-6 max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Recipe?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetailModal;
