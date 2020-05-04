// serverless entrypoint
const { ApolloServer, AuthenticationError } = require('apollo-server-lambda');
const RecipesAPI = require('./datasources/recipes');
const schema = require('./schema');
const tokenVerifier = require('./utils/token-verifier');

const server = new ApolloServer({
  ...schema,
  dataSources: () => ({
    recipesAPI: new RecipesAPI(),
  }),
  context: async ({ event, context }) => {
    const baseContext = {
      headers: event.headers,
      functionName: context.functionName,
      event,
      context,
    };

    // if there is an access token, verify it, we'll use this to
    // enable mutations
    if (event.headers.Authorization) {
      try {
        const claim = await tokenVerifier(event.headers.Authorization);
        return { ...baseContext, user_id: claim.username };
      } catch (err) {
        throw new AuthenticationError('Invalid token');
      }
    }

    return baseContext;
  },
  playground: {
    endpoint: '/dev/graphql',
  },
});

exports.graphqlHandler = server.createHandler({
  cors: {
    origin: true,
    credentials: true,
  },
});
