import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import products from "./mockData";
import { headersConfig } from "./utils";

export const getProductsListHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    return {
      statusCode: 200,
      headers: headersConfig,
      body: JSON.stringify(products),
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
