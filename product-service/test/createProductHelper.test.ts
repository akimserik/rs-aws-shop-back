// test/helpers/createProductHelper.test.ts

import { DynamoDBDocument, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { randomUUID } from "crypto";
import { createProduct } from "../lambda/helpers/createProductHelper";

jest.mock("crypto", () => ({
  randomUUID: jest.fn(),
}));

const dynamoDbMock = mockClient(DynamoDBDocument);

describe("createProductHelper", () => {
  const productsTable = "ProductsTable";
  const stocksTable = "StocksTable";

  beforeEach(() => {
    dynamoDbMock.reset();
    (randomUUID as jest.Mock).mockReturnValue("test-uuid");
  });

  test("should create a product and stock item", async () => {
    dynamoDbMock.on(TransactWriteCommand).resolves({});

    const itemObject = {
      title: "Test Product",
      description: "Test Description",
      price: 100,
      count: 10,
    };

    const result = await createProduct(itemObject, productsTable, stocksTable);

    expect(result).toEqual({
      productId: "test-uuid",
      productItem: {
        id: "test-uuid",
        title: "Test Product",
        description: "Test Description",
        price: 100,
      },
    });

    expect(dynamoDbMock.calls()).toHaveLength(1);
    expect(dynamoDbMock.calls()[0].args[0].input).toEqual({
      TransactItems: [
        {
          Put: {
            TableName: productsTable,
            Item: {
              id: "test-uuid",
              title: "Test Product",
              description: "Test Description",
              price: 100,
            },
          },
        },
        {
          Put: {
            TableName: stocksTable,
            Item: {
              product_id: "test-uuid",
              count: 10,
            },
          },
        },
      ],
    });
  });

  test("should throw an error if DynamoDB transaction fails", async () => {
    const mockError = new Error("DynamoDB error");
    dynamoDbMock.on(TransactWriteCommand).rejects(mockError);

    const itemObject = {
      title: "Test Product",
    };

    await expect(
      createProduct(itemObject, productsTable, stocksTable),
    ).rejects.toThrow("DynamoDB error");

    expect(dynamoDbMock.calls()).toHaveLength(1);
  });
});
