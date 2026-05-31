-- Cập nhật tên môn học cũ về đúng tên chuẩn
UPDATE subjects SET name = 'Toán' WHERE name = 'Toán Học' OR name = 'Toan Hoc' OR name = 'toan';
UPDATE subjects SET name = 'Lý' WHERE name = 'Vật Lý' OR name = 'Vat Ly' OR name = 'ly';
UPDATE subjects SET name = 'Hóa' WHERE name = 'Hóa Học' OR name = 'Hoa Hoc';
UPDATE subjects SET name = 'Văn' WHERE name = 'Ngữ Văn' OR name = 'Ngu Van';
UPDATE subjects SET name = 'Tiếng Anh' WHERE name = 'Tieng Anh' OR name = 'English';
UPDATE subjects SET name = 'Lịch sử' WHERE name = 'Lich Su';
UPDATE subjects SET name = 'Địa lý' WHERE name = 'Dia Ly';
UPDATE subjects SET name = 'Sinh học' WHERE name = 'Sinh Hoc';
UPDATE subjects SET name = 'Tin học' WHERE name = 'Tin Hoc';

-- Thêm môn chưa có
INSERT IGNORE INTO subjects (name) VALUES
('Toán'),
('Lý'),
('Hóa'),
('Văn'),
('Tiếng Anh'),
('Tiếng Trung'),
('Tiếng Nhật'),
('IELTS'),
('TOEIC'),
('Lịch sử'),
('Địa lý'),
('Sinh học'),
('Tin học');
