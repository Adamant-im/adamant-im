/**
 * Flatten a nested object into a flat structure with keys representing the path to each value.
 * @param {object} obj - The nested object to flatten.
 * @param {string} [parentKey=""] - The base key for the current nesting level (used recursively).
 * @param {object} [result={}] - The object to store the flattened result (used recursively).
 * @returns {object} - A flat object where keys represent the path to the values in the original object.
 *
 * @example
 * const data = {
 *   name: "John",
 *   age: 42,
 *   children: {
 *     first: {
 *       name: "Kelvin",
 *       age: 12,
 *     },
 *     second: {
 *       name: "Henry",
 *       age: 15,
 *     },
 *   },
 * };
 *
 * const flatData = flattenData(data);
 * console.log(flatData);
 * // {
 * //   "name": "John",
 * //   "age": 42,
 * //   "children[first][name]": "Kelvin",
 * //   "children[first][age]": 12,
 * //   "children[second][name]": "Henry",
 * //   "children[second][age]": 15,
 * // }
 */
const flattenData = (obj: object, parentKey: string = "", result: Record<string, any> = {}): Record<string, any> => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}[${key}]` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        flattenData(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
};

export default flattenData;
