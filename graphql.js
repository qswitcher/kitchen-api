// graphql.js

const { ApolloServer, gql } = require('apollo-server-lambda');
const RecipesAPI = require('./datasources/recipes');
const Resolvers = require('./resolvers/recipes');

const typeDefs = gql`
  type Recipe {
    name: String!
    slug: String!
  }

  input RecipeInput {
    name: String!
    slug: String!
  }

  type Query {
    recipe(slug: String!): Recipe
  }

  type Mutation {
    createRecipe(recipe: RecipeInput!): Recipe
  }
`;

// Provide resolver functions for your schema fields
const resolvers = Resolvers;

const server = new ApolloServer({
  typeDefs,
  resolvers,
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
