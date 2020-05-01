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

  type RecipePage {
    items: [Recipe!]!
    page: Int!
    pageCount: Int!
    pageSize: Int!
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
    recipes(page: Int!, pageSize: Int!): RecipePage
  }

  type Mutation {
    createRecipe(recipe: RecipeInput!): Recipe
    deleteRecipe(slug: String!): String
  }
`;
