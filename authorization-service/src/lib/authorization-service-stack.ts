import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dotenvLayer = new lambda.LayerVersion(this, "DotenvLayer", {
      code: lambda.Code.fromAsset(
        join(__dirname, "..", "lambda-layer/lambda_layer.zip"),
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "A layer that includes the dotenv package",
    });

    const basicAuthorizerFunction = new lambda.Function(
      this,
      "BasicAuthorizerFunction",
      {
        code: lambda.Code.fromAsset(join(__dirname, "..", "lambda")),
        handler: "basicAuthorizer.handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        layers: [dotenvLayer],
        environment: {
          akimserik: process.env.akimserik!,
        },
      },
    );

    // Add permission for the Import Service API Gateway to call this authorizer Lambda
    basicAuthorizerFunction.addPermission("ApiGatewayInvokePermission", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:*/authorizers/*`,
    });
  }
}
