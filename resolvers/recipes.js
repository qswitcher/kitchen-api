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
    deleteRecipe: (_, { slug }, { dataSources }) =>
      dataSources.recipesAPI.deleteRecipe(slug),
  },
};
