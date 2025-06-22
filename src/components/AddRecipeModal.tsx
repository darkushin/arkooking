import { useState, useRef, useEffect } from 'react';
import { X, Plus, Camera, Trash2 } from 'lucide-react';
import { Recipe } from '../types/Recipe';
import { commonTags } from '@/lib/categories';
import { Switch } from '@/components/ui/switch';
import { UserRole } from '@/hooks/useAuth';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (recipe: Omit<Recipe, 'id' | 'user_id'>) => void;
  userRole: UserRole | undefined;
}

const AddRecipeModal = ({ isOpen, onClose, onAdd, userRole }: AddRecipeModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [cookTime, setCookTime] = useState(30);
  const [prepTime, setPrepTime] = useState(15);
  const [servings, setServings] = useState(4);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [isPrivate, setIsPrivate] = useState(userRole === 'Editor');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setTitle('');
      setDescription('');
      setImages([]);
      setCookTime(30);
      setPrepTime(15);
      setServings(4);
      setTags([]);
      setNewTag('');
      setIngredients(['']);
      setInstructions(['']);
      setIsPrivate(userRole === 'Editor');
    }
  }, [isOpen, userRole]);

  if (!isOpen) return null;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      let filesToProcess = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
          }
          filesToProcess--;
          if (filesToProcess === 0) {
            setImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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
    
    if (!title.trim()) return;

    const recipe: Omit<Recipe, 'id' | 'user_id'> = {
      title: title.trim(),
      description: description.trim(),
      images: images,
      cookTime,
      prepTime,
      servings,
      tags,
      ingredients: ingredients.filter(ing => ing.trim()),
      instructions: instructions.filter(inst => inst.trim()),
      visibility: isPrivate ? 'private' : 'public',
    };

    onAdd(recipe);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl max-w-md w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-100">
          <h2 className="text-xl font-bold text-amber-900">Add New Recipe</h2>
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
              <label className="block text-sm font-medium text-amber-900 mb-2">Recipe Photos</label>
              <div className="grid grid-cols-3 gap-4 mb-2">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img src={image} alt={`Recipe image ${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-amber-200 rounded-xl cursor-pointer hover:border-amber-300 transition-colors flex items-center justify-center"
                >
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-600 text-sm">Add</p>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                multiple
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
              <div className="flex flex-wrap gap-2">
                {commonTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors border ${tags.includes(tag)
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                  >
                    {tag}
                    {tags.includes(tag) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Ingredients</label>
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder="Enter ingredient"
                      className="flex-1 p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIngredient}
                  className="w-full p-3 border-2 border-dashed border-amber-200 rounded-xl text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Ingredient
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Instructions</label>
              <div className="space-y-2">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-rose-400 to-orange-400 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                      {index + 1}
                    </div>
                    <textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder="Enter instruction step"
                      rows={2}
                      className="flex-1 p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                    />
                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addInstruction}
                  className="w-full p-3 border-2 border-dashed border-amber-200 rounded-xl text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Step
                </button>
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center gap-3">
              <Switch id="private-switch" checked={isPrivate} onCheckedChange={setIsPrivate} />
              <label htmlFor="private-switch" className="text-sm font-medium text-amber-900 select-none cursor-pointer">
                Private Recipe
              </label>
              <span className="text-xs text-amber-600">(Only you will see this if enabled. Default is public.)</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full p-4 bg-gradient-to-r from-rose-400 to-orange-400 text-white rounded-xl font-medium hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Save Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipeModal;
