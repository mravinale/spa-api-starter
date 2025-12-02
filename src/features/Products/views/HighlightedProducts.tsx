import { HorizontalCardList } from "@shared/components";
import ProductCard from "./ProductCard";
import { useLoadHighlightedProducts } from "../hooks/useLoadProducts";
import ProductsLoading from "./ProductsLoading";
import { Link } from "react-router-dom";

const HighlightedProducts = () => {
  const { data: highlightedProducts, isLoading } = useLoadHighlightedProducts();

  if (isLoading) {
    return <ProductsLoading />;
  }

  if (!highlightedProducts) {
    return <div className="text-muted-foreground">No highlighted products found.</div>;
  }

  const cards = highlightedProducts.map((product) => (
    <ProductCard key={product.id} product={product} />
  ));

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <HorizontalCardList cards={cards} />
      <Link
        className="text-base text-primary hover:underline transition-colors"
        to="/products"
      >
        See All Products
      </Link>
    </div>
  );
};

export default HighlightedProducts;
