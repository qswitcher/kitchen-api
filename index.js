// dev server for development
const AWS = require('aws-sdk');
const { ApolloServer } = require('apollo-server');
const RecipesAPI = require('./datasources/recipes');
const schema = require('./schema');

// not sure why this needed
AWS.config.update({ region: 'us-east-1' });

const server = new ApolloServer({
  ...schema,
  dataSources: () => ({
    recipesAPI: new RecipesAPI(),
  }),
  introspection: true, // enables introspection of the schema
  playground: true, // enables the actual playground
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
