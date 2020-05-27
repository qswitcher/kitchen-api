const algoliasearch = require('algoliasearch');

const toPrimitive = (obj) => {
  if (obj.S) {
    return obj.S;
  } else if (obj.NULL) {
    return null;
  } else if (obj.L) {
    return obj.L.map(toPrimitive);
  }
  return obj;
};

/**
 * Converts DynamoDB JSON to a regular javascript object
 */
const unpack = (item) =>
  Object.keys(item).reduce((acc, k) => {
    acc[k] = toPrimitive(item[k]);
    return acc;
  }, {});

exports.unpack = unpack;

exports.handler = (event, context, callback) => {
  const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY);
  const index = client.initIndex('recipes');

  event.Records.forEach((record) => {
    if (record.eventName === 'REMOVE') {
      const key = record.dynamodb.Keys.key.S;
      console.log({ msg: 'Deleting key', key });
      index.deleteObject(key);
    } else {
      const {
        key,
        title,
        shortDescription,
        longDescription,
        ingredients,
      } = unpack(record.dynamodb.NewImage);

      const obj = {
        objectID: key,
        title,
        shortDescription,
        longDescription,
        ingredients,
      };

      console.log('Indexing: ', JSON.stringify(obj, null, 2));
      index.saveObject(obj);
    }
  });
  callback(null, `Successfully processed ${event.Records.length} records.`);
};
