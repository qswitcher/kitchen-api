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
    this.tableName = process.env.RECIPES_TABLE;
    this.ttl = 30 * 60; // 30 minutes
  }

  async getAllRecipes({ limit, nextToken }) {
    const scanInput = {
      TableName: this.tableName,
      Limit: limit,
    };

    if (nextToken) {
      scanInput.ExclusiveStartKey = {
        slug: nextToken,
      };
    }
    const items = await this.scan(scanInput, this.ttl);
    return {
      items,
      nextToken:
        items.length < limit || items.length === 0
          ? null
          : items[items.length - 1].slug,
    };
  }

  async getRecipe(slug) {
    const getItemInput = {
      TableName: this.tableName,
      ConsistentRead: true,
      Key: { slug },
    };
    return this.getItem(getItemInput, this.ttl);
  }

  async createRecipe(item) {
    return this.put(item, this.ttl);
  }

  async deleteRecipe(slug) {
    await this.delete({ slug });
    return slug;
  }
}

module.exports = Recipes;
