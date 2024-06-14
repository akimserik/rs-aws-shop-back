import { APIGatewayProxyEvent } from "aws-lambda";
import products from "./mockData";
import { headersConfig } from "./utils";

exports.handler = async (event: APIGatewayProxyEvent) => {
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
