module.exports = {
  Query: {
    recipe: (_, { slug }, { dataSources }) =>
      dataSources.recipesAPI.getRecipe(slug),
    recipes: (_, args, { dataSources }) =>
      dataSources.recipesAPI.getAllRecipes(args),
  },
  Mutation: {
    createRecipe: (_, { recipe }, { dataSources }) =>
      dataSources.recipesAPI.createRecipe(recipe),
    updateRecipe: (_, { recipe }, { dataSources }) =>
      dataSources.recipesAPI.updateRecipe(recipe),
    deleteRecipe: (_, { slug }, { dataSources }) =>
      dataSources.recipesAPI.deleteRecipe(slug),
  },
};
