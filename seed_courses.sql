-- ============================================================
-- SEED COURSES - KetNoiGiaSu
-- Chạy script này trong MySQL Workbench hoặc DBeaver
-- Yêu cầu: đã có ít nhất 1 gia sư và subjects trong DB
-- ============================================================

USE ketnoigiasu_db;

-- Xem tutor_id và subject_id hiện có trước khi chạy:
-- SELECT tp.id as tutor_id, u.full_name, u.email FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id;
-- SELECT id, name FROM subjects;

-- ============================================================
-- INSERT COURSES (dùng subquery lấy tutor_id và subject_id tự động)
-- ============================================================

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Toán' LIMIT 1),
    'Toán lớp 9 - Ôn thi vào 10 cấp tốc',
    'Luyện đề thi vào lớp 10 chuyên sâu, tập trung vào đại số và hình học. Cam kết tăng ít nhất 2 điểm sau 1 tháng.',
    250000, 20, 'APPROVED', 0, 'OFFLINE', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Toán' LIMIT 1),
    'Toán lớp 12 - Luyện thi THPT Quốc Gia',
    'Ôn tập toàn bộ chương trình Toán 12, giải đề thi thử các trường. Phương pháp tư duy logic, không học vẹt.',
    300000, 30, 'APPROVED', 1, 'BOTH', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Lý' LIMIT 1),
    'Vật Lý lớp 11 - Điện học & Quang học',
    'Giải thích trực quan bằng thí nghiệm thực tế. Học sinh nắm vững lý thuyết và biết cách giải bài tập nhanh.',
    200000, 15, 'APPROVED', 0, 'ONLINE', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Hóa' LIMIT 1),
    'Hóa học lớp 10 - Nền tảng vững chắc',
    'Xây dựng nền tảng Hóa học từ cơ bản đến nâng cao. Học sinh hiểu bản chất phản ứng, không cần học thuộc lòng.',
    180000, 12, 'APPROVED', 0, 'OFFLINE', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Tiếng Anh' LIMIT 1),
    'Tiếng Anh giao tiếp - Từ 0 đến tự tin',
    'Học tiếng Anh theo phương pháp giao tiếp thực tế. Sau 3 tháng có thể tự tin nói chuyện với người nước ngoài.',
    350000, 24, 'APPROVED', 1, 'ONLINE', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Tiếng Anh' LIMIT 1),
    'IELTS 6.5+ - Lộ trình 3 tháng',
    'Luyện 4 kỹ năng Listening, Reading, Writing, Speaking theo format IELTS thực tế. Cam kết đạt 6.5 sau 3 tháng.',
    500000, 36, 'APPROVED', 0, 'BOTH', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Văn' LIMIT 1),
    'Ngữ Văn lớp 12 - Viết văn hay & đúng',
    'Hướng dẫn cách phân tích tác phẩm, viết văn nghị luận đạt điểm cao. Có bộ đề thi thử đầy đủ.',
    150000, 18, 'APPROVED', 0, 'OFFLINE', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Tin học' LIMIT 1),
    'Lập trình Python cơ bản cho học sinh',
    'Học lập trình Python từ đầu, làm các dự án thực tế như game đơn giản, xử lý dữ liệu. Phù hợp lớp 8-12.',
    200000, 20, 'APPROVED', 0, 'ONLINE', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Sinh học' LIMIT 1),
    'Sinh học lớp 12 - Di truyền & Tiến hóa',
    'Nắm chắc lý thuyết di truyền, giải bài tập phả hệ và bài tập lai. Tỉ lệ đậu THPT Quốc Gia cao.',
    170000, 15, 'APPROVED', 0, 'BOTH', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Lịch sử' LIMIT 1),
    'Lịch sử lớp 12 - Ôn thi THPT hiệu quả',
    'Hệ thống hóa kiến thức lịch sử theo timeline, dễ nhớ và không nhầm lẫn. Có sơ đồ tư duy đầy đủ.',
    130000, 10, 'APPROVED', 0, 'OFFLINE', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Địa lý' LIMIT 1),
    'Địa lý lớp 12 - Atlat & Kỹ năng đọc bản đồ',
    'Hướng dẫn sử dụng Atlat hiệu quả, phân tích biểu đồ và trả lời câu hỏi tự luận đạt điểm tối đa.',
    130000, 10, 'APPROVED', 0, 'ONLINE', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

INSERT INTO courses (tutor_id, subject_id, title, description, price_per_session, total_sessions, status, is_promoted, teaching_mode, created_at, updated_at)
SELECT
    tp.id,
    (SELECT id FROM subjects WHERE name = 'Tiếng Trung' LIMIT 1),
    'Tiếng Trung HSK 2 - Giao tiếp cơ bản',
    'Học tiếng Trung từ phát âm, ngữ pháp đến hội thoại thực tế. Đạt HSK 2 sau 2 tháng học.',
    280000, 16, 'APPROVED', 0, 'ONLINE', NOW(), NOW()
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id
WHERE u.role = 'TUTOR' AND u.enabled = 1
LIMIT 1;

-- Kiểm tra kết quả
SELECT c.id, c.title, c.price_per_session, c.status, c.teaching_mode, s.name as subject, u.full_name as tutor
FROM courses c
JOIN subjects s ON c.subject_id = s.id
JOIN tutor_profiles tp ON c.tutor_id = tp.id
JOIN users u ON tp.user_id = u.id
ORDER BY c.id DESC
LIMIT 20;
