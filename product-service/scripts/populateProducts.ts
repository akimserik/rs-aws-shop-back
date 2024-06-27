import { DynamoDB } from "aws-sdk";
import products from "../lambda/data/mockProducts";

const dynamoDb = new DynamoDB.DocumentClient({ region: "eu-central-1" });

async function populateTables() {
  for (const { id, title, description, price } of products) {
    await dynamoDb
      .put({
        TableName: "products",
        Item: { id, title, description, price },
      })
      .promise();
  }

  console.log("Successfully populated products");
}

populateTables().catch(console.error);
