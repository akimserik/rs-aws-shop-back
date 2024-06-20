import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class RsAwsShopBackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // products
    const productsTable = dynamoDb.Table.fromTableName(
      this,
      "products",
      "products",
    );
    const stocksTable = dynamoDb.Table.fromTableName(this, "stocks", "stocks");

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

    // api
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
  }
}
