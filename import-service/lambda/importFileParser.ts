import { S3Event } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csv from "csv-parser";
import { Readable } from "stream";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const importFileParserHandler = async (event: S3Event) => {
  if (
    !(
      "Records" in event &&
      event.Records.length > 0 &&
      event.Records[0].eventSource === "aws:s3"
    )
  ) {
    console.log("Not an S3 event");
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Not an S3 event" }),
    };
  }

  const record = event.Records[0];
  const { bucket, object } = record.s3;
  const bucketName = bucket.name;
  const { key } = object;
  const fileName = decodeURIComponent(key.replace(/\+/g, " "));

  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  try {
    const getObjectCommand = new GetObjectCommand(params);
    const data = await s3.send(getObjectCommand);

    if (!data.Body) {
      throw new Error("No data found in the S3 object.");
    }

    const records: any[] = [];
    const readableStream = data.Body as Readable;

    await new Promise<void>((resolve, reject) => {
      readableStream
        .pipe(csv())
        .on("data", (row) => {
          console.log("Parsed row:", row);
          records.push(row);
        })
        .on("end", async () => {
          const newKey = `parsed/${key.split("/").pop()}`;

          const copyObjectCommand = new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${key}`,
            Key: newKey,
          });
          await s3.send(copyObjectCommand);

          const deleteObjectCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          });
          await s3.send(deleteObjectCommand);

          console.log(`Moved object from ${key} to ${newKey}`);

          console.log("CSV file successfully processed");
          resolve();
        })
        .on("error", (err) => {
          console.error("Error processing CSV file", err);
          reject(err);
        });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "CSV file processed successfully",
        records,
      }),
    };
  } catch (error) {
    console.error("Error processing the S3 object", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing the S3 object",
        error,
      }),
    };
  }
};
