'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

const ASPECT = 16 / 9;
const SIZES = [
  { name: 'details', width: 848, height: Math.ceil(848 / ASPECT) },
  { nname: 'serp', width: 414, height: Math.ceil(414 / ASPECT) },
];

const handleResize = ({ bucket, key, width, height }) => {
  console.log({
    msg: 'Begin resize',
    bucket,
    key,
    width,
    height,
  });

  return S3.getObject({
    Bucket: bucket,
    Key: key,
  })
    .promise()
    .then((data) => {
      return Sharp(data.Body)
        .resize(width, height)
        .toBuffer()
        .then((buffer) =>
          S3.putObject({
            Body: buffer,
            Bucket: bucket,
            ContentType: data.ContentType,
            Key: `thumbnails/${width}x${height}/${key.split('/').pop()}`,
          })
            .promise()
            .then(() => console.log('Resize complete'))
        );
    });
};

exports.handleResize = handleResize;
exports.SIZES = SIZES;

exports.handler = async function (event) {
  return Promise.all(
    event.Records.map((record) =>
      SIZES.map(({ width, height }) =>
        handleResize({
          bucket: record.s3.bucket.name,
          key: record.s3.object.key,
          width,
          height,
        })
      )
    ).flat(1)
  );
};
