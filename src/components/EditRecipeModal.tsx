import { useState, useRef } from 'react';
import { X, Plus, Camera, Trash2, Loader2 } from 'lucide-react';
import { Recipe } from '../types/Recipe';
import { commonTags } from '@/lib/categories';
import { Switch } from '@/components/ui/switch';
import { SUPABASE_ANON_KEY, SUPABASE_FUNCTIONS_URL } from '@/integrations/supabase/access';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EditRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  recipe: Recipe | null;
  form: any;
  setForm: (form: any) => void;
}

// Sortable ingredient item component
function SortableIngredient({ id, index, ingredient, updateIngredient, removeIngredient, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
      className="flex gap-2 items-center bg-white rounded-lg border border-amber-100 shadow-sm px-2 py-1"
      {...attributes}
      {...listeners}
    >
      <span className="text-amber-400 font-bold select-none cursor-grab">≡</span>
      <input
        type="text"
        value={ingredient}
        onChange={(e) => updateIngredient(index, e.target.value)}
        placeholder="e.g., 2 cups flour"
        className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      {disabled ? null : (
        <button
          type="button"
          onClick={() => removeIngredient(index)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

const EditRecipeModal = ({ isOpen, onClose, onEdit, recipe: initialRecipe, form, setForm }: EditRecipeModalProps) => {
  // All hooks at the top!
  const [tagError, setTagError] = useState('');
  const [autoExtract, setAutoExtract] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // DnD-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Now do the early return
  if (!isOpen || !initialRecipe || !form) return null;

  // Helper setters
  const setField = (field: string, value: any) => {
    setForm(prevForm => ({
      ...prevForm,
      [field]: typeof value === 'function' ? value(prevForm[field]) : value,
    }));
  };

  const handleSetPreviewImage = (indexToMakeFirst: number) => {
    if (indexToMakeFirst === 0) return;

    setField('images', currentImages => {
      const newImages = [...currentImages];
      const itemToMove = newImages.splice(indexToMakeFirst, 1)[0];
      newImages.unshift(itemToMove);
      return newImages;
    });
  };

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
            setField('images', prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setField('images', prev => prev.filter((_, i) => i !== index));
  };

  const addTag = (tag: string) => {
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag], newTag: '' });
    } else {
      setForm({ ...form, newTag: '' });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
  };

  const addIngredient = () => {
    setField('ingredients', prev => [...prev, '']);
  };

  const updateIngredient = (index: number, value: string) => {
    setField('ingredients', prev => prev.map((ingredient, i) => i === index ? value : ingredient));
  };

  const removeIngredient = (index: number) => {
    if (form.ingredients.length > 1) {
      setField('ingredients', prev => prev.filter((_, i) => i !== index));
    }
  };

  const addInstruction = () => {
    setField('instructions', prev => [...prev, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    setField('instructions', prev => prev.map((instruction, i) => i === index ? value : instruction));
  };

  const removeInstruction = (index: number) => {
    if (form.instructions.length > 1) {
      setField('instructions', prev => prev.filter((_, i) => i !== index));
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
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        instructions: Array.isArray(data.instructions) ? data.instructions : [],
        cookTime: Number(data.cookTime) || 0,
        prepTime: Number(data.prepTime) || 0,
        servings: Number(data.servings) || 0,
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
    
    if (!form.title.trim() || !initialRecipe) return;
    if (form.tags.length === 0) {
      setTagError('Please select at least one category for your recipe.');
      return;
    } else {
      setTagError('');
    }

    const editedRecipe: Recipe = {
      ...initialRecipe,
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
      link: form.link.trim(),
    };

    onEdit(editedRecipe);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = form.ingredients.findIndex((_, i) => i === Number(active.id));
      const newIndex = form.ingredients.findIndex((_, i) => i === Number(over.id));
      setField('ingredients', prev => arrayMove(prev, oldIndex, newIndex));
    }
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
              <label className="block text-sm font-medium text-amber-900 mb-2">Recipe Photos</label>
              <p className="text-sm text-amber-600 mb-2">Click an image to set it as the preview.</p>
              <div className="grid grid-cols-3 gap-4 mb-2">
                {(Array.isArray(form.images) ? form.images : []).map((image, index) => (
                  <div
                    key={image}
                    onClick={() => handleSetPreviewImage(index)}
                    className={`relative aspect-square rounded-xl cursor-pointer transition-all ${
                      index === 0 ? 'ring-2 ring-amber-500 ring-offset-2' : 'hover:ring-2 hover:ring-amber-200'
                    }`}
                  >
                    <img src={image} alt={`Recipe image ${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                        Preview
                      </div>
                    )}
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
              <div className="flex flex-wrap gap-2 mb-3">
                {form.tags.map(tag => (
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
                  value={form.newTag}
                  onChange={(e) => setField('newTag', e.target.value)}
                  placeholder="Add a tag"
                  className="flex-1 p-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(form.newTag))}
                />
                <button
                  type="button"
                  onClick={() => addTag(form.newTag)}
                  className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {commonTags.filter(tag => !form.tags.includes(tag)).map(tag => (
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={form.ingredients.map((_, i) => i)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {form.ingredients.map((ingredient, index) => (
                      <SortableIngredient
                        key={index}
                        id={index}
                        index={index}
                        ingredient={ingredient}
                        updateIngredient={updateIngredient}
                        removeIngredient={removeIngredient}
                        disabled={form.ingredients.length <= 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
                {form.instructions.map((instruction, index) => (
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
                      disabled={form.instructions.length <= 1}
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
                    checked={form.isPrivate}
                    onCheckedChange={(checked) => setField('isPrivate', checked)}
                />
            </div>

            {/* Submit Button */}
            {tagError && (
              <div className="mb-4 text-xs text-red-600 font-medium text-center">{tagError}</div>
            )}
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