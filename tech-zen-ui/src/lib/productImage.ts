import type { ProductImageResponse } from "@/types";

/**
 * Chỉ số ảnh đại diện của một phiên bản: ảnh có isThumbnail, nếu không có thì ảnh đầu tiên.
 * Dùng chung để card, trang chi tiết và hộp thoại "Thêm vào giỏ" hiện cùng một ảnh.
 */
export const thumbnailIndex = (images?: ProductImageResponse[]): number => {
  const i = images?.findIndex((img) => img.isThumbnail) ?? -1;
  return i >= 0 ? i : 0;
};

export const thumbnailUrl = (images?: ProductImageResponse[]): string | undefined =>
  images?.[thumbnailIndex(images)]?.imageUrl;
