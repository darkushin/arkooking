import { Clock, Users, ChefHat, Link as LinkIcon } from 'lucide-react';
import { Recipe } from '../types/Recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const RecipeCard = ({ recipe, onClick }: RecipeCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-4 flex gap-4 items-center hover:shadow-md transition-all cursor-pointer"
    >
      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
        {recipe.images && recipe.images.length > 0 ? (
          <img
            src={recipe.images[0]}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center">
            <span className="text-4xl">🍳</span>
          </div>
        )}
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-amber-900 mb-1">{recipe.title}</h3>
        <p className="text-amber-700 text-sm line-clamp-2 mb-2">{recipe.description}</p>
        {recipe.user_full_name && (
          <div className="flex items-center gap-2 mb-2 text-amber-800 text-xs">
            <ChefHat className="w-3 h-3" />
            <span>{recipe.user_full_name}</span>
          </div>
        )}
        {recipe.link && (
          <div className="flex items-center gap-2 mb-2 text-amber-700 text-xs">
            <LinkIcon className="w-3 h-3" />
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
