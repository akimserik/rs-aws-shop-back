import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const basicAuthorizerFunction = new lambda.Function(
      this,
      "BasicAuthorizerFunction",
      {
        code: lambda.Code.fromAsset(join(__dirname, "..", "lambda")),
        handler: "basicAuthorizer.handler",
        runtime: lambda.Runtime.NODEJS_18_X,
        environment: {
          akimserik: process.env.akimserik!,
        },
      },
    );
  }
}
