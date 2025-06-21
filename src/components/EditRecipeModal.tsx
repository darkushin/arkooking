import { useState, useRef, useEffect } from 'react';
import { X, Plus, Camera, Trash2 } from 'lucide-react';
import { Recipe } from '../types/Recipe';
import { commonTags } from '@/lib/categories';
import { Switch } from '@/components/ui/switch';

interface EditRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  recipe: Recipe | null;
}

const EditRecipeModal = ({ isOpen, onClose, onEdit, recipe: initialRecipe }: EditRecipeModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [cookTime, setCookTime] = useState(30);
  const [prepTime, setPrepTime] = useState(15);
  const [servings, setServings] = useState(4);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [isPrivate, setIsPrivate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title);
      setDescription(initialRecipe.description || '');
      setImage(initialRecipe.image || '');
      setCookTime(initialRecipe.cookTime);
      setPrepTime(initialRecipe.prepTime);
      setServings(initialRecipe.servings);
      setTags(initialRecipe.tags);
      setIngredients(initialRecipe.ingredients.length > 0 ? initialRecipe.ingredients : ['']);
      setInstructions(initialRecipe.instructions.length > 0 ? initialRecipe.instructions : ['']);
      setIsPrivate(initialRecipe.visibility === 'private');
    }
  }, [initialRecipe]);

  if (!isOpen || !initialRecipe) return null;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addIngredient = () => {
    setIngredients(prev => [...prev, '']);
  };

  const updateIngredient = (index: number, value: string) => {
    setIngredients(prev => prev.map((ingredient, i) => i === index ? value : ingredient));
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addInstruction = () => {
    setInstructions(prev => [...prev, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    setInstructions(prev => prev.map((instruction, i) => i === index ? value : instruction));
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !initialRecipe) return;

    const editedRecipe: Recipe = {
      ...initialRecipe,
      title: title.trim(),
      description: description.trim(),
      image: image || undefined,
      cookTime,
      prepTime,
      servings,
      tags,
      ingredients: ingredients.filter(ing => ing.trim()),
      instructions: instructions.filter(inst => inst.trim()),
      visibility: isPrivate ? 'private' : 'public',
    };

    onEdit(editedRecipe);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl max-w-md w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-100">
          <h2 className="text-xl font-bold text-amber-900">Edit Recipe</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-amber-700" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="p-6 space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Recipe Photo</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-32 border-2 border-dashed border-amber-200 rounded-xl cursor-pointer hover:border-amber-300 transition-colors ${
                  image ? 'p-0' : 'flex items-center justify-center'
                }`}
              >
                {image ? (
                  <img src={image} alt="Recipe" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-600 text-sm">Tap to add photo</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Recipe Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter recipe title"
                className="w-full p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your recipe"
                rows={3}
                className="w-full p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
              />
            </div>

            {/* Time and Servings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">Prep Time</label>
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  min="0"
                  className="w-full p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <span className="text-xs text-amber-600">minutes</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">Cook Time</label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(Number(e.target.value))}
                  min="0"
                  className="w-full p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <span className="text-xs text-amber-600">minutes</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">Servings</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  min="1"
                  className="w-full p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-amber-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  className="flex-1 p-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                />
                <button
                  type="button"
                  onClick={() => addTag(newTag)}
                  className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {commonTags.filter(tag => !tags.includes(tag)).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Ingredients</label>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder="e.g., 2 cups flour"
                      className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      disabled={ingredients.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="mt-3 px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                <Plus className="w-4 h-4 inline-block mr-1" />
                Add Ingredient
              </button>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Instructions</label>
              <div className="space-y-3">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="pt-2 text-sm font-bold text-amber-500">{index + 1}.</span>
                    <textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder="e.g., Mix all dry ingredients..."
                      rows={2}
                      className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors mt-1"
                      disabled={instructions.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addInstruction}
                className="mt-3 px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                <Plus className="w-4 h-4 inline-block mr-1" />
                Add Instruction
              </button>
            </div>
            
            {/* Visibility */}
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                <div>
                    <label htmlFor="visibility" className="text-sm font-medium text-amber-900">
                        Private Recipe
                    </label>
                    <p className="text-xs text-amber-600">
                        Private recipes are only visible to you.
                    </p>
                </div>
                <Switch
                    id="visibility"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-amber-100">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecipeModal; 