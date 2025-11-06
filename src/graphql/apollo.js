import { ApolloServer } from "@apollo/server";
import { typeDefs } from "./typeDefs.js";
import { menu } from "../menu.js";

export const apollo = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      menu() {
        return menu;
      },
    },
  },
});
