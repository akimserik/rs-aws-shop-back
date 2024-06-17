import { APIGatewayProxyEvent } from "aws-lambda";
import { getProductsListHandler } from "../lambda/getProductsList";
import products from "../lambda/mockData";

describe("getProducts handler", () => {
  it("returns all products", async () => {
    const mockEvent = {} as APIGatewayProxyEvent;

    const result = await getProductsListHandler(mockEvent);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(products));
  });
});
