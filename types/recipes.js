const { gql } = require('apollo-server-lambda');

module.exports = gql`
  type Recipe {
    title: String!
    shortDescription: String!
    longDescription: String!
    slug: String!
    thumbnail: String
    ingredients: [String!]!
  }

  type RecipeConnection {
    items: [Recipe!]!
    nextToken: String
  }

  input RecipeInput {
    title: String!
    shortDescription: String!
    longDescription: String!
    slug: String!
    thumbnail: String
    ingredients: [String!]!
  }

  type Query {
    recipe(slug: String!): Recipe
    recipes(limit: Int!, nextToken: String): RecipeConnection
  }

  type Mutation {
    createRecipe(recipe: RecipeInput!): Recipe
    deleteRecipe(slug: String!): String
  }
`;
