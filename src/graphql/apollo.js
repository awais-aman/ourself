import { ApolloServer } from "@apollo/server";
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";

import { typeDefs } from "./typeDefs.js";
import { queryLimitsRule } from "./limits.js";

export function createApollo({ menu, env, plugins = [] }) {
  const production = env === "production";

  return new ApolloServer({
    typeDefs,
    resolvers: {
      Query: {
        menu: () => menu,
      },
    },
    introspection: !production,
    // Apollo only hides stack traces when NODE_ENV is production or test,
    // so an unset NODE_ENV would leak them. Show them in development only.
    includeStacktraceInErrorResponses: env === "development",
    validationRules: [queryLimitsRule()],
    formatError(formattedError) {
      if (production && formattedError.extensions?.code === ApolloServerErrorCode.INTERNAL_SERVER_ERROR) {
        return {
          message: "Internal server error",
          extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
        };
      }
      return formattedError;
    },
    // The default production landing page pulls scripts from Apollo's CDN.
    plugins: production ? [...plugins, ApolloServerPluginLandingPageDisabled()] : plugins,
  });
}
