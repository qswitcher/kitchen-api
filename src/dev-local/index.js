// dev server for development
const AWS = require('aws-sdk');
const { ApolloServer, AuthenticationError } = require('apollo-server');
const DynamoDBAPI = require('../handlers/graphql/datasources/dynamodb');
const schema = require('../handlers/graphql/schema');
const tokenVerifier = require('../handlers/graphql/utils/token-verifier');

// // not sure why this needed
// AWS.config.update({ region: 'us-east-1' });

const server = new ApolloServer({
  ...schema,
  dataSources: () => ({
    dynamoDbAPI: new DynamoDBAPI(),
  }),
  context: async ({ req }) => {
    // if there is an access token, verify it, we'll use this to
    // enable mutations
    if (req.headers.authorization) {
      try {
        const claim = await tokenVerifier(req.headers.authorization);
        return { user_id: claim.username };
      } catch (err) {
        console.log(err);
        throw new AuthenticationError('Invalid token');
      }
    }

    return {};
  },
  introspection: true, // enables introspection of the schema
  playground: true, // enables the actual playground
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
