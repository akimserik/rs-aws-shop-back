import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { PRODUCTS_TABLE, STOCKS_TABLE } from "./helpers/constants";
import { Product, Stock } from "../types/product";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "crypto";
import { response } from "./helpers/response";

const db = DynamoDBDocument.from(new DynamoDB());

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

  const productId = randomUUID();

  const productItem: Product = {
    id: productId,
    title: itemObject.title,
    description: itemObject.description ?? "",
    price: itemObject.price ?? 0,
  };

  const stockItem: Stock = {
    product_id: productId,
    count: itemObject.count ?? 0,
  };

  const transactionParams = {
    TransactItems: [
      {
        Put: {
          TableName: PRODUCTS_TABLE,
          Item: productItem,
        },
      },
      {
        Put: {
          TableName: STOCKS_TABLE,
          Item: stockItem,
        },
      },
    ],
  };

  try {
    await db.transactWrite(transactionParams);

    return response(201, {
      message: `New product created with id: ${productId}`,
    });
  } catch (dbError) {
    return response(500, { message: JSON.stringify(dbError) });
  }
};
