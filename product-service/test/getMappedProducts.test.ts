import { getMappedProducts } from "../lambda/helpers/getMappedProducts";

describe("getMappedProducts", () => {
  it("returns products with stock data", () => {
    const productItems = [
      { id: "1", title: "Product 1", description: "Description 1", price: 100 },
      { id: "2", title: "Product 2", description: "Description 2", price: 200 },
    ];

    const stockItems = [
      { product_id: "1", count: 10 },
      { product_id: "2", count: 20 },
    ];

    const result = getMappedProducts(productItems, stockItems);

    expect(result).toEqual([
      {
        id: "1",
        title: "Product 1",
        description: "Description 1",
        price: 100,
        count: 10,
      },
      {
        id: "2",
        title: "Product 2",
        description: "Description 2",
        price: 200,
        count: 20,
      },
    ]);
  });

  it("returns products without stock data", () => {
    const productItems = [
      { id: "1", title: "Product 1", description: "Description 1", price: 100 },
      { id: "2", title: "Product 2", description: "Description 2", price: 200 },
    ];

    const stockItems = undefined;

    const result = getMappedProducts(productItems, stockItems);

    expect(result).toEqual([
      {
        id: "1",
        title: "Product 1",
        description: "Description 1",
        price: 100,
        count: 0,
      },
      {
        id: "2",
        title: "Product 2",
        description: "Description 2",
        price: 200,
        count: 0,
      },
    ]);
  });
});
