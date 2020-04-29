module.exports = {
  Query: {
    recipe: (_, { slug }, { dataSources }) =>
      dataSources.recipesAPI.getRecipe(slug),
  },
  Mutation: {
    createRecipe: async (_, { recipe }, { dataSources }) => {
      return await dataSources.recipesAPI.createRecipe(recipe);
    },
  },
};
