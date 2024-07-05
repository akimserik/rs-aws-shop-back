import { SQSHandler } from "aws-lambda";
import { createProduct } from "./helpers/createProductHelper";
import { PRODUCTS_TABLE, STOCKS_TABLE } from "./helpers/constants";

export const catalogBatchProcessHandler: SQSHandler = async (event) => {
  console.log("Incoming event: ", JSON.stringify(event));

  for (const record of event.Records) {
    const body = JSON.parse(record.body);

    try {
      const productId = await createProduct(body, PRODUCTS_TABLE, STOCKS_TABLE);
      console.log(`Product created with id: ${productId}`);
    } catch (dbError) {
      console.error(`Error creating product:`, dbError);
    }
  }
};
