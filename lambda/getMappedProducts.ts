import { ProductStock, Stock } from "../types/product";

type Items = Record<string, any>[] | undefined;

export const getMappedProducts = (
  productItems: Items = [],
  stockItems: Items = [],
) => {
  const productsStocks = [...productItems] as unknown as ProductStock[];
  const stockDataItems = [...stockItems] as unknown as Stock[];

  const stockDataObject: { [key: string]: Stock } = {};
  stockDataItems.forEach((stockItem) => {
    stockDataObject[stockItem.product_id] = stockItem;
  });

  return productsStocks.map((product) => {
    const stockItem = stockDataObject[product.id];
    const count = stockItem?.count ?? 0;
    return {
      ...product,
      count,
    };
  });
};
