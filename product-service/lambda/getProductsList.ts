import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { headersConfig } from "./helpers/headers";
import { getMappedProducts } from "./helpers/getMappedProducts";
import { PRODUCTS_TABLE, STOCKS_TABLE } from "./helpers/constants";

const dynamoDb = DynamoDBDocument.from(new DynamoDB());

export const getProductsListHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Incoming event: ", JSON.stringify(event));

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
