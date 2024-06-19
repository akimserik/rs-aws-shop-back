import { DynamoDB } from "aws-sdk";
import products from "../lambda/mockProducts";

const dynamoDb = new DynamoDB.DocumentClient({ region: "eu-central-1" });

async function populateTables() {
  for (const { id, stock } of products) {
    await dynamoDb
      .put({
        TableName: "stocks",
        Item: { product_id: id, count: stock },
      })
      .promise();
  }

  console.log("Successfully populated stocks");
}

populateTables().catch(console.error);
