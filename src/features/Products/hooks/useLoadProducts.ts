import { useQuery } from "@tanstack/react-query";
import { productsService } from "../productsService";

export const useLoadProducts = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["get-all-products"],
    queryFn: () => productsService.getProducts(),
  });

  return { data, error, isLoading };
};

export const useLoadHighlightedProducts = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["get-highlighted-products"],
    queryFn: () => productsService.getHighlightedProducts(),
  });

  return { data, error, isLoading };
};
