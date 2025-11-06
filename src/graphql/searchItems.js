import { GraphQLError } from "graphql";

export const TERM_MIN = 2;
export const TERM_MAX = 50;

function badInput(message, argumentName) {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT", argumentName } });
}

export function searchItems(menu, { term, maxPrice }) {
  const needle = term.trim().toLowerCase();
  if (needle.length < TERM_MIN || needle.length > TERM_MAX) {
    throw badInput(`term must be ${TERM_MIN} to ${TERM_MAX} characters long.`, "term");
  }
  if (maxPrice != null && maxPrice < 0) {
    throw badInput("maxPrice cannot be negative.", "maxPrice");
  }

  return Object.entries(menu)
    .flatMap(([category, { items }]) => items.map((item) => ({ category, item })))
    .filter(({ item }) => `${item.name} ${item.ingredients}`.toLowerCase().includes(needle))
    .filter(({ item }) => maxPrice == null || item.price <= maxPrice)
    .sort((a, b) => a.item.price - b.item.price);
}
