import { useLoadProducts } from "../hooks/useLoadProducts";
import FavoritesCounter from "./FavoritesCounter";
import ProductsList from "./ProductsList";
import ProductsLoading from "./ProductsLoading";

function ProductsPage() {
  const { data: products, isLoading } = useLoadProducts();

  const lastUpdate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());

  if (isLoading) {
    return <ProductsLoading />;
  }

  if (!products) {
    return <div className="text-muted-foreground">No products found</div>;
  }

  return (
    <main>
      <section className="flex items-center justify-between pb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Products</h3>
          <p className="text-xs text-muted-foreground">{lastUpdate}</p>
        </div>
        <FavoritesCounter />
      </section>
      <ProductsList products={products} />
    </main>
  );
}

export default ProductsPage;
