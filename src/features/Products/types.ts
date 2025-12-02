// Data Transfer Object (from API)
export interface IProductDto {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    stock: number;
    rating: number;
}

// View Model (for UI)
export interface IProductView {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    stock: number;
    rating: number;
    isInStock: boolean;
}
