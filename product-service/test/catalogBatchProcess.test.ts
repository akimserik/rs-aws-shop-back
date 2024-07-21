import { SQSEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { catalogBatchProcessHandler } from "../lambda/catalogBatchProcess";
import { createProduct } from "../lambda/helpers/createProductHelper";
import { generateMockSqsEvent } from "./helpers/mockSqsEvent";
import { PRODUCTS_TABLE, STOCKS_TABLE } from "../lambda/helpers/constants";

jest.mock("../lambda/helpers/createProductHelper");

const snsMock = mockClient(SNSClient);

describe("catalogBatchProcess", () => {
  beforeEach(() => {
    snsMock.reset();
    jest.clearAllMocks();
  });

  it("should process SQS messages and create products", async () => {
    const mockProductItem = {
      id: "test-uuid",
      title: "Batch1",
      description: "Description1",
      price: 100,
      count: 10,
    };

    (createProduct as jest.Mock).mockResolvedValue({
      productId: "test-uuid",
      productItem: mockProductItem,
    });

    snsMock.on(PublishCommand).resolves({});

    const event: SQSEvent = generateMockSqsEvent([
      {
        title: "Batch1",
        description: "Description1",
        price: 100,
        count: 10,
      },
      {
        title: "Batch2",
        description: "Description2",
        price: 200,
        count: 20,
      },
    ]);

    await catalogBatchProcessHandler(event);

    expect(createProduct).toHaveBeenCalledTimes(2);
    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Batch1",
        description: "Description1",
        price: 100,
        count: 10,
      }),
      PRODUCTS_TABLE,
      STOCKS_TABLE,
    );

    expect(snsMock.calls()).toHaveLength(2);
    expect(snsMock.calls()[0].args[0].input).toMatchObject({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Message: JSON.stringify(mockProductItem),
      Subject: "New Product Created",
    });

    expect(snsMock.calls()[1].args[0].input).toMatchObject({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Message: JSON.stringify(mockProductItem),
      Subject: "New Product Created",
    });
  });

  it("should log error if createProduct fails", async () => {
    const mockError = new Error("DynamoDB error");

    (createProduct as jest.Mock).mockRejectedValue(mockError);

    const event: SQSEvent = generateMockSqsEvent([
      {
        title: "Batch1",
        description: "Description1",
        price: 100,
        count: 10,
      },
    ]);

    console.error = jest.fn();

    await catalogBatchProcessHandler(event);

    expect(createProduct).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Error creating product:",
      mockError,
    );
  });
});
