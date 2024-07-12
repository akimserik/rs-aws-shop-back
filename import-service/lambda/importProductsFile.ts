import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { response } from "./helpers/response";
import { BUCKET_NAME, REGION_NAME } from "./helpers/constants";

const s3Client = new S3Client({ region: REGION_NAME });

export const importProductsFileHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Incoming event: ", JSON.stringify(event));

  const fileName = event?.queryStringParameters?.name;

  if (!fileName) {
    return response(400, { message: "File name is not provided" });
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `uploaded/${fileName}`,
    ContentType: "text/csv",
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return response(200, {
      signedUrl,
    });
  } catch (err: any) {
    console.log(err);
    return response(500, {
      message: `importProductsFile: ${err?.message || "unhandled error"}`,
    });
  }
};
