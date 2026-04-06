import { ProductsRepository } from './products.repository';
import { CreateProductInput, UpdateProductInput, ProductFilters } from './products.types';

const productsRepository = new ProductsRepository();

export class ProductsService {

  // Create product
  async createProduct(input: CreateProductInput, shopId: string, userId: string) {
    // Check if SKU already exists in this shop
    const existingProduct = await productsRepository.getProductBySku(input.sku, shopId);
    if (existingProduct) {
      throw new Error(`Product with SKU '${input.sku}' already exists in this shop`);
    }

    const { initialStock, ...productData } = input;

    const product = await productsRepository.createProduct(
      {
        ...productData,
        shopId,
        price: String(input.price),
        cost: input.cost ? String(input.cost) : undefined,
        taxRate: input.taxRate ? String(input.taxRate) : undefined,
      },
      initialStock ?? 0,
      userId
    );

    return product;
  }

  // Get all products
  async getProducts(shopId: string, filters: ProductFilters) {
    return await productsRepository.getProducts(shopId, filters);
  }

  // Get single product
  async getProductById(productId: string, shopId: string) {
    const product = await productsRepository.getProductById(productId, shopId);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  // Update product
  async updateProduct(productId: string, shopId: string, input: UpdateProductInput, userId: string) {
    // Check product exists
    const existing = await productsRepository.getProductById(productId, shopId);
    if (!existing) {
      throw new Error('Product not found');
    }

    const updated = await productsRepository.updateProduct(
      productId,
      shopId,
      {
        ...input,
        price: input.price ? String(input.price) : undefined,
        cost: input.cost ? String(input.cost) : undefined,
        taxRate: input.taxRate ? String(input.taxRate) : undefined,
      },
      userId
    );

    return updated;
  }

  // Delete product (soft delete)
  async deleteProduct(productId: string, shopId: string, userId: string) {
    const existing = await productsRepository.getProductById(productId, shopId);
    if (!existing) {
      throw new Error('Product not found');
    }

    return await productsRepository.deleteProduct(productId, shopId, userId);
  }

  // Get product with inventory
  async getProductWithInventory(productId: string, shopId: string) {
    const product = await productsRepository.getProductById(productId, shopId);
    if (!product) {
      throw new Error('Product not found');
    }

    const inventoryData = await productsRepository.getProductInventory(productId, shopId);

    return {
      ...product,
      inventory: inventoryData,
    };
  }

  // Update inventory
  async updateInventory(productId: string, shopId: string, quantity: number, userId: string) {
    const product = await productsRepository.getProductById(productId, shopId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await productsRepository.updateInventory(productId, shopId, quantity, userId);
  }
}