import { SQSEvent, SQSRecord } from "aws-lambda";

export const generateMockSqsEvent = (records: any[]): SQSEvent => {
  const sqsRecords: SQSRecord[] = records.map((record, index) => ({
    messageId: (index + 1).toString(),
    receiptHandle: "receipt-handle",
    body: JSON.stringify(record),
    attributes: {
      ApproximateReceiveCount: "1",
      SentTimestamp: "0",
      SenderId: "sender",
      ApproximateFirstReceiveTimestamp: "0",
    },
    messageAttributes: {},
    md5OfBody: "md5",
    eventSource: "aws:sqs",
    eventSourceARN: "arn:aws:sqs:region:account-id:queue-name",
    awsRegion: "region",
  }));

  return { Records: sqsRecords };
};
