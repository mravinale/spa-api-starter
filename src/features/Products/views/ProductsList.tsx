import type { IProductView } from "../types";
import ProductCard from "./ProductCard";

export interface IProductsListProps {
  products: IProductView[];
}

const ProductsList = ({ products }: IProductsListProps) => {
  // implement ProductsList filters, sorting, search, etc..

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};

export default ProductsList;
