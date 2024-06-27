import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { PRODUCTS_TABLE, STOCKS_TABLE } from "./helpers/constants";
import { response } from "./helpers/response";

const dynamoDb = DynamoDBDocument.from(new DynamoDB());

export const getProductByIdHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Incoming event: ", JSON.stringify(event));

  if (!event?.pathParameters?.productId) {
    return response(400, { message: "Product ID not provided" });
  }

  try {
    const productId = event.pathParameters.productId;

    const productData = await dynamoDb.query({
      TableName: PRODUCTS_TABLE,
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id": "id",
      },
      ExpressionAttributeValues: {
        ":id": productId,
      },
    });

    if (!productData?.Items?.length) {
      return response(404, { message: "Product not found" });
    }

    const stockData = await dynamoDb.query({
      TableName: STOCKS_TABLE,
      KeyConditionExpression: "#product_id = :product_id",
      ExpressionAttributeNames: {
        "#product_id": "product_id",
      },
      ExpressionAttributeValues: {
        ":product_id": productId,
      },
    });

    const count = stockData?.Items?.length ? stockData.Items[0].count : 0;

    const product = {
      ...productData?.Items[0],
      count,
    };

    return response(200, product);
  } catch (err: any) {
    console.log(err);
    return response(500, {
      message: `getProductById: ${err?.message || "unhandled error"}`,
    });
  }
};
