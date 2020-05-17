const { gql } = require('apollo-server-lambda');

module.exports = gql`
  type Recipe {
    id: ID!
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
    id: ID!
    title: String
    shortDescription: String
    longDescription: String
    slug: String
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
    deleteRecipe(id: ID!): String
  }
`;
