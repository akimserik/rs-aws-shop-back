import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { headersConfig } from "./headers";
import { getMappedProducts } from "./getMappedProducts";
import { PRODUCTS_TABLE, STOCKS_TABLE } from "./constants";

const dynamoDb = DynamoDBDocument.from(new DynamoDB());

export const getProductsListHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const productsData = await dynamoDb.scan({
      TableName: PRODUCTS_TABLE,
    });

    const stocksData = await dynamoDb.scan({
      TableName: STOCKS_TABLE,
    });

    const mappedProducts = getMappedProducts(
      productsData.Items,
      stocksData.Items,
    );

    return {
      statusCode: 200,
      headers: headersConfig,
      body: JSON.stringify(mappedProducts),
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
