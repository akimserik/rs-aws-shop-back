import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import {
  Authorizer,
  AuthorizationType,
  IdentitySource,
} from "aws-cdk-lib/aws-apigateway";
import { BUCKET_NAME } from "../lambda/helpers/constants";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(this, "ImportBucket", BUCKET_NAME);

    // create signedUrl
    const importProductsFileFunction = new lambda.Function(
      this,
      "ImportProductsFile",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "importProductsFile.importProductsFileHandler",
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
      },
    );

    bucket.grantReadWrite(importProductsFileFunction);

    // Create Lambda authorizer from existing Lambda function
    const basicAuthorizerLambda = lambda.Function.fromFunctionArn(
      this,
      "basicAuthorizer",
      "arn:aws:lambda:eu-central-1:767397742395:function:AuthorizationServiceStack-BasicAuthorizerFunctionA-1Q01Mm1srAjl",
    );

    const basicAuthorizer = new apigateway.TokenAuthorizer(this, "Authorizer", {
      handler: basicAuthorizerLambda,
      identitySource: IdentitySource.header("Authorization"),
    });

    // import
    const api = new apigateway.RestApi(this, "ImportApi", {
      restApiName: "Import Service",
    });

    const importResource = api.root.addResource("import", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
        allowCredentials: true,
      },
    });

    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileFunction),
      {
        authorizer: basicAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    api.addGatewayResponse("UnauthorizedResponse", {
      type: apigateway.ResponseType.DEFAULT_4XX,
      statusCode: "401",
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Credentials": "'true'",
      },
      templates: {
        "application/json": JSON.stringify({ message: "Unauthorized" }),
      },
    });

    api.addGatewayResponse("AccessDeniedResponse", {
      type: apigateway.ResponseType.DEFAULT_5XX,
      statusCode: "403",
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Credentials": "'true'",
      },
      templates: {
        "application/json": JSON.stringify({ message: "Access denied" }),
      },
    });

    // import file parser
    // Get existing SQS queue
    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "RsAwsShopBackStack-CatalogItemsQueueB3B6CE23-ayoY213GWpom",
      "arn:aws:sqs:eu-central-1:767397742395:RsAwsShopBackStack-CatalogItemsQueueB3B6CE23-ayoY213GWpom",
    );

    const csvParserLayer = new lambda.LayerVersion(this, "CsvParserLayer", {
      code: lambda.Code.fromAsset("lambda-layer/lambda_layer.zip"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "A layer that includes the csv-parser package",
    });

    const importFileParserFunction = new lambda.Function(
      this,
      "ImportFileParser",
      {
        code: lambda.Code.fromAsset("lambda"),
        handler: "importFileParser.importFileParserHandler",
        runtime: lambda.Runtime.NODEJS_20_X,
        layers: [csvParserLayer],
        environment: {
          CATALOG_ITEMS_QUEUE_URL: catalogItemsQueue.queueUrl,
        },
      },
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserFunction),
      { prefix: "uploaded/" },
    );

    bucket.grantReadWrite(importFileParserFunction);

    // Grant SQS sendMessage permission to the Lambda function
    catalogItemsQueue.grantSendMessages(importFileParserFunction);
  }
}
