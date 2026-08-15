ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS sent_to_kitchen_at TIMESTAMP;