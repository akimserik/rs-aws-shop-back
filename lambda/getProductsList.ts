import products from "./mockData";

exports.handler = async (event: any) => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(products),
  };
};
