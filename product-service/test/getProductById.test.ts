import { APIGatewayProxyEvent } from "aws-lambda";
import { getProductByIdHandler } from "../lambda/getProductById";
import products from "../lambda/data/mockProducts";

describe("getProductById handler", () => {
  it("returns product by ID", async () => {
    const mockEvent = {
      pathParameters: {
        productId: "1",
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await getProductByIdHandler(mockEvent);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject(products[0]);
  });

  it("returns 404 if product not found", async () => {
    const mockEvent = {
      pathParameters: {
        productId: "invalidId",
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await getProductByIdHandler(mockEvent);
    expect(result.statusCode).toBe(404);
  });
});
