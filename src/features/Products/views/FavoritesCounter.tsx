import { Heart } from "lucide-react";
import { useProductsStore } from "../productsStore";
import { Badge } from "@shared/components/ui";

const FavoritesCounter = () => {
  const favoriteProducts = useProductsStore((state) => state.favoriteProducts);

  return (
    <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-sm font-medium">{favoriteProducts.length}</span>
      <Heart className="h-4 w-4" />
    </Badge>
  );
};

export default FavoritesCounter;
