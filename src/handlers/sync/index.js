const { DynamoDB } = require('aws-sdk');
const { SIZES, handleResize } = require('../resizer');

exports.handler = async function () {
  console.log('Preparing to sync....');
  const pageQuery = {
    TableName: process.env.MAIN_TABLE,
    IndexName: process.env.MAIN_TABLE_GSI1,
    Limit: 100,
    ProjectionExpression: '#key, #data, #sort, #photo',
    KeyConditionExpression: '#sort = :sort',
    ExpressionAttributeNames: {
      '#key': 'key',
      '#sort': 'sort',
      '#data': 'data',
      '#photo': 'photo',
    },
    ExpressionAttributeValues: {
      ':sort': 'Recipe',
    },
  };

  const dynamoDbDocClient = new DynamoDB.DocumentClient({
    apiVersion: '2012-08-10',
  });

  const pageQueryOutput = await dynamoDbDocClient.query(pageQuery).promise();

  console.log(`Syncing ${pageQueryOutput.Items.length} records`);

  await Promise.all(
    pageQueryOutput.Items.map((item) =>
      SIZES.map(({ width, height }) =>
        handleResize({
          bucket: process.env.UPLOAD_BUCKET,
          key: `public/${item.photo}`,
          width,
          height,
        })
      )
    ).flat(1)
  );
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ success: true }),
  };
};
