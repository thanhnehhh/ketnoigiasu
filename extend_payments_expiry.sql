-- ============================================================
-- GIA HẠN HÓA ĐƠN HẾT HẠN - Dùng khi test thanh toán
-- Chạy trong MySQL Workbench hoặc DBeaver
-- ============================================================

USE ketnoigiasu_db;

-- Xem trạng thái hóa đơn hiện tại trước khi gia hạn
SELECT id, payment_type, status, amount, expires_at,
       CASE WHEN expires_at < NOW() THEN 'HẾT HẠN' ELSE 'CÒN HẠN' END as tinh_trang
FROM payments
WHERE payment_type = 'TUITION_FEE'
ORDER BY created_at DESC;

-- ============================================================
-- Gia hạn tất cả TUITION_FEE còn PENDING (bao gồm đã hết hạn)
-- Cộng thêm 7 ngày kể từ NOW()
-- ============================================================
UPDATE payments
SET expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
WHERE payment_type = 'TUITION_FEE'
  AND status IN ('PENDING', 'PENDING_VERIFY');

-- Kiểm tra sau khi gia hạn
SELECT id, payment_type, status, amount, expires_at
FROM payments
WHERE payment_type = 'TUITION_FEE'
ORDER BY created_at DESC;
