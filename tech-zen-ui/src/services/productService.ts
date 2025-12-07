import { apiCall } from './api';
import type {
  ProductResponse,
  ApiResponse,
  PagedResponse,
  ProductSearchRequest,
  CreateProductRequest,
  UpdateProductRequest,
  CreateVariantRequest,
  UpdateVariantRequest,
  UploadImageRequest,
  ImageActionRequest,
  ProductImageResponse,
  ProductVariantResponse,
} from '../types';


const flattenAttributes = (attributes?: Record<string, string>): string[] => {
  if (!attributes) return [];
  return Object.entries(attributes).flatMap(([key, value]) => [`attributes.${key}=${encodeURIComponent(value)}`]);
};

/**
 * Fixed buildQueryString: Handle nested search/attributes, omit invalid sort
 */
const buildQueryString = (params: Record<string, unknown>): string => {
  const queryParts = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '' && key !== 'sort')  
    .flatMap(key => {
      if (key === 'search' && typeof params[key] === 'object' && params[key]) {
        const searchParams = params[key] as Record<string, string>;
        return Object.entries(searchParams).map(([sk, sv]) => `search.${sk}=${encodeURIComponent(sv)}`);
      }
      if (key === 'attributes' && typeof params[key] === 'object' && params[key]) {
        return flattenAttributes(params[key] as Record<string, string>);
      }
      return [`${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`];
    });

  
  const sort = params.sort;
  let sortParam = '';
  if (sort) {
    if (sort === 'default') {
      sortParam = '';  
    } else if (sort === 'newest') {
      sortParam = 'sort=createdAt,desc';
    } else if (sort === 'priceLowToHigh') {
      sortParam = 'sort=minPrice,asc';  
    } else if (sort === 'priceHighToLow') {
      sortParam = 'sort=minPrice,desc';
    } else {
      sortParam = `sort=${encodeURIComponent(String(sort))}`;
    }
  }

  const query = [...queryParts, sortParam].filter(Boolean).join('&');
  return query ? `?${query}` : '';
};

export const productService = {
  /**
   * GET /products - Fixed with flatten & sort map
   */
  async getProducts(
    params: ProductSearchRequest & { page?: number; size?: number; sort?: string }  
  ): Promise<ApiResponse<PagedResponse<ProductResponse>>> {
    
    if (Object.keys(params).some(k => k !== 'page' && k !== 'size' && params[k])) {
      params.page = 0;  
    }
    const queryString = buildQueryString(params as unknown as Record<string, unknown>);
    return apiCall('GET', `/products${queryString}`);
  },

  /**
   * GET /products/{id}
   */
  async getProductById(id: string): Promise<ApiResponse<ProductResponse>> {
    return apiCall('GET', `/products/${id}`);
  },

  /**
   * POST /products (Admin)
   */
  async createProduct(request: CreateProductRequest): Promise<ApiResponse<ProductResponse>> {
    return apiCall('POST', '/products', request);
  },

  /**
   * PUT /products/{id} (Admin)
   */
  async updateProduct(id: string, request: UpdateProductRequest): Promise<ApiResponse<ProductResponse>> {
    return apiCall('PUT', `/products/${id}`, request);
  },

  /**
   * DELETE /products/{id} (Admin)
   */
  async deleteProduct(id: string): Promise<ApiResponse<null>> {
    return apiCall('DELETE', `/products/${id}`);
  },

  /**
   * POST /products/{id}/variants (Admin)
   */
  async createVariant(id: string, request: CreateVariantRequest): Promise<ApiResponse<ProductVariantResponse>> {
    return apiCall('POST', `/products/${id}/variants`, request);
  },

  /**
   * PUT /products/{id}/variants/{variantId} (Admin)
   */
  async updateVariant(id: string, variantId: string, request: UpdateVariantRequest): Promise<ApiResponse<ProductVariantResponse>> {
    return apiCall('PUT', `/products/${id}/variants/${variantId}`, request);
  },

  /**
   * DELETE /products/{id}/variants/{variantId} (Admin)
   */
  async deleteVariant(id: string, variantId: string): Promise<ApiResponse<null>> {
    return apiCall('DELETE', `/products/${id}/variants/${variantId}`);
  },

  /**
   * POST /products/{id}/images (Admin, multipart)
   */
  async uploadImage(
    id: string,
    request: UploadImageRequest,
    file: File
  ): Promise<ApiResponse<ProductImageResponse>> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    formData.append('file', file);
    return apiCall('POST', `/products/${id}/images`, formData);
  },

  /**
   * PUT /products/{id}/images/{imageId} (Admin, multipart)
   */
  async replaceImage(
    id: string,
    imageId: string,
    request: ImageActionRequest,
    file: File
  ): Promise<ApiResponse<ProductImageResponse>> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    formData.append('file', file);
    return apiCall('PUT', `/products/${id}/images/${imageId}`, formData);
  },

  /**
   * PUT /products/{id}/images/{imageId}/thumbnail (Admin)
   */
  async setThumbnail(id: string, imageId: string): Promise<ApiResponse<null>> {
    return apiCall('PUT', `/products/${id}/images/${imageId}/thumbnail`);
  },

  /**
   * DELETE /products/{id}/images/{imageId} (Admin)
   */
  async deleteImage(id: string, imageId: string): Promise<ApiResponse<null>> {
    return apiCall('DELETE', `/products/${id}/images/${imageId}`);
  },
};