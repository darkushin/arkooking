import { useState, useRef, useEffect, useRef as useReactRef } from 'react';
import { X, Plus, Camera, Trash2, Loader2 } from 'lucide-react';
import { Recipe } from '../types/Recipe';
import { commonTags } from '@/lib/categories';
import { Switch } from '@/components/ui/switch';
import { UserRole } from '@/hooks/useAuth';
import { SUPABASE_ANON_KEY, SUPABASE_FUNCTIONS_URL } from '@/integrations/supabase/access';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (recipe: Omit<Recipe, 'id'>) => void;
  userRole: UserRole | undefined;
  initialTag?: string;
  isAddModalOpen?: boolean;
  form: any;
  setForm: (form: any) => void;
}

const getInitialFormState = (initialTag: string | undefined, userRole: UserRole | undefined) => {
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

const AddRecipeModal = ({ isOpen, onClose, onAdd, userRole, initialTag, isAddModalOpen, form, setForm }: AddRecipeModalProps) => {
  const [tagError, setTagError] = useState('');
  const [autoExtract, setAutoExtract] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper setters
  const setField = (field: string, value: any) => setForm({ ...form, [field]: value });

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
            setField('images', [...form.images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setField('images', form.images.filter((_, i) => i !== index));
  };

  const addTag = (tag: string) => {
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag], newTag: '' });
    } else {
      setForm({ ...form, newTag: '' });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setField('tags', form.tags.filter(tag => tag !== tagToRemove));
  };

  const addIngredient = () => {
    setField('ingredients', [...form.ingredients, '']);
  };

  const updateIngredient = (index: number, value: string) => {
    setField('ingredients', form.ingredients.map((ingredient, i) => i === index ? value : ingredient));
  };

  const removeIngredient = (index: number) => {
    if (form.ingredients.length > 1) {
      setField('ingredients', form.ingredients.filter((_, i) => i !== index));
    }
  };

  const addInstruction = () => {
    setField('instructions', [...form.instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    setField('instructions', form.instructions.map((instruction, i) => i === index ? value : instruction));
  };

  const removeInstruction = (index: number) => {
    if (form.instructions.length > 1) {
      setField('instructions', form.instructions.filter((_, i) => i !== index));
    }
  };

  const handleAutoExtract = async () => {
    if (!form.link.trim()) {
      setExtractError('Please enter a valid link first.');
      setAutoExtract(false);
      return;
    }
    setExtractError('');
    setExtractLoading(true);
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/extract-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ link: form.link.trim() }),
      });
      if (!res.ok) throw new Error('Extraction failed');
      const data = await res.json();
      setForm({
        ...form,
        title: data.title || '',
        description: data.description || '',
        images: data.images || [],
        cookTime: Number(data.cookTime) || 0,
        prepTime: Number(data.prepTime) || 0,
        servings: Number(data.servings) || 0,
        ingredients: data.ingredients && data.ingredients.length > 0 ? data.ingredients : [''],
        instructions: data.instructions && data.instructions.length > 0 ? data.instructions : [''],
        tags: Array.isArray(data.tags)
          ? Array.from(new Set([...form.tags, ...data.tags]))
          : form.tags,
      });
    } catch (err) {
      setExtractError('Failed to extract recipe. Please check the link or try again.');
    } finally {
      setExtractLoading(false);
      setAutoExtract(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.tags.length === 0) {
      setTagError('Please select at least one category for your recipe.');
      return;
    } else {
      setTagError('');
    }
    const recipe: Omit<Recipe, 'id'> = {
      title: form.title.trim(),
      description: form.description.trim(),
      images: form.images,
      cookTime: form.cookTime,
      prepTime: form.prepTime,
      servings: form.servings,
      tags: form.tags,
      ingredients: form.ingredients.filter(ing => ing.trim()),
      instructions: form.instructions.filter(inst => inst.trim()),
      visibility: form.isPrivate ? 'private' : 'public',
      user_id: '', // will be set in the hook
      link: form.link.trim(),
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
                {form.images.map((image, index) => (
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
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Enter recipe title"
                className="w-full p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
              <label className="block text-sm font-medium text-amber-900 mb-2 mt-4">Original Recipe Link</label>
              <input
                type="url"
                value={form.link}
                onChange={(e) => setField('link', e.target.value)}
                placeholder="https://example.com/original-recipe"
                className="w-full p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <div className="flex items-center gap-3 mt-2 mb-2">
                <Switch id="auto-extract-switch" checked={autoExtract} onCheckedChange={(checked) => {
                  setAutoExtract(checked);
                  if (checked) handleAutoExtract();
                }} />
                <label htmlFor="auto-extract-switch" className="text-sm text-amber-900 select-none cursor-pointer">
                  Auto-extract from link
                </label>
                {extractLoading && <Loader2 className="animate-spin w-4 h-4 text-amber-700" />}
              </div>
              {extractError && <div className="mb-2 text-xs text-red-600 font-medium">{extractError}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
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
                  value={form.prepTime}
                  onChange={(e) => setField('prepTime', Number(e.target.value))}
                  min="0"
                  className="w-full p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <span className="text-xs text-amber-600">minutes</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">Cook Time</label>
                <input
                  type="number"
                  value={form.cookTime}
                  onChange={(e) => setField('cookTime', Number(e.target.value))}
                  min="0"
                  className="w-full p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <span className="text-xs text-amber-600">minutes</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">Servings</label>
                <input
                  type="number"
                  value={form.servings}
                  onChange={(e) => setField('servings', Number(e.target.value))}
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
                    onClick={() => form.tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors border ${form.tags.includes(tag)
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                  >
                    {tag}
                    {form.tags.includes(tag) && (
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
                {form.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder="Enter ingredient"
                      className="flex-1 p-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    {form.ingredients.length > 1 && (
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
                {form.instructions.map((instruction, index) => (
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
                    {form.instructions.length > 1 && (
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
              <Switch id="private-switch" checked={form.isPrivate} onCheckedChange={val => setField('isPrivate', val)} />
              <label htmlFor="private-switch" className="text-sm font-medium text-amber-900 select-none cursor-pointer">
                Private Recipe
              </label>
              <span className="text-xs text-amber-600">(Only you will see this if enabled. Default is public.)</span>
            </div>

            {/* Submit Button */}
            {tagError && (
              <div className="mb-4 text-xs text-red-600 font-medium text-center">{tagError}</div>
            )}
            <button
              type="submit"
              disabled={!form.title.trim()}
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
