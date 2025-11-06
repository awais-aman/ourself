import { describe, expect, it } from "vitest";

import { menu } from "../src/menu.js";

const categories = Object.entries(menu);

describe("menu data", () => {
  it.each(categories)("%s has uniquely named items", (_, category) => {
    const names = category.items.map((item) => item.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(categories)("%s has plain text with no HTML entities or line breaks", (_, category) => {
    const text = [category.description ?? "", ...category.items.flatMap((i) => [i.name, i.ingredients])];
    for (const value of text) {
      expect(value).not.toMatch(/&[a-z]+;|\n/);
    }
  });

  it.each(categories)("%s has positive prices", (_, category) => {
    for (const item of category.items) {
      expect(item.price).toBeGreaterThan(0);
    }
  });
});
