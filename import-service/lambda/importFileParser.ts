import { APIGatewayProxyEvent, S3Event } from "aws-lambda";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import * as csv from "csv-parser";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const importFileParserHandler = async (event: S3Event) => {
  if (
    !(
      "Records" in event &&
      event.Records.length > 0 &&
      event.Records[0].eventSource === "aws:s3"
    )
  ) {
    console.log("not s3 event");
  }

  const s3Event = event.Records[0].s3;
  const bucketName = s3Event.bucket.name;
  const fileName = decodeURIComponent(s3Event.object.key.replace(/\+/g, " "));

  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  const { ContentType } = await s3.send(new HeadObjectCommand(params));
  console.log("CONTENT TYPE:", ContentType);

  return {
    statusCode: 200,
    ContentType,
  };
};
