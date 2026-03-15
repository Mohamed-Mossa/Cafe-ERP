-- Seed products using subqueries so IDs don't need to be hardcoded
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'HOT-001','Espresso',          25.00, id, 1, false, true FROM categories WHERE name='Hot Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'HOT-002','Americano',         30.00, id, 2, false, true FROM categories WHERE name='Hot Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'HOT-003','Cappuccino',        35.00, id, 3, false, true FROM categories WHERE name='Hot Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'HOT-004','Latte',             40.00, id, 4, false, true FROM categories WHERE name='Hot Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'HOT-005','Hot Chocolate',     40.00, id, 5, false, true FROM categories WHERE name='Hot Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'HOT-006','Turkish Coffee',    20.00, id, 6, false, true FROM categories WHERE name='Hot Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'HOT-007','Matcha Latte',      45.00, id, 7, false, true FROM categories WHERE name='Hot Drinks' ON CONFLICT DO NOTHING;

INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'COLD-001','Iced Latte',       50.00, id, 1, false, true FROM categories WHERE name='Cold Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'COLD-002','Iced Americano',   45.00, id, 2, false, true FROM categories WHERE name='Cold Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'COLD-003','Frappuccino',      65.00, id, 3, false, true FROM categories WHERE name='Cold Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'COLD-004','Fresh Orange Juice',55.00, id, 4, false, true FROM categories WHERE name='Cold Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'COLD-005','Smoothie',         70.00, id, 5, false, true FROM categories WHERE name='Cold Drinks' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'COLD-006','Mojito Virgin',    60.00, id, 6, false, true FROM categories WHERE name='Cold Drinks' ON CONFLICT DO NOTHING;

INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'DES-001','Cheesecake',        85.00, id, 1, false, true FROM categories WHERE name='Desserts' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'DES-002','Chocolate Brownie', 65.00, id, 2, false, true FROM categories WHERE name='Desserts' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'DES-003','Waffles',           90.00, id, 3, false, true FROM categories WHERE name='Desserts' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'DES-004','Kunafa',            80.00, id, 4, false, true FROM categories WHERE name='Desserts' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'DES-005','Creme Brulee',      95.00, id, 5, false, true FROM categories WHERE name='Desserts' ON CONFLICT DO NOTHING;

INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'SAN-001','Club Sandwich',     95.00, id, 1, false, true FROM categories WHERE name='Sandwiches' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'SAN-002','Grilled Chicken',  110.00, id, 2, false, true FROM categories WHERE name='Sandwiches' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'SAN-003','Tuna Melt',         90.00, id, 3, false, true FROM categories WHERE name='Sandwiches' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'SAN-004','Veggie Wrap',       80.00, id, 4, false, true FROM categories WHERE name='Sandwiches' ON CONFLICT DO NOTHING;

INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'PS-001','Energy Drink',       45.00, id, 1, true, true FROM categories WHERE name='PlayStation' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'PS-002','Chips & Snacks',     35.00, id, 2, true, true FROM categories WHERE name='PlayStation' ON CONFLICT DO NOTHING;
INSERT INTO products (sku, name, selling_price, category_id, display_order, available_in_match_mode, active)
SELECT 'PS-003','Water Bottle',       15.00, id, 3, false, true FROM categories WHERE name='PlayStation' ON CONFLICT DO NOTHING;
