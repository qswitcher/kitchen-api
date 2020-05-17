module.exports = {
  Query: {
    recipe: (_, { slug }, { dataSources }) =>
      dataSources.dynamoDbAPI.getRecipeBySlug(slug),
    recipes: (_, args, { dataSources }) =>
      dataSources.dynamoDbAPI.getAllRecipes(args),
  },
  Mutation: {
    createRecipe: (_, { recipe }, { dataSources }) =>
      dataSources.dynamoDbAPI.createRecipe(recipe),
    updateRecipe: (_, { recipe }, { dataSources }) =>
      dataSources.dynamoDbAPI.updateRecipe(recipe),
    deleteRecipe: (_, { id }, { dataSources }) =>
      dataSources.dynamoDbAPI.deleteRecipe(id),
  },
};
