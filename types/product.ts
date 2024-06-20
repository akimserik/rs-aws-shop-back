export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface Stock {
  product_id: string;
  count: number;
}

export interface ProductStock extends Product {
  count?: number;
}
