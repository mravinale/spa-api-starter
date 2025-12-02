// import { eComApi, ENDPOINTS } from '@shared/api';
import type { IProductDto, IProductView } from './types';

// Mock data for demo purposes
const PRODUCTS_MOCK: IProductDto[] = [
    {
        id: 1,
        name: 'Premium Headphones',
        description: 'High-quality wireless headphones',
        price: 299.99,
        image: 'https://via.placeholder.com/300x300',
        category: 'Electronics',
        stock: 15,
        rating: 4.5,
    },
    {
        id: 2,
        name: 'Laptop Stand',
        description: 'Ergonomic aluminum laptop stand',
        price: 79.99,
        image: 'https://via.placeholder.com/300x300',
        category: 'Accessories',
        stock: 30,
        rating: 4.8,
    },
    {
        id: 3,
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical gaming keyboard',
        price: 149.99,
        image: 'https://via.placeholder.com/300x300',
        category: 'Electronics',
        stock: 0,
        rating: 4.7,
    },
];

const HIGHLIGHTED_PRODUCTS_MOCK: IProductDto[] = PRODUCTS_MOCK.slice(0, 2);

// Transform DTO to View Model
function transformProduct(dto: IProductDto): IProductView {
    return {
        id: dto.id.toString(),
        name: dto.name,
        description: dto.description,
        price: dto.price,
        image: dto.image,
        category: dto.category,
        stock: dto.stock,
        rating: dto.rating,
        isInStock: dto.stock > 0,
    };
}

// Products Service - handles all product-related API calls
export const productsService = {
    /**
     * Fetch all products
     */
    async getProducts(): Promise<IProductView[]> {
        // TODO: Replace with real API call once backend is ready
        // const response = await eComApi.get<IProductDto[]>(ENDPOINTS.PRODUCTS.GET_ALL);
        // return response.data.map(transformProduct);

        // Using mock data for demo
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(PRODUCTS_MOCK.map(transformProduct));
            }, 2000);
        });
    },

    /**
     * Fetch highlighted products
     */
    async getHighlightedProducts(): Promise<IProductView[]> {
        // TODO: Replace with real API call once backend is ready
        // const response = await eComApi.get<IProductDto[]>(ENDPOINTS.PRODUCTS.GET_HIGHLIGHTED);
        // return response.data.map(transformProduct);

        // Using mock data for demo
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(HIGHLIGHTED_PRODUCTS_MOCK.map(transformProduct));
            }, 2000);
        });
    },
};
