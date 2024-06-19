import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { headersConfig } from "./headers";

const tableName = "products";
const dynamoDb = DynamoDBDocument.from(new DynamoDB());

export const getProductsListHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const params = {
    TableName: tableName,
  };

  try {
    const data = await dynamoDb.scan(params);

    return {
      statusCode: 200,
      headers: headersConfig,
      body: JSON.stringify(data.Items),
    };
  } catch (err: any) {
    console.log(err);
    return {
      statusCode: 500,
      headers: headersConfig,
      body: JSON.stringify({
        message: `getProducts: ${err?.message || "unhandled error"}`,
      }),
    };
  }
};
