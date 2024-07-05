import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createProduct } from "./helpers/createProductHelper";
import { PRODUCTS_TABLE, STOCKS_TABLE } from "./helpers/constants";
import { response } from "./helpers/response";

export const createPruductHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Incoming event: ", JSON.stringify(event));

  if (!event.body) {
    return response(400, {
      message: "invalid request, you are missing the parameter body",
    });
  }

  const itemObject =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);

  try {
    const productId = await createProduct(
      itemObject,
      PRODUCTS_TABLE,
      STOCKS_TABLE,
    );

    return response(201, {
      message: `New product created with id: ${productId}`,
    });
  } catch (dbError) {
    return response(500, { message: JSON.stringify(dbError) });
  }
};
