import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class RsAwsShopBackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // products
    const getProductsListFunction = new lambda.Function(
      this,
      "getProductsList",
      {
        code: lambda.Code.fromAsset("lambda"),
        handler: "getProductsList.handler",
        runtime: lambda.Runtime.NODEJS_18_X,
      },
    );

    // products/{productId}
    const getProductByIdFunction = new lambda.Function(this, "getProductById", {
      code: lambda.Code.fromAsset("lambda"),
      handler: "getProductById.handler",
      runtime: lambda.Runtime.NODEJS_18_X,
    });

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
