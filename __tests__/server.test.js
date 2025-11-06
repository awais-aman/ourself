import supertest from "supertest";

import { menu as menuData } from "../src/menu.js";
import { server } from "../src/server.js";

const requestWithSupertest = supertest(server);

describe("POST /graphql", () => {
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
    const response = await requestWithSupertest.post("/graphql").send({
      query: `
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
    });
    const {
      data: { menu },
    } = response.body;

    expect(response.status).toBe(200);
    expect(menu).toEqual(expectedResponse);
  });

  it("should give an error when requesting invalid menu item", async () => {
    const response = await requestWithSupertest.post("/graphql").send({
      query: `
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
    });

    expect(response.status).toBe(400);
    expect(response.body.data).toBeUndefined();
    expect(response.body).toHaveProperty("errors");
  });
});
