import { afterAll, beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";

import { createApp } from "../src/server.js";

let apollo;
let request;

beforeAll(async () => {
  const created = await createApp({ env: "test" });
  apollo = created.apollo;
  request = supertest(created.app);
});

afterAll(() => apollo.stop());

const search = (variables) =>
  request
    .post("/graphql")
    .set("content-type", "application/json")
    .send({
      query: `query Search($term: String!, $maxPrice: Float) {
        searchItems(term: $term, maxPrice: $maxPrice) { category item { name price } }
      }`,
      variables,
    });

describe("searchItems", () => {
  it("matches names and ingredients case-insensitively, cheapest first", async () => {
    const response = await search({ term: "  GUACAMOLE " });
    const results = response.body.data.searchItems;

    expect(response.status).toBe(200);
    expect(results.map((r) => r.item.name)).toContain("Mexi Burger*");
    expect(results.map((r) => r.category)).toEqual(expect.arrayContaining(["fajitas", "tacos", "sandwiches"]));
    const prices = results.map((r) => r.item.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("filters by maxPrice inclusively", async () => {
    const response = await search({ term: "salad", maxPrice: 9.95 });
    const results = response.body.data.searchItems;

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.item.price <= 9.95)).toBe(true);
    expect(results.map((r) => r.item.name)).toContain("Mediterranean Salad");
  });

  it("returns an empty list when nothing matches", async () => {
    const response = await search({ term: "durian" });

    expect(response.body).toEqual({ data: { searchItems: [] } });
  });

  it.each([
    [{ term: "a" }, "term", /2 to 50 characters/],
    [{ term: "   " }, "term", /2 to 50 characters/],
    [{ term: "x".repeat(51) }, "term", /2 to 50 characters/],
    [{ term: "salad", maxPrice: -1 }, "maxPrice", /cannot be negative/],
  ])("rejects %j as bad user input", async (variables, argumentName, message) => {
    const response = await search(variables);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(response.body.errors[0]).toMatchObject({
      extensions: { code: "BAD_USER_INPUT", argumentName },
    });
    expect(response.body.errors[0].message).toMatch(message);
  });

  it("rejects a missing term before resolving", async () => {
    const response = await search({});

    expect(response.status).toBe(400);
    expect(response.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });
});
