const { DynamoDBDataSource } = require('apollo-datasource-dynamodb');
const { AuthenticationError } = require('apollo-server-lambda');

const isInt = (v) => v.match(/^\d+$/g);

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
    // get slug from client or generate one
    let newSlug =
      item.slug || item.title.toLowerCase().trim().replace(/\s+/g, '-');

    // if slug exists, we need to generate a new one
    if (await this.getRecipe(newSlug)) {
      const tokens = newSlug.split('-');
      let startNum = 1;
      if (tokens.length > 1 && isInt(tokens[tokens.length - 1])) {
        startNum = parseInt(tokens.pop(), 10);
      }

      newSlug = [...tokens, startNum].join('-');
      let item = await this.getRecipe(newSlug);
      while (item) {
        startNum += 1;
        newSlug = [...tokens, startNum].join('-');
        item = await this.getRecipe(newSlug);
      }
    }

    // use new or generated slug
    item.slug = newSlug;
    return this.put(item, this.ttl);
  }

  async deleteRecipe(slug) {
    if (!this.context.user_id) throw new AuthenticationError('Unauthorized');
    await this.delete({ slug });
    return slug;
  }
}

module.exports = Recipes;
