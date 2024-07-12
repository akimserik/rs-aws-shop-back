import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  StatementEffect,
} from "aws-lambda";
import * as dotenv from "dotenv";
import { headersConfig } from "./helpers/headers";

dotenv.config();

const generatePolicy = (
  principalId: string,
  effect: StatementEffect,
  resource: string,
  context: any = {},
): APIGatewayAuthorizerResult => {
  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };
  return authResponse;
};

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Event:", event);

  if (!event.authorizationToken) {
    return generatePolicy("unauthorized", "Deny", event.methodArn, {
      statusCode: 401,
      headers: headersConfig,
      message: "Unauthorized",
    });
  }

  const token = event.authorizationToken.split(" ")[1];
  const decodedCredentials = Buffer.from(token, "base64").toString("utf-8");
  const [username, password] = decodedCredentials.split(":");

  const storedPassword = process.env[username];

  try {
    if (storedPassword && storedPassword === password) {
      console.log("Successfully authorized!");
      return generatePolicy(username, "Allow", event.methodArn);
    } else {
      console.log("Unauthorized! Wrong credentials!");
      return generatePolicy("unauthorized", "Deny", event.methodArn, {
        statusCode: 403,
        headers: headersConfig,
        message: "Forbidden",
      });
    }
  } catch (error) {
    console.log("Unhandled error!", error);
    return generatePolicy("unauthorized", "Deny", event.methodArn, {
      statusCode: 500,
      headers: headersConfig,
      message: "Error during authorizatoion",
    });
  }
};
