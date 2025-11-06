import { describe, expect, it } from "vitest";
import { buildSchema, parse, validate } from "graphql";

import { queryLimitsRule } from "../src/graphql/limits.js";

const schema = buildSchema(`
  type Node { name: String child: Node }
  type Query { node: Node }
`);

const check = (query, limits) => validate(schema, parse(query), [queryLimitsRule(limits)]).map((e) => e.message);

describe("queryLimitsRule", () => {
  it("accepts queries within the limits", () => {
    expect(check(`{ node { child { name } } }`, { maxDepth: 3, maxFields: 3 })).toEqual([]);
  });

  it("rejects queries nested deeper than maxDepth", () => {
    expect(check(`{ node { child { child { name } } } }`, { maxDepth: 3 })).toEqual([
      "Query depth 4 exceeds the limit of 3.",
    ]);
  });

  it("counts depth through named and inline fragments", () => {
    const query = `{ node { ...F } } fragment F on Node { child { ... on Node { child { name } } } }`;
    expect(check(query, { maxDepth: 3 })).toEqual(["Query depth 4 exceeds the limit of 3."]);
  });

  it("counts every aliased field", () => {
    expect(check(`{ a: node { name } b: node { name } }`, { maxFields: 3 })).toEqual([
      "Query selects 4 fields; the limit is 3.",
    ]);
  });

  it("ignores introspection fields", () => {
    expect(check(`{ __schema { types { fields { type { ofType { name } } } } } }`, { maxDepth: 1 })).toEqual([]);
  });
});
