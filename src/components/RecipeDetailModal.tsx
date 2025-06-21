import { useState } from 'react';
import { X, Clock, Users, Edit, Delete, Check } from 'lucide-react';
import { Recipe } from '../types/Recipe';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
}

const RecipeDetailModal = ({ recipe, isOpen, onClose, onEdit, onDelete }: RecipeDetailModalProps) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDelete = () => {
    onDelete(recipe.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl max-w-md w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="relative">
          {/* Image */}
          <div className="h-48 bg-gradient-to-br from-amber-100 to-rose-100 relative">
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl">🍳</div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Action Buttons */}
          <div className="absolute top-4 left-4 flex gap-2">
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
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-12rem)]">
          <div className="p-6">
            {/* Title and Meta */}
            <h1 className="text-2xl font-bold text-amber-900 mb-2">{recipe.title}</h1>
            <p className="text-amber-700 mb-4">{recipe.description}</p>

            <div className="flex items-center gap-4 mb-4 text-sm text-amber-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Prep: {recipe.prepTime}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Cook: {recipe.cookTime}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{recipe.servings} servings</span>
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
              {recipe.ingredients.map((ingredient, index) => (
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
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-rose-400 to-orange-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-amber-800 leading-relaxed pt-1">{instruction}</p>
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
