package com.cafe.erp.menu.application.service;

import com.cafe.erp.menu.application.command.*;
import com.cafe.erp.menu.domain.model.*;
import com.cafe.erp.menu.infrastructure.persistence.*;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;

@Service @RequiredArgsConstructor
public class MenuService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final RecipeRepository recipeRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    public List<Product> getActiveProducts() {
        return productRepository.findByActiveAndDeletedFalseOrderByDisplayOrder(true);
    }

    public List<Category> getActiveCategories() {
        return categoryRepository.findByActiveAndDeletedFalseOrderByDisplayOrder(true);
    }
    public List<Product> getProductsByCategory(UUID categoryId) {
        return productRepository.findByCategoryIdAndActiveAndDeletedFalseOrderByDisplayOrder(categoryId, true);
    }
    public List<Product> getMatchModeProducts() {
        return productRepository.findByAvailableInMatchModeAndActiveAndDeletedFalse(true, true);
    }
    public List<Product> getAllProductsForManagement() {
        List<Product> products = productRepository.findByDeletedFalseOrderByDisplayOrderAscNameAsc();
        // Build a category lookup map so we don't hit DB for every product
        java.util.Map<java.util.UUID, String> catNames = categoryRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(
                        c -> c.getId(), c -> c.getName(), (a, b) -> a));
        products.forEach(p -> {
            if (p.getCategoryId() != null) {
                p.setCategoryName(catNames.getOrDefault(p.getCategoryId(), ""));
            }
        });
        return products;
    }
    @Transactional
    public Product createProduct(CreateProductRequest req) {
        Product product = Product.builder()
                .sku(req.getSku()).name(req.getName()).sellingPrice(req.getSellingPrice())
                .categoryId(req.getCategoryId()).imageUrl(req.getImageUrl())
                .availableInMatchMode(req.isAvailableInMatchMode())
                .displayOrder(req.getDisplayOrder()).build();
        return productRepository.save(product);
    }
    @Transactional
    public Product updatePrice(UUID productId, UpdatePriceRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> BusinessException.notFound("Product"));
        PriceHistory history = PriceHistory.builder()
                .productId(productId).oldPrice(product.getSellingPrice()).newPrice(req.getNewPrice())
                .changedBy(SecurityUtils.currentUsername()).reason(req.getReason()).build();
        priceHistoryRepository.save(history);
        product.setSellingPrice(req.getNewPrice());
        return productRepository.save(product);
    }
    @Transactional
    public void toggleProduct(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> BusinessException.notFound("Product"));
        product.setActive(!product.isActive());
        productRepository.save(product);
    }
    @Transactional
    public Recipe getOrCreateRecipe(UUID productId) {
        return recipeRepository.findByProductId(productId)
            .orElseGet(() -> recipeRepository.save(Recipe.builder().productId(productId).build()));
    }
    @Transactional
    @SuppressWarnings("unchecked")
    public Recipe saveRecipe(UUID productId, java.util.Map<String,Object> body) {
        Recipe recipe = recipeRepository.findByProductId(productId)
            .orElseGet(() -> Recipe.builder().productId(productId).build());
        recipe.setNotes((String) body.getOrDefault("notes",""));
        recipe.getIngredients().clear();
        java.util.List<java.util.Map<String,Object>> ings =
            (java.util.List<java.util.Map<String,Object>>) body.getOrDefault("ingredients", java.util.List.of());
        ings.forEach(ing -> {
            RecipeIngredient ri = RecipeIngredient.builder()
                .inventoryItemId(UUID.fromString((String)ing.get("inventoryItemId")))
                .quantity(new BigDecimal(ing.get("quantity").toString()))
                .unit((String)ing.get("unit"))
                .build();
            recipe.getIngredients().add(ri);
        });
        Recipe saved = recipeRepository.save(recipe);
        saved.getIngredients().forEach(ri -> ri.setRecipeId(saved.getId()));
        return recipeRepository.save(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public Category createCategory(java.util.Map<String,Object> body) {
        var cat = new Category();
        cat.setName((String) body.get("name"));
        cat.setIcon((String) body.getOrDefault("icon", "🍽"));
        cat.setDisplayOrder(Integer.parseInt(body.getOrDefault("displayOrder", "99").toString()));
        cat.setActive(true);
        return categoryRepository.save(cat);
    }

    @org.springframework.transaction.annotation.Transactional
    public Category updateCategory(java.util.UUID id, java.util.Map<String,Object> body) {
        Category cat = categoryRepository.findById(id).orElseThrow();
        if (body.containsKey("name")) cat.setName((String) body.get("name"));
        if (body.containsKey("icon")) cat.setIcon((String) body.get("icon"));
        if (body.containsKey("displayOrder")) cat.setDisplayOrder(Integer.parseInt(body.get("displayOrder").toString()));
        if (body.containsKey("active")) cat.setActive(Boolean.parseBoolean(body.get("active").toString()));
        return categoryRepository.save(cat);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteCategory(java.util.UUID id) {
        categoryRepository.findById(id).ifPresent(c -> { c.setActive(false); categoryRepository.save(c); });
    }

    @org.springframework.transaction.annotation.Transactional
    public Product updateCost(java.util.UUID productId, java.util.Map<String, Object> body) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new com.cafe.erp.shared.infrastructure.exception.BusinessException("Product not found"));
        if (body.containsKey("costPrice")) {
            java.math.BigDecimal cost = new java.math.BigDecimal(body.get("costPrice").toString());
            product.setCostPrice(cost);
            if (product.getSellingPrice() != null && product.getSellingPrice().compareTo(java.math.BigDecimal.ZERO) > 0) {
                java.math.BigDecimal margin = product.getSellingPrice().subtract(cost)
                    .divide(product.getSellingPrice(), 4, java.math.RoundingMode.HALF_UP)
                    .multiply(java.math.BigDecimal.valueOf(100));
                product.setProfitMargin(margin);
            }
        }
        return productRepository.save(product);
    }
}
