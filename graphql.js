// serverless entrypoint
const { ApolloServer } = require('apollo-server-lambda');
const RecipesAPI = require('./datasources/recipes');
const schema = require('./schema');

const server = new ApolloServer({
  ...schema,
  dataSources: () => ({
    recipesAPI: new RecipesAPI(),
  }),
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
