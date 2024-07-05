import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sqsEventSource from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";

export class RsAwsShopBackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // initialize DBs
    const productsTable = dynamoDb.Table.fromTableName(
      this,
      "products",
      "products",
    );
    const stocksTable = dynamoDb.Table.fromTableName(this, "stocks", "stocks");

    // products
    const getProductsListFunction = new lambda.Function(
      this,
      "getProductsList",
      {
        code: lambda.Code.fromAsset("lambda"),
        handler: "getProductsList.getProductsListHandler",
        runtime: lambda.Runtime.NODEJS_18_X,
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCKS_TABLE: stocksTable.tableName,
        },
      },
    );

    productsTable.grantReadWriteData(getProductsListFunction);
    stocksTable.grantReadWriteData(getProductsListFunction);

    // products/{productId}
    const getProductByIdFunction = new lambda.Function(this, "getProductById", {
      code: lambda.Code.fromAsset("lambda"),
      handler: "getProductById.getProductByIdHandler",
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });

    productsTable.grantReadWriteData(getProductByIdFunction);
    stocksTable.grantReadWriteData(getProductByIdFunction);

    // create product
    const createProductFunction = new lambda.Function(this, "createProduct", {
      code: lambda.Code.fromAsset("lambda"),
      handler: "createProduct.createPruductHandler",
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });

    productsTable.grantReadWriteData(createProductFunction);
    stocksTable.grantReadWriteData(createProductFunction);

    // create APIs
    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Products Service",
    });

    const productsResource = api.root.addResource("products");
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsListFunction),
    );

    const productByIdResource = productsResource.addResource("{productId}");
    productByIdResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductByIdFunction),
    );

    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductFunction),
    );

    productsResource.addCorsPreflight({
      allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
      allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
      allowHeaders: cdk.aws_apigateway.Cors.DEFAULT_HEADERS,
    });

    // SQS Queue
    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // Lambda function to process SQS messages
    const catalogBatchProcessFunction = new lambda.Function(
      this,
      "CatalogBatchProcess",
      {
        code: lambda.Code.fromAsset("lambda"),
        handler: "catalogBatchProcess.catalogBatchProcessHandler",
        runtime: lambda.Runtime.NODEJS_18_X,
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCKS_TABLE: stocksTable.tableName,
        },
      },
    );

    catalogBatchProcessFunction.addEventSource(
      new sqsEventSource.SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      }),
    );

    productsTable.grantReadWriteData(catalogBatchProcessFunction);
    stocksTable.grantReadWriteData(catalogBatchProcessFunction);
  }
}
