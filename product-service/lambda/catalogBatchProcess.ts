import { SQSEvent, SQSHandler } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { createProduct } from "./helpers/createProductHelper";
import { PRODUCTS_TABLE, STOCKS_TABLE, REGION_NAME } from "./helpers/constants";

const snsClient = new SNSClient({ region: REGION_NAME });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

export const catalogBatchProcessHandler = async (event: SQSEvent) => {
  console.log("Incoming event: ", event);

  for (const record of event.Records) {
    const body = JSON.parse(record.body);

    try {
      const { productId, productItem } = await createProduct(
        body,
        PRODUCTS_TABLE,
        STOCKS_TABLE,
      );
      console.log(
        `Product created with id: ${productId}, item: ${JSON.stringify(
          productItem,
        )}`,
      );

      // Publish message to SNS topic
      const publishCommand = new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify(productItem),
        Subject: "New Product Created",
      });
      await snsClient.send(publishCommand);
    } catch (dbError) {
      console.error(`Error creating product:`, dbError);
    }
  }
};
