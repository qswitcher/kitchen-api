module.exports = {
  Query: {
    recipe: (_, { slug }, { dataSources }) =>
      dataSources.recipesAPI.getRecipe(slug),
    recipes: (_, args, { dataSources, event }) => {
      console.log(event);
      console.log(event.requestContext.authorizer.claims);
      return dataSources.recipesAPI.getAllRecipes(args);
    },
  },
  Mutation: {
    createRecipe: (_, { recipe }, { dataSources }) =>
      dataSources.recipesAPI.createRecipe(recipe),
    deleteRecipe: (_, { slug }, { dataSources }) =>
      dataSources.recipesAPI.deleteRecipe(slug),
  },
};
