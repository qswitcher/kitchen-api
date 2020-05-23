const { AuthenticationError, UserInputError } = require('apollo-server-lambda');
const { DataSource } = require('apollo-datasource');
const { DynamoDB } = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const algoliasearch = require('algoliasearch');

const isInt = (v) => v.match(/^\d+$/g);

class DynamoDbAPI extends DataSource {
  constructor(config = {}) {
    super();
    const client = algoliasearch(
      process.env.ALGOLIA_ID,
      process.env.ALGOLIA_KEY
    );
    this.searchClient = client.initIndex('recipes');
    this.tableName = process.env.MAIN_TABLE;
    this.gsi1 = process.env.MAIN_TABLE_GSI1;
    this.tableKeys = [
      {
        AttributeName: 'key',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'sort',
        KeyType: 'RANGE',
      },
    ];
    this.gsiKeys = [
      {
        AttributeName: 'sort',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'data',
        KeyType: 'RANGE',
      },
    ];
    this.dynamoDbDocClient = new DynamoDB.DocumentClient({
      apiVersion: '2012-08-10',
      ...config,
    });
  }

  initialize({ context }) {
    this.context = context;
  }

  itemToRecipe(item) {
    const { key, data, sort, ...rest } = item;
    return {
      ...rest,
      id: key,
      slug: data,
    };
  }

  async search({ input: { q = '', page, pageSize } }) {
    if (!q) {
      return this.getAllRecipes({ page, pageSize });
    }
    const response = await this.searchClient.search(q, {
      attributesToRetrieve: ['objectID'],
      page: page - 1,
      hitsPerPage: pageSize,
    });
    const { hits, nbPages, nbHits } = response;

    let items = [];
    if (hits.length > 0) {
      const output = await this.dynamoDbDocClient
        .batchGet({
          RequestItems: {
            [this.tableName]: {
              Keys: hits.map(({ objectID }) => ({
                key: objectID,
                sort: 'Recipe',
              })),
            },
          },
        })
        .promise();

      items = output.Responses[this.tableName].map((item) =>
        this.itemToRecipe(item)
      );
    }

    return {
      items,
      page,
      pageSize,
      pageCount: nbPages,
      resultCount: nbHits,
    };
  }

  async getAllRecipes({ page, pageSize }) {
    // first scan to get all pages
    const pageQuery = {
      TableName: this.tableName,
      IndexName: this.gsi1,
      Limit: 100,
      ProjectionExpression: '#key, #data, #sort',
      KeyConditionExpression: '#sort = :sort',
      ExpressionAttributeNames: {
        '#key': 'key',
        '#sort': 'sort',
        '#data': 'data',
      },
      ExpressionAttributeValues: {
        ':sort': 'Recipe',
      },
    };

    const pageQueryOutput = await this.dynamoDbDocClient
      .query(pageQuery)
      .promise();

    const pageConntentQuery = {
      TableName: this.tableName,
      IndexName: this.gsi1,
      Limit: pageSize,
      KeyConditionExpression: '#sort = :sort',
      ExpressionAttributeNames: {
        '#sort': 'sort',
      },
      ExpressionAttributeValues: {
        ':sort': 'Recipe',
      },
    };

    if (page > 1) {
      // get token formainquery
      const nextToken = pageQueryOutput.Items[(page - 1) * pageSize - 1];
      pageConntentQuery.ExclusiveStartKey = nextToken;
    }

    const hydratedPageOutput = await this.dynamoDbDocClient
      .query(pageConntentQuery)
      .promise();

    return {
      items: hydratedPageOutput.Items.map((item) => this.itemToRecipe(item)),
      page,
      pageSize,
      pageCount: Math.ceil(pageQueryOutput.Items.length / pageSize),
      resultCount: pageQueryOutput.Count,
    };
  }

  async getRecipeBySlug(slug) {
    const getRecipeInput = {
      TableName: this.tableName,
      IndexName: this.gsi1,
      KeyConditionExpression: '#sort = :sort and #data = :data',
      ExpressionAttributeNames: {
        '#sort': 'sort',
        '#data': 'data',
      },
      ExpressionAttributeValues: {
        ':sort': 'Recipe',
        ':data': slug,
      },
    };

    const response = await this.dynamoDbDocClient
      .query(getRecipeInput)
      .promise();
    if (response.Items.length > 0) {
      return this.itemToRecipe(response.Items[0]);
    }
    return null;
  }

  async getRecipe(id) {
    const response = await this.dynamoDbDocClient
      .get({
        TableName: this.tableName,
        Key: {
          key: id,
          sort: 'Recipe',
        },
      })
      .promise();
    return this.itemToRecipe(response.Item);
  }

  async createRecipe(recipe) {
    if (!this.context.user_id) throw new AuthenticationError('Unauthorized');
    // get slug from client or generate one
    const { slug, ...rest } = recipe;
    let newSlug =
      slug || recipe.title.toLowerCase().trim().replace(/\s+/g, '-');

    // if slug exists, we need to generate a new one
    if (await this.getRecipeBySlug(newSlug)) {
      const tokens = newSlug.split('-');
      let startNum = 1;
      if (tokens.length > 1 && isInt(tokens[tokens.length - 1])) {
        startNum = parseInt(tokens.pop(), 10);
      }

      newSlug = [...tokens, startNum].join('-');
      let it = await this.getRecipeBySlug(newSlug);
      while (it) {
        startNum += 1;
        newSlug = [...tokens, startNum].join('-');
        it = await this.getRecipeBySlug(newSlug);
      }
    }

    // use new or generated slug
    // TODO
    const key = uuidv4();
    const item = {
      key,
      sort: 'Recipe',
      data: newSlug,
      user_id: this.context.user_id,
      ...rest,
    };

    await this.dynamoDbDocClient
      .put({
        TableName: this.tableName,
        Item: item,
      })
      .promise();

    return this.itemToRecipe(item);
  }

  async updateRecipe({ id, ...rest }) {
    if (!this.context.user_id) throw new AuthenticationError('Unauthorized');
    if (!id) throw new UserInputError('id required');

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributesValues = {};

    Object.keys(rest).forEach((key) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributesValues[`:${key}`] = rest[key];
    });

    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    await this.dynamoDbDocClient
      .update({
        TableName: this.tableName,
        Key: {
          key: id,
          sort: 'Recipe',
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributesValues,
      })
      .promise();

    // get fresh copy
    return this.getRecipe(id);
  }

  async deleteRecipe(id) {
    if (!this.context.user_id) throw new AuthenticationError('Unauthorized');
    if (!id) throw new UserInputError('id required');
    await this.dynamoDbDocClient
      .delete({
        TableName: this.tableName,
        Key: {
          key: id,
          sort: 'Recipe',
        },
      })
      .promise();
    return id;
  }
}

module.exports = DynamoDbAPI;
