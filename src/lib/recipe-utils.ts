import Fraction from 'fraction.js';

/**
 * Scales the numeric quantity in an ingredient string by a given factor.
 * e.g., scaleIngredient("2 cups of flour", 2) => "4 cups of flour"
 * e.g., scaleIngredient("1/2 tsp salt", 3) => "1 1/2 tsp salt"
 * @param ingredient The ingredient string.
 * @param factor The factor to scale the quantity by.
 * @returns The ingredient string with the scaled quantity.
 */
export const scaleIngredient = (ingredient: string, factor: number): string => {
  // Regex to find a number at the beginning of the string.
  // Handles integers, decimals, fractions, and mixed numbers.
  // e.g., "1", "1.5", "1/2", "1 1/2"
  const regex = /^(\d+\s+\d\/\d+|\d+\/\d+|\d*\.\d+|\d+)\s*/;
  const match = ingredient.match(regex);

  // If no numeric quantity is found, return the original string.
  if (!match) {
    return ingredient;
  }

  const quantityStr = match[1];
  const restOfIngredient = ingredient.substring(match[0].length);

  try {
    const originalQuantity = new Fraction(quantityStr);
    const newQuantity = originalQuantity.mul(factor);

    // Don't show fractions for whole numbers
    if (newQuantity.d === 1) {
      return `${newQuantity.n} ${restOfIngredient}`.trim();
    }
    
    // Format the new quantity as a mixed number (e.g., "1 1/2")
    const newQuantityStr = newQuantity.toFraction(true);

    return `${newQuantityStr} ${restOfIngredient}`.trim();
  } catch (e) {
    // If parsing fails, return the original string.
    console.error(`Could not parse ingredient quantity: ${quantityStr}`, e);
    return ingredient;
  }
}; 