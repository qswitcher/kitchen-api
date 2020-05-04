const { DynamoDBDataSource } = require('apollo-datasource-dynamodb');
const { AuthenticationError } = require('apollo-server-lambda');

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

  async getAllRecipes({ page, pageSize }) {
    // first scan to get all pages
    const pageScan = {
      TableName: this.tableName,
      ProjectionExpression: 'slug',
      Limit: 100,
    };

    const slugs = await this.scan(pageScan, this.ttl);

    const scanInput = {
      TableName: this.tableName,
      Limit: pageSize,
    };

    if (page > 1) {
      // get token formainquery
      const nextToken = slugs[(page - 1) * pageSize];

      scanInput.ExclusiveStartKey = nextToken;
    }

    const items = await this.scan(scanInput, this.ttl);
    return {
      items,
      page,
      pageSize,
      pageCount: Math.ceil(slugs.length / pageSize),
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
    if (!this.context.user_id) throw new AuthenticationError('Unauthorized');
    return this.put(item, this.ttl);
  }

  async deleteRecipe(slug) {
    if (!this.context.user_id) throw new AuthenticationError('Unauthorized');
    await this.delete({ slug });
    return slug;
  }
}

module.exports = Recipes;
