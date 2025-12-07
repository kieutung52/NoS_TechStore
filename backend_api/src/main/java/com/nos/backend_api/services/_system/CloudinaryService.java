package com.nos.backend_api.services._system;

import java.io.IOException;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Tải lên file mới với folder tùy chỉnh.
     */
    public Map upload(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            log.warn("Upload request with empty file.");
            throw new IllegalArgumentException("File is empty.");
        }
        try {
            log.info("Uploading file '{}' to folder '{}'...", file.getOriginalFilename(), folder);
            Map options = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "auto"
            );
            Map result = cloudinary.uploader().upload(file.getBytes(), options);
            log.info("Uploaded: public_id={}, url={}", result.get("public_id"), result.get("secure_url"));
            return result;
        } catch (IOException e) {
            log.error("Upload failed: {}", e.getMessage(), e);
            throw new RuntimeException("Upload error: " + e.getMessage(), e);
        }
    }

    /**
     * Thay thế file với public_id cũ.
     */
    public Map replace(MultipartFile file, String publicId, String folder) {
        if (file.isEmpty() || publicId == null || publicId.isBlank()) {
            throw new IllegalArgumentException("File and publicId required.");
        }
        try {
            log.info("Replacing public_id '{}' with file '{}' in folder '{}'...", publicId, file.getOriginalFilename(), folder);
            Map options = ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "overwrite", true,
                    "invalidate", true,
                    "resource_type", "auto"
            );
            Map result = cloudinary.uploader().upload(file.getBytes(), options);
            log.info("Replaced: new_url={}", result.get("secure_url"));
            return result;
        } catch (IOException e) {
            log.error("Replace failed for public_id '{}': {}", publicId, e.getMessage(), e);
            throw new RuntimeException("Replace error: " + e.getMessage(), e);
        }
    }

    /**
     * Xóa file theo public_id.
     * Lưu ý: Cloudinary không chấp nhận 'auto' cho resource_type khi delete, phải chỉ định rõ 'image'
     */
    public Map delete(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            throw new IllegalArgumentException("Public ID required.");
        }
        try {
            log.info("Deleting public_id '{}'...", publicId);
            Map options = ObjectUtils.asMap("invalidate", true, "resource_type", "image");
            Map result = cloudinary.uploader().destroy(publicId, options);
            log.info("Deleted: result={}", result.get("result"));
            return result;
        } catch (IOException e) {
            log.error("Delete failed for public_id '{}': {}", publicId, e.getMessage(), e);
            throw new RuntimeException("Delete error: " + e.getMessage(), e);
        }
    }
}
