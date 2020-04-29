const { DynamoDBDataSource } = require('apollo-datasource-dynamodb');

class Recipes extends DynamoDBDataSource {
  constructor(config) {
    super(
      process.env.RECIPES_TABLE,
      [
        {
          AttributeName: 'slug',
          KeyType: 'HASH',
        },
      ],
      config
    );
    this.ttl = 30 * 60; // 30 minutes
  }

  async getAllRecipes() {
    return this.scan;
  }

  async getRecipe(slug) {
    const getItemInput = {
      TableName: process.env.RECIPES_TABLE,
      ConsistentRead: true,
      Key: { slug },
    };
    return this.getItem(getItemInput, this.ttl);
  }

  async createRecipe(item) {
    return this.put(item, this.ttl);
  }
}

module.exports = Recipes;
