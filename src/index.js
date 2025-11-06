import http from "node:http";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { createApp } from "./server.js";

const port = Number(process.env.PORT ?? 3000);
const httpServer = http.createServer();
// Apollo stops itself on SIGINT/SIGTERM; the drain plugin lets in-flight
// requests finish before the HTTP server closes.
const { app } = await createApp({
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

httpServer.on("request", app);
httpServer.listen(port, () => console.log(`Menu API listening on http://localhost:${port}/graphql`));

