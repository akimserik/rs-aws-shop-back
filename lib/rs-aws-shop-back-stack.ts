import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class RsAwsShopBackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListFunction = new lambda.Function(
      this,
      "getProductsList",
      {
        code: lambda.Code.fromAsset("lambda"),
        handler: "getProductsList.handler",
        runtime: lambda.Runtime.NODEJS_18_X,
      },
    );

    const api = new apigateway.LambdaRestApi(this, "getProductsListApi", {
      handler: getProductsListFunction,
      proxy: false,
    });

    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET");
  }
}
