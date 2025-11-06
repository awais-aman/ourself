import express from "express";
import { expressMiddleware } from "@as-integrations/express5";

import { apollo } from "./graphql/apollo.js";

const app = express();

app.use(express.json());

await apollo.start();

app.get("/", (req, res) => res.send("Server is running"));
app.use("/graphql", expressMiddleware(apollo));

export const server = app;
