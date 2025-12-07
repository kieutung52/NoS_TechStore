package com.nos.backend_api.services._system;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class RedisService {
    private final RedisTemplate<String, Object> redisTemplate;

    public void saveToHash(String hashKey, String field, Object data) {
        redisTemplate.opsForHash().put(hashKey, field, data);
    }

    public void saveToHash(String hashKey, String field, Object data, long timeout, TimeUnit unit) {
        redisTemplate.opsForHash().put(hashKey, field, data);
        redisTemplate.expire(hashKey, timeout, unit);
    }

    public Object getFromHash(String hashKey, String field) {
        return redisTemplate.opsForHash().get(hashKey, field);
    }

    public void deleteFromHash(String hashKey, String field) {
        redisTemplate.opsForHash().delete(hashKey, field);
    }

    public void addToSet(String setKey, Object... members) {
        redisTemplate.opsForSet().add(setKey, members);
    }

    public void removeFromSet(String setKey, Object... members) {
        redisTemplate.opsForSet().remove(setKey, members);
    }

    public Set<Object> getSetMembers(String setKey) {
        return redisTemplate.opsForSet().members(setKey);
    }

    public void setValue(String key, Object value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }

    public Object getValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteKey(String key) {
        redisTemplate.delete(key);
    }

    public void deleteKeysByPattern(String pattern) {
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    public void saveEntityWithReferences(String entityType, String entityId, Object entity, 
                                       Map<String, String> referenceIds) {
        String setKey = entityType + ":ids";
        
        saveToHash(entityType + ":data", entityId, entity);
        addToSet(setKey, entityId);
        
        if (referenceIds != null && !referenceIds.isEmpty()) {
            String referenceKey = entityType + ":refs:" + entityId;
            Map<String, String> references = referenceIds.entrySet().stream()
                .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    e -> e.getValue() != null ? e.getValue() : ""
                ));
            redisTemplate.opsForHash().putAll(referenceKey, references);
        }
    }

    @SuppressWarnings("unchecked")
    public <T> T getEntityWithResolvedReferences(String entityType, String entityId, 
                                               Class<T> clazz, Map<String, String> referenceTypes) {
        T entity = (T) getFromHash(entityType + ":data", entityId);
        
        if (entity == null) {
            return null;
        }
        
        if (referenceTypes != null && !referenceTypes.isEmpty()) {
            return resolveReferences(entity, entityType, entityId, referenceTypes);
        }
        
        return entity;
    }

    public void deleteEntity(String entityType, String entityId) {
        String hashKey = entityType + ":data";
        String setKey = entityType + ":ids";
        String refKey = entityType + ":refs:" + entityId;
        
        deleteFromHash(hashKey, entityId);
        removeFromSet(setKey, entityId);
        
        deleteKey(refKey);
        
        log.info("Deleted entity {}:{} from cache", entityType, entityId);
    }

    public <T> List<T> getAllEntities(String entityType, Class<T> clazz, 
                                     Map<String, String> referenceTypes) {
        String setKey = entityType + ":ids";
        
        Set<Object> ids = getSetMembers(setKey);
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        
        return ids.stream()
                .map(id -> getEntityWithResolvedReferences(entityType, id.toString(), clazz, referenceTypes))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public List<String> findEntitiesByReference(String entityType, String referenceField, String referenceValue) {
        String setKey = entityType + ":ids";
        Set<Object> allIds = getSetMembers(setKey);
        
        if (allIds == null || allIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return allIds.stream()
                .filter(id -> {
                    String refKey = entityType + ":refs:" + id;
                    Object value = getFromHash(refKey, referenceField);
                    return referenceValue.equals(value != null ? value.toString() : null);
                })
                .map(Object::toString)
                .collect(Collectors.toList());
    }

    public void evictRelatedEntities(String referenceType, String referenceId) {
        Set<String> entityTypes = Set.of("product", "brand", "category", "user", "order");
        
        for (String entityType : entityTypes) {
            List<String> relatedEntities = findEntitiesByReference(entityType, referenceType + "Id", referenceId);
            for (String entityId : relatedEntities) {
                deleteEntity(entityType, entityId);
            }
        }
        
        log.info("Evicted related entities for {}:{}", referenceType, referenceId);
    }


    private <T> T resolveReferences(T entity, String entityType, String entityId, 
                                   Map<String, String> referenceTypes) {
        
        String refKey = entityType + ":refs:" + entityId;
        Map<Object, Object> references = redisTemplate.opsForHash().entries(refKey);
        
        if (references.isEmpty()) {
            return entity;
        }
        
        return entity;
    }
}