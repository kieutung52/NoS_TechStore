package com.nos.backend_api.services._system;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

/**
 * Lưu ảnh vào một thư mục trên máy chủ, phục vụ công khai qua /uploads/**.
 * public_id = đường dẫn tương đối trong thư mục gốc, ví dụ "brands/1/<uuid>.png".
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements ImageStorageService {

    public static final String URL_PREFIX = "/uploads";

    // Không nhận SVG: file SVG có thể chứa script khi mở trực tiếp.
    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("jpg", "jpeg", "png", "gif", "webp", "avif", "mp4", "webm", "mov");

    private final Path rootDir;
    private final String publicBaseUrl;

    public LocalStorageService(@Value("${app.storage.local.dir}") String dir,
                               @Value("${app.storage.local.public-url}") String publicUrl) {
        this.rootDir = Paths.get(dir).toAbsolutePath().normalize();
        this.publicBaseUrl = publicUrl.replaceAll("/+$", "");
        try {
            Files.createDirectories(rootDir);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create upload directory: " + rootDir, e);
        }
        log.info("Local image storage at '{}', served as '{}'", rootDir, publicBaseUrl);
    }

    public Path getRootDir() {
        return rootDir;
    }

    @Override
    public Map<String, Object> upload(MultipartFile file, String folder) {
        String extension = validateAndGetExtension(file);
        String publicId = sanitizeFolder(folder) + "/" + UUID.randomUUID() + "." + extension;
        write(file, publicId);
        log.info("Uploaded '{}' as public_id={}", file.getOriginalFilename(), publicId);
        return result(publicId, null);
    }

    /** Ghi đè đúng public_id cũ (giống overwrite của Cloudinary); thêm ?v= để trình duyệt không dùng ảnh cache cũ. */
    @Override
    public Map<String, Object> replace(MultipartFile file, String publicId, String folder) {
        if (file.isEmpty() || publicId == null || publicId.isBlank()) {
            throw new IllegalArgumentException("File and publicId required.");
        }
        validateAndGetExtension(file);
        write(file, publicId);
        log.info("Replaced public_id={} with '{}'", publicId, file.getOriginalFilename());
        return result(publicId, System.currentTimeMillis());
    }

    @Override
    public Map<String, Object> delete(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            throw new IllegalArgumentException("Public ID required.");
        }
        try {
            boolean deleted = Files.deleteIfExists(resolve(publicId));
            log.info("Deleted public_id={}: {}", publicId, deleted);
            return Map.of("result", deleted ? "ok" : "not found");
        } catch (IOException e) {
            log.error("Delete failed for public_id '{}': {}", publicId, e.getMessage(), e);
            throw new RuntimeException("Delete error: " + e.getMessage(), e);
        }
    }

    private String validateAndGetExtension(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            log.warn("Upload request with empty file.");
            throw new IllegalArgumentException("File is empty.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.startsWith("image/") || contentType.startsWith("video/"))) {
            throw new IllegalArgumentException("Only image or video files are allowed.");
        }
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        extension = extension == null ? "" : extension.toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file type: ." + extension);
        }
        return extension;
    }

    /** Chỉ giữ ký tự an toàn: không có dấu chấm nên không thể thoát ra ngoài thư mục gốc. */
    private String sanitizeFolder(String folder) {
        String safe = folder == null ? "" : folder.replaceAll("[^A-Za-z0-9/_-]", "_");
        safe = safe.replaceAll("/{2,}", "/").replaceAll("^/+|/+$", "");
        return safe.isEmpty() ? "misc" : safe;
    }

    private Path resolve(String publicId) {
        Path target = rootDir.resolve(publicId).normalize();
        if (!target.startsWith(rootDir)) {
            throw new IllegalArgumentException("Invalid public ID.");
        }
        return target;
    }

    private void write(MultipartFile file, String publicId) {
        Path target = resolve(publicId);
        try (InputStream in = file.getInputStream()) {
            Files.createDirectories(target.getParent());
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Upload failed for '{}': {}", publicId, e.getMessage(), e);
            throw new RuntimeException("Upload error: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> result(String publicId, Long version) {
        String url = publicBaseUrl + "/" + publicId + (version != null ? "?v=" + version : "");
        Map<String, Object> result = new HashMap<>();
        result.put("public_id", publicId);
        result.put("secure_url", url);
        result.put("url", url);
        return result;
    }
}
