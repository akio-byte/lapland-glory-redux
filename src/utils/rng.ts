export const randomInt = (max: number): number => Math.floor(Math.random() * max);

export const pickOne = <T>(items: T[]): T | undefined => {
  if (items.length === 0) return undefined;
  return items[randomInt(items.length)];
};
