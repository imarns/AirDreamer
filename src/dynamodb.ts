import AWS from 'aws-sdk';

AWS.config.update({
  region: 'eu-west-2', // Ensure this is the region where your DynamoDB table is hosted
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export default dynamoDB;