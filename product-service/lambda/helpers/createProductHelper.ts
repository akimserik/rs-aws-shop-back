import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";
import { Product, Stock } from "../../types/product";

const db = DynamoDBDocument.from(new DynamoDB());

export const createProduct = async (
  itemObject: any,
  productsTable: string,
  stocksTable: string,
) => {
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
          TableName: productsTable,
          Item: productItem,
        },
      },
      {
        Put: {
          TableName: stocksTable,
          Item: stockItem,
        },
      },
    ],
  };

  await db.transactWrite(transactionParams);

  return productId;
};
