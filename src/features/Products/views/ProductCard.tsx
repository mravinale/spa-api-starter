import type { IProductView } from "../types";
import { IconButton } from "@shared/components";
import { Heart } from "lucide-react";
import { useProductsStore } from "../productsStore";
import { Card, CardContent, CardFooter } from "@shared/components/ui";

export interface IProductCardProps {
  product: IProductView;
}

const ProductCard = ({ product }: IProductCardProps) => {
  const toggleFavorite = useProductsStore((state) => state.toggleFavorite);
  const isFavorite = useProductsStore((state) => state.isFavorite(product.id));

  const handleClick = () => {
    toggleFavorite(product.id);
  };

  return (
    <Card className="min-w-[280px] min-h-[260px]">
      <CardContent className="p-4">
        {product.image && (
          <div className="relative aspect-[3/2]">
            <img
              className="object-contain w-full h-full"
              src={product.image}
              alt={product.name}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center px-4 pb-4">
        <div className="flex flex-col gap-2">
          <h6 className="text-base font-medium">{product.name}</h6>
          <p className="font-semibold">${product.price}</p>
        </div>
        <IconButton
          active={isFavorite}
          icon={<Heart className="h-4 w-4" />}
          handleClick={handleClick}
        />
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
