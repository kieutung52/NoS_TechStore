package com.nos.backend_api.services._system;

import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

/**
 * Hợp đồng lưu trữ ảnh/file đính kèm.
 * Map trả về giữ đúng key của Cloudinary ("secure_url", "public_id") để các service gọi không phải đổi.
 * Chọn bản cài đặt bằng app.storage.provider = local | cloudinary.
 */
@SuppressWarnings("rawtypes")
public interface ImageStorageService {

    Map upload(MultipartFile file, String folder);

    Map replace(MultipartFile file, String publicId, String folder);

    Map delete(String publicId);
}
