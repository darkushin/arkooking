
import { Clock, Users } from 'lucide-react';
import { Recipe } from '../types/Recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const RecipeCard = ({ recipe, onClick }: RecipeCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-amber-100 to-rose-100">
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
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-xs font-medium text-amber-800">
            {recipe.tags[0] || 'Recipe'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-amber-900 mb-2 line-clamp-2">
          {recipe.title}
        </h3>
        <p className="text-amber-700 text-sm mb-3 line-clamp-2">
          {recipe.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-amber-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{recipe.cookTime + recipe.prepTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {recipe.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {recipe.tags.length > 3 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
              +{recipe.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
