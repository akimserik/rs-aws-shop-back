import { headersConfig } from "./headers";

export const response = (statusCode: number, message: any) => ({
  statusCode,
  headers: headersConfig,
  body: JSON.stringify(message),
});
