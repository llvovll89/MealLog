import type { DietaryRestrictions, MenuItem } from '../types';
import { isIngredientInfo, isIngredientTag } from '../data/ingredients';

// A restriction is a hard exclusion, never a score penalty or a fallback suggestion.
export const matchesDietaryRestrictions=(menu:MenuItem, restrictions:DietaryRestrictions):boolean=>{
  if(restrictions.needsReview||!Array.isArray(restrictions.excludedIngredients)||!restrictions.excludedIngredients.every(isIngredientTag))return false;
  if(!restrictions.excludedIngredients.length)return true;
  if(!isIngredientInfo(menu.ingredientInfo)||!menu.ingredientInfo.complete)return false;
  const excluded=new Set(restrictions.excludedIngredients);
  return ![...menu.ingredientInfo.contains,...menu.ingredientInfo.mayContain].some(tag=>excluded.has(tag));
};
