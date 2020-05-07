const { gql } = require('apollo-server-lambda');

module.exports = gql`
  type Recipe {
    title: String!
    shortDescription: String!
    longDescription: String!
    slug: String!
    photo: String
    thumbnail: String
    ingredients: [String!]!
    instructions: [String!]!
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
    slug: String # if not provided, slug will be auto-generated from title
    photo: String
    thumbnail: String
    ingredients: [String!]!
    instructions: [String!]!
  }

  input RecipeUpdateInput {
    title: String
    shortDescription: String
    longDescription: String
    slug: String! # slug is the only required input since we use it to lookup the recipe
    photo: String
    thumbnail: String
    ingredients: [String!]
    instructions: [String!]
  }

  type Query {
    recipe(slug: String!): Recipe
    recipes(page: Int!, pageSize: Int!): RecipePage
  }

  type Mutation {
    createRecipe(recipe: RecipeInput!): Recipe
    updateRecipe(recipe: RecipeUpdateInput!): Recipe
    deleteRecipe(slug: String!): String
  }
`;
