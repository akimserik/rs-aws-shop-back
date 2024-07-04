import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { importProductsFileHandler } from "../lambda/importProductsFile";

const s3Mock = mockClient(S3Client);

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

describe("importProductsFileHandler", () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it("should return 400 if file name is not provided", async () => {
    const event = {
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const result = await importProductsFileHandler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      message: "File name is not provided",
    });
  });

  it("should return signed URL if file name is provided", async () => {
    const event = {
      queryStringParameters: {
        name: "test.csv",
      },
    } as unknown as APIGatewayProxyEvent;

    (getSignedUrl as jest.Mock).mockResolvedValueOnce("https://signed.url");

    const result = await importProductsFileHandler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      signedUrl: "https://signed.url",
    });

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(PutObjectCommand),
      { expiresIn: 3600 },
    );
  });

  it("should return 500 if there is an error generating the signed URL", async () => {
    const event = {
      queryStringParameters: {
        name: "test.csv",
      },
    } as unknown as APIGatewayProxyEvent;

    (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error("Test error"));

    const result = await importProductsFileHandler(event);
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      message: "importProductsFile: Test error",
    });
  });
});
