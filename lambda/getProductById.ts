import products from "./mockData";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Product } from "./types";
import { headersConfig } from "./utils";

type Message = { message: string } | Product;

const response = (statusCode: number, message: Message) => ({
  statusCode,
  headers: headersConfig,
  body: JSON.stringify(message),
});

exports.handler = async (event: APIGatewayProxyEvent) => {
  try {
    if (event?.pathParameters?.productId) {
      const productId = event.pathParameters.productId;
      const product = products.find((product) => product.id === productId);

      if (product) {
        return response(200, product);
      } else {
        return response(404, { message: "Product not found" });
      }
    } else {
      return response(400, { message: "Product ID not provided" });
    }
  } catch (err: any) {
    console.log(err);
    return response(500, {
      message: `getProductById: ${err?.message || "unhandled error"}`,
    });
  }
};
