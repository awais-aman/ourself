import { afterAll, beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";

import { menu as menuData } from "../src/menu.js";
import { createApp } from "../src/server.js";

const started = [];

async function startApp(options) {
  const { app, apollo } = await createApp(options);
  started.push(apollo);
  return supertest(app);
}

const gql = (request, query, variables) =>
  request.post("/graphql").set("content-type", "application/json").send({ query, variables });

afterAll(() => Promise.all(started.map((apollo) => apollo.stop())));

describe("POST /graphql", () => {
  let request;

  beforeAll(async () => {
    request = await startApp({ env: "test" });
  });

  it("should return restaurant menu for appetizers and entrees", async () => {
    const expectedResponse = {
      appetizers: {
        ...menuData.appetizers,
        description: null,
      },
      entrees: {
        ...menuData.entrees,
        description: null,
      },
    };
    const response = await gql(
      request,
      `
      query {
        menu {
          appetizers {
            description
            items {
              name
              ingredients
              price
            }
          }
          entrees {
            description
            items {
              name
              ingredients
              price
            }
          }
        }
      }
      `,
    );
    const {
      data: { menu },
    } = response.body;

    expect(response.status).toBe(200);
    expect(menu).toEqual(expectedResponse);
  });

  it("returns every category of the menu", async () => {
    const response = await gql(request, `{ menu { ${Object.keys(menuData).map((c) => `${c} { items { name } }`).join(" ")} } }`);

    expect(response.status).toBe(200);
    for (const [category, { items }] of Object.entries(menuData)) {
      expect(response.body.data.menu[category].items).toHaveLength(items.length);
    }
  });

  it("should give an error when requesting invalid menu item", async () => {
    const response = await gql(
      request,
      `
      query {
        menu {
          continental {
            description
            items {
              name
              ingredients
              price
            }
          }
        }
      }
      `,
    );

    expect(response.status).toBe(400);
    expect(response.body.data).toBeUndefined();
    expect(response.body.errors[0].extensions.code).toBe("GRAPHQL_VALIDATION_FAILED");
  });

  it("rejects alias floods that select too many fields", async () => {
    const aliases = Array.from({ length: 60 }, (_, i) => `m${i}: menu { quiche { description } }`).join(" ");
    const response = await gql(request, `{ ${aliases} }`);

    expect(response.status).toBe(400);
    expect(response.body.errors[0].extensions.code).toBe("GRAPHQL_VALIDATION_FAILED");
    expect(response.body.errors[0].message).toMatch(/limit is 150/);
  });

  it("does not hang on cyclic fragments", async () => {
    const response = await gql(
      request,
      `{ menu { ...A } } fragment A on Menu { ...B } fragment B on Menu { ...A quiche { description } }`,
    );

    expect(response.status).toBe(400);
    expect(response.body.errors[0].message).toMatch(/Cannot spread fragment/);
  });

  it("answers malformed JSON with a JSON error and no stack trace", async () => {
    const response = await request.post("/graphql").set("content-type", "application/json").send("{ not json");

    expect(response.status).toBe(400);
    expect(response.type).toBe("application/json");
    expect(JSON.stringify(response.body)).not.toMatch(/at .*\.js/);
  });

  it("refuses request bodies over 16 kB", async () => {
    const response = await gql(request, `{ menu { quiche { description } } }`, { padding: "x".repeat(20_000) });

    expect(response.status).toBe(413);
    expect(response.body.errors[0].message).toMatch(/too large/);
  });

  it("allows introspection outside production", async () => {
    const response = await gql(request, `{ __schema { queryType { name } } }`);

    expect(response.status).toBe(200);
    expect(response.body.data.__schema.queryType.name).toBe("Query");
  });
});

describe("GET /", () => {
  it("reports that the service is up", async () => {
    const request = await startApp({ env: "test" });
    const response = await request.get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", graphql: "/graphql" });
  });
});

describe("in production", () => {
  const brokenMenu = {
    get appetizers() {
      throw new Error("connection to menu-db.internal:5432 refused");
    },
  };

  it("disables introspection", async () => {
    const request = await startApp({ env: "production" });
    const response = await gql(request, `{ __schema { queryType { name } } }`);

    expect(response.status).toBe(400);
    expect(response.body.errors[0].message).toMatch(/introspection is not allowed/i);
  });

  it("masks internal errors and omits stack traces", async () => {
    const request = await startApp({ env: "production", menu: brokenMenu });
    const response = await gql(request, `{ menu { appetizers { description } } }`);

    expect(response.body.errors).toEqual([
      expect.objectContaining({
        message: "Internal server error",
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      }),
    ]);
    expect(JSON.stringify(response.body)).not.toMatch(/menu-db|stacktrace/);
  });

  it("does not serve the CDN-backed landing page", async () => {
    const request = await startApp({ env: "production" });
    const response = await request.get("/graphql").set("accept", "text/html");

    expect(response.text).not.toMatch(/apollographql\.com/);
  });
});

describe("in development", () => {
  it("keeps the error message and stack trace for debugging", async () => {
    const request = await startApp({
      env: "development",
      menu: {
        get appetizers() {
          throw new Error("boom");
        },
      },
    });
    const response = await gql(request, `{ menu { appetizers { description } } }`);

    expect(response.body.errors[0].message).toBe("boom");
    expect(response.body.errors[0].extensions.stacktrace).toBeInstanceOf(Array);
  });
});
