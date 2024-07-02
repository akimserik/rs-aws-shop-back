import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { importFileParserHandler } from "../lambda/importFileParser";
import { Readable } from "stream";

jest.mock("@aws-sdk/client-s3");

const fakeCsv =
  "title,description,price,count\n1,Guitar 1,Guitar description1, 100, 10";

class MockReadableStream extends Readable {
  constructor(data: string) {
    super();
    this.push(data);
    this.push(null);
  }

  transformToByteArray(): Promise<Uint8Array> {
    return Promise.resolve(Buffer.from(this.read()));
  }

  transformToString(): Promise<string> {
    return Promise.resolve(this.read().toString());
  }

  transformToWebStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        this.on("data", (chunk) => controller.enqueue(chunk));
        this.on("end", () => controller.close());
      },
    });
  }
}

const s3Mock = mockClient(S3Client);

describe("importFileParser", () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  test("should parse CSV file and move it to parsed folder", async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: new MockReadableStream(fakeCsv),
    });
    s3Mock.on(CopyObjectCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});
    s3Mock.on(HeadObjectCommand).resolves({ ContentType: "text/csv" });

    const event = {
      Records: [
        {
          eventSource: "aws:s3",
          s3: {
            bucket: { name: "test-bucket" },
            object: { key: "test-file.csv" },
          },
        },
      ],
    } as any;

    await importFileParserHandler(event);

    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
  });
});
