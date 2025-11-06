import express from "express";
import { expressMiddleware } from "@as-integrations/express5";

import { createApollo } from "./graphql/apollo.js";
import { menu as defaultMenu } from "./menu.js";

export async function createApp({ menu = defaultMenu, env = process.env.NODE_ENV, plugins } = {}) {
  const apollo = createApollo({ menu, env, plugins });
  await apollo.start();

  const app = express();
  app.disable("x-powered-by");

  app.get("/", (req, res) => res.json({ status: "ok", graphql: "/graphql" }));
  app.use("/graphql", express.json({ limit: "16kb" }), expressMiddleware(apollo));

  // Express's default handler answers bad JSON or oversized bodies with an
  // HTML page that includes the stack trace outside production.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status ?? err.statusCode ?? 500;
    const message = status < 500 ? err.message : "Internal server error";
    if (status >= 500) console.error(err);
    res.status(status).json({ errors: [{ message }] });
  });

  return { app, apollo };
}
