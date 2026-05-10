# TÀI LIỆU SẢN PHẨM
## HỆ THỐNG KẾT NỐI GIA SƯ
### Báo cáo sau lễ 1 tuần

---

**Nhóm thực hiện:** Trần Ngọc Thanh  
**Ngày báo cáo:** 10/05/2026  
**Công nghệ:** Spring Boot 4.0.5 (Java 17) · MySQL · JWT | React 19 + TypeScript (Vite)

---

## I. TỔNG QUAN HỆ THỐNG

Kết Nối Gia Sư là nền tảng trung gian kết nối học viên với gia sư, hỗ trợ toàn bộ quy trình từ đăng ký tài khoản, tìm kiếm khóa học, ký hợp đồng, thanh toán học phí đến quản lý lớp học và đánh giá.

### Kiến trúc hệ thống

```
Frontend (React + TypeScript)  ←→  Backend (Spring Boot REST API)  ←→  MySQL Database
         localhost:5173                    localhost:8080
```

### 3 Actor chính
- **Học viên (Student):** Tìm kiếm, đăng ký khóa học, học tập, đánh giá
- **Gia sư (Tutor):** Tạo khóa học, quản lý lớp, dạy học, nhận thanh toán
- **Admin:** Duyệt nội dung, xác nhận thanh toán, xử lý vi phạm

---

## II. CÁC CHỨC NĂNG ĐÃ HOÀN THÀNH

### 1. ĐĂNG KÝ & XÁC THỰC TÀI KHOẢN ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Đăng ký học viên (OTP) | ✅ Hoàn thành | Nhập email → nhận OTP → điền thông tin + mật khẩu → tạo tài khoản |
| Đăng ký gia sư (OTP) | ✅ Hoàn thành | Nhập email → nhận OTP → điền thông tin đầy đủ (CCCD, trường, môn dạy...) |
| Đăng nhập | ✅ Hoàn thành | JWT token, decode role, redirect đúng dashboard |
| Đăng xuất | ✅ Hoàn thành | Xóa token localStorage |
| Quên mật khẩu | ✅ Hoàn thành | OTP qua email → đặt lại mật khẩu mới |
| Đổi mật khẩu | ✅ Hoàn thành | Xác nhận mật khẩu cũ → đặt mật khẩu mới |

**Activity Flow — Đăng ký học viên:**
```
1. Nhập email → POST /api/otp/send { email, role: "STUDENT" }
2. Nhận OTP qua email (hiệu lực 5 phút)
3. Nhập OTP + thông tin + mật khẩu → POST /api/otp/verify/student
4. BE tạo User + StudentProfile, trả JWT token
5. FE lưu token → redirect /student dashboard
```

---

### 2. QUẢN LÝ HỒ SƠ ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Xem hồ sơ cá nhân | ✅ Hoàn thành | GET /api/profile/me |
| Cập nhật hồ sơ học viên | ✅ Hoàn thành | Tên, SĐT, địa chỉ, cấp lớp, mục tiêu học |
| Cập nhật hồ sơ gia sư | ✅ Hoàn thành | Tên, SĐT, CCCD, trường, chuyên ngành, kinh nghiệm |
| Xem hồ sơ gia sư (public) | ✅ Hoàn thành | Trang /tutor-profile/:id — hiển thị thông tin + khóa học |

---

### 3. HỢP ĐỒNG GIA SƯ ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Admin phát hành hợp đồng | ✅ Hoàn thành | Tạo template HTML, điền thông tin gia sư tự động |
| Gia sư xem hợp đồng | ✅ Hoàn thành | Xem nội dung hợp đồng đầy đủ |
| Gia sư ký hợp đồng | ✅ Hoàn thành | Vẽ chữ ký trên canvas → lưu Base64 vào DB |
| Tải hợp đồng | ✅ Hoàn thành | Xuất file HTML |

**Activity Flow — Ký hợp đồng:**
```
1. Admin phát hành → POST /api/admin/contracts/issue?tutorId=
2. Gia sư nhận thông báo → vào /tutor/contracts
3. Xem nội dung hợp đồng → vẽ chữ ký trên canvas
4. POST /api/tutor/contracts/{id}/sign { signatureBase64 }
5. Hợp đồng chuyển sang SIGNED
```

---

### 4. PHÍ SÀN & TẠO KHÓA HỌC ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Gia sư nộp phí sàn | ✅ Hoàn thành | Chuyển khoản 200.000đ → nộp minh chứng URL |
| Admin duyệt phí sàn | ✅ Hoàn thành | Xem minh chứng → duyệt → gia sư được tạo khóa học |
| Tạo khóa học | ✅ Hoàn thành | Tiêu đề, mô tả, giá/buổi, số buổi, môn học |
| Cập nhật khóa học | ✅ Hoàn thành | Sửa thông tin → tự chuyển về PENDING_APPROVE |
| Admin duyệt/từ chối khóa học | ✅ Hoàn thành | Duyệt → tạo tự động các buổi học |
| Admin ẩn khóa học vi phạm | ✅ Hoàn thành | Gửi cảnh báo cho gia sư |

**Activity Flow — Tạo và duyệt khóa học:**
```
1. Gia sư đã ký hợp đồng + nộp phí sàn được duyệt
2. Tạo khóa học → POST /api/courses
3. Khóa học ở trạng thái PENDING_APPROVE
4. Admin vào dashboard → duyệt → PUT /api/admin/courses/{id}/approve
5. Hệ thống tự tạo N buổi học (N = totalSessions)
6. Khóa học hiển thị trên trang tìm kiếm
```

---

### 5. TÌM KIẾM & ĐĂNG KÝ KHÓA HỌC ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Tìm kiếm khóa học (public) | ✅ Hoàn thành | Filter: từ khóa, môn học, giá. Không cần đăng nhập |
| Thuật toán ranking | ✅ Hoàn thành | Score = Promoted×1000 + Rating×150 + Học viên×8 - Tuổi×0.3 |
| Xem chi tiết khóa học | ✅ Hoàn thành | Thông tin, đánh giá, gia sư, nút đăng ký |
| Đăng ký khóa học | ✅ Hoàn thành | Học viên gửi đơn → gia sư duyệt |
| Đẩy tin khóa học | ✅ Hoàn thành | Gia sư trả 50.000đ → khóa học lên đầu 7 ngày |

**Activity Flow — Đăng ký khóa học:**
```
1. Học viên tìm kiếm → xem chi tiết → bấm Đăng ký
2. POST /api/student/registrations?courseId=
3. Gia sư nhận thông báo → vào tab Đơn đăng ký
4. Duyệt → hệ thống tự tạo hóa đơn học phí (deadline 24h)
5. Học viên nhận thông báo → nộp minh chứng chuyển khoản
6. Admin duyệt → lớp học chuyển sang ACTIVE
```

---

### 6. QUẢN LÝ LỚP HỌC ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Xem danh sách buổi học | ✅ Hoàn thành | Cả gia sư lẫn học viên đều xem được |
| Lên lịch buổi học | ✅ Hoàn thành | Gia sư đặt giờ + link Google Meet/Zoom |
| Xác nhận hoàn thành buổi | ✅ Hoàn thành | Chỉ sau giờ học đã qua + phải theo thứ tự |
| Ghi nhật ký buổi học | ✅ Hoàn thành | Gia sư ghi nội dung đã dạy, học viên xem được |
| Tiến độ học tập | ✅ Hoàn thành | Progress bar: X/N buổi hoàn thành |
| Tài liệu học tập | ✅ Hoàn thành | Gia sư upload, học viên tải xuống |
| Thông báo khẩn | ✅ Hoàn thành | Gia sư gửi thông báo cho cả lớp |
| Hoàn thành khóa học | ✅ Hoàn thành | Sau khi all buổi xong → mở khóa đánh giá |

**Activity Flow — Quản lý buổi học:**
```
Điều kiện xác nhận buổi học:
  ✓ Buổi đã được lên lịch (có startTime)
  ✓ Thời gian hiện tại > startTime
  ✓ Buổi trước đã được xác nhận hoàn thành

1. Gia sư lên lịch → PUT /api/tutor/activities/session/{id}/schedule
2. Học viên nhận thông báo có lịch học
3. Sau giờ học → gia sư bấm "Xác nhận đã dạy" → ghi nhật ký
4. PUT /api/tutor/activities/session/{id}/log (body: nội dung)
5. Học viên xem nhật ký trong tab Buổi học
6. Khi tất cả buổi hoàn thành → học viên bấm "Hoàn thành khóa học"
```

---

### 7. ĐÁNH GIÁ & PHẢN HỒI ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Học viên đánh giá gia sư | ✅ Hoàn thành | Chỉ sau khi khóa học COMPLETED, rating 1-5 sao + nhận xét |
| Gia sư phản hồi đánh giá | ✅ Hoàn thành | Trả lời công khai bên dưới đánh giá |
| Gia sư khiếu nại đánh giá | ✅ Hoàn thành | Gửi lý do → Admin xem xét |
| Admin xử lý khiếu nại | ✅ Hoàn thành | Chấp nhận (gỡ review) hoặc từ chối |

---

### 8. THANH TOÁN ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Học viên nộp học phí | ✅ Hoàn thành | Chuyển khoản → nộp URL minh chứng trong 24h |
| Admin duyệt học phí | ✅ Hoàn thành | Xem minh chứng → duyệt → lớp học ACTIVE |
| Gia sư nộp phí sàn | ✅ Hoàn thành | 200.000đ/lần, chỉ nộp 1 lần |
| Gia sư đẩy tin | ✅ Hoàn thành | 50.000đ → 7 ngày promoted |
| Xem lịch sử hóa đơn | ✅ Hoàn thành | Cả học viên lẫn gia sư xem được |

---

### 9. BÁO CÁO VI PHẠM ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Học viên báo cáo gia sư | ✅ Hoàn thành | Tiêu đề + nội dung chi tiết |
| Admin xem báo cáo | ✅ Hoàn thành | Xem nhật ký lớp học liên quan |
| Admin xử lý (WARN/BAN) | ✅ Hoàn thành | WARN: cảnh báo · BAN: khóa tài khoản + ẩn tất cả khóa học |
| Admin hủy lớp học | ✅ Hoàn thành | Thông báo cả 2 bên |

---

### 10. THÔNG BÁO ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Nhận thông báo real-time | ✅ Hoàn thành | Tất cả sự kiện quan trọng đều có thông báo |
| Đánh dấu đã đọc | ✅ Hoàn thành | Từng thông báo hoặc tất cả |
| Link điều hướng | ✅ Hoàn thành | Click thông báo → nhảy đến đúng trang liên quan |

**Các loại thông báo có actionUrl:**
- Khóa học được duyệt → `/tutor`
- Đơn đăng ký mới → `/tutor`
- Học phí được duyệt → `/student/course/{id}`
- Hợp đồng mới → `/tutor/contracts`
- Buổi học hoàn thành → `/student/course/{id}`
- Đánh giá mới → `/tutor`

---

### 11. ADMIN DASHBOARD ✅

| Chức năng | Trạng thái | Mô tả |
|---|---|---|
| Tổng quan thống kê | ✅ Hoàn thành | 6 stat cards, top môn học, top gia sư, phân bổ trạng thái |
| Duyệt khóa học | ✅ Hoàn thành | Duyệt / Từ chối / Ẩn |
| Duyệt thanh toán | ✅ Hoàn thành | Xem minh chứng → duyệt |
| Quản lý hợp đồng | ✅ Hoàn thành | Phát hành / Xem / Xóa |
| Báo cáo vi phạm | ✅ Hoàn thành | Xem nhật ký + xử lý |
| Khiếu nại review | ✅ Hoàn thành | Chấp nhận / Từ chối |

---

## III. GIAO DIỆN NGƯỜI DÙNG

### Trang công khai (không cần đăng nhập)
| Trang | URL | Mô tả |
|---|---|---|
| Trang chủ | `/` | Hero, môn học, gia sư nổi bật, đánh giá, features |
| Tìm khóa học | `/courses` | Tìm kiếm, filter, ranking |
| Chi tiết khóa học | `/courses/:id` | Thông tin, đánh giá, đăng ký |
| Hồ sơ gia sư | `/tutor-profile/:id` | Thông tin, môn dạy, khóa học |
| Đăng nhập | `/login` | |
| Đăng ký học viên | `/register/student` | 2 bước: email OTP → thông tin |
| Đăng ký gia sư | `/register/tutor` | 2 bước: email OTP → thông tin đầy đủ |
| Quên mật khẩu | `/forgot-password` | OTP → đặt lại |

### Học viên (cần đăng nhập)
| Trang | URL | Mô tả |
|---|---|---|
| Dashboard | `/student` | Khóa học, hóa đơn, thông báo |
| Lớp học | `/student/course/:id` | Buổi học, tài liệu, báo cáo |
| Đánh giá | `/student/review/:id` | Rating + nhận xét |
| Hồ sơ | `/profile` | Cập nhật thông tin, đổi mật khẩu |

### Gia sư (cần đăng nhập)
| Trang | URL | Mô tả |
|---|---|---|
| Dashboard | `/tutor` | Khóa học, đơn đăng ký, thanh toán, đánh giá |
| Quản lý lớp | `/tutor/course/:id` | Lịch học, tài liệu, thông báo |
| Hợp đồng | `/tutor/contracts` | Xem và ký hợp đồng |
| Hồ sơ | `/profile` | Cập nhật thông tin |

### Admin (cần đăng nhập)
| Trang | URL | Mô tả |
|---|---|---|
| Dashboard | `/admin` | Tổng quan, duyệt, quản lý |

---

## IV. KIẾN TRÚC BACKEND

### Công nghệ
- **Framework:** Spring Boot 4.0.5 (Java 17)
- **Database:** MySQL 9.6 + Hibernate ORM 7.2
- **Security:** Spring Security + JWT (jjwt 0.12.6)
- **Email:** Spring Mail (Gmail SMTP)
- **Build:** Gradle

### Cấu trúc API (60+ endpoints)
```
/api/auth/**          — Đăng nhập, đổi mật khẩu (public)
/api/otp/**           — Gửi/xác thực OTP (public)
/api/public/**        — Khóa học, review, môn học (public)
/api/profile/**       — Hồ sơ cá nhân (authenticated)
/api/courses/**       — Quản lý khóa học (TUTOR)
/api/student/**       — Hoạt động học viên (STUDENT)
/api/tutor/**         — Hoạt động gia sư (TUTOR)
/api/admin/**         — Quản trị (ADMIN)
/api/payments/**      — Thanh toán (authenticated)
/api/notifications/** — Thông báo (authenticated)
/api/materials/**     — Tài liệu (authenticated)
/api/reviews/**       — Đánh giá (STUDENT)
/api/complaints/**    — Khiếu nại (TUTOR)
```

### Database — 15 bảng chính
```
users               — Tài khoản (ADMIN/TUTOR/STUDENT)
student_profiles    — Hồ sơ học viên
tutor_profiles      — Hồ sơ gia sư
subjects            — Môn học
courses             — Khóa học
course_registrations — Đăng ký khóa học
course_sessions     — Buổi học
learning_materials  — Tài liệu
reviews             — Đánh giá
payments            — Thanh toán
contracts           — Hợp đồng
notifications       — Thông báo
reports             — Báo cáo vi phạm
complaints          — Khiếu nại
system_logs         — Log hệ thống
```

---

## V. THUẬT TOÁN ĐẶC BIỆT

### Ranking khóa học
```
Score = (isPromoted ? 1000 : 0)     // Đẩy tin luôn lên đầu
      + (avgRating × 150)           // Rating 5★ = +750 điểm
      + (registrationCount × 8)     // Mỗi học viên = +8 điểm
      - (daysSinceCreated × 0.3)    // Khóa cũ bị trừ nhẹ
```

### Quy tắc xác nhận buổi học
```
Điều kiện để gia sư xác nhận buổi học N:
  1. Buổi N đã được lên lịch (startTime != null)
  2. Thời gian hiện tại > startTime của buổi N
  3. Buổi N-1 đã được xác nhận hoàn thành (nếu N > 1)
```

### Tự động hết hạn đẩy tin
```
@Scheduled(fixedRate = 3600000) // Chạy mỗi 1 giờ
→ Tìm khóa học có promotionExpiration < now
→ Tắt isPromoted, gửi thông báo cho gia sư
```

---

## VI. BẢO MẬT

- **JWT Authentication:** Token 24h, stateless session
- **Role-based Access Control:** ADMIN / TUTOR / STUDENT
- **CORS:** Chỉ cho phép localhost:5173
- **Password:** BCrypt encoding
- **OTP:** Hiệu lực 5 phút, xác thực email trước khi tạo tài khoản
- **File upload:** Giới hạn 15MB, lưu local storage

---

## VII. NHỮNG GÌ CHƯA HOÀN THÀNH / DỰ KIẾN TUẦN SAU

| Chức năng | Ưu tiên | Ghi chú |
|---|---|---|
| Thông tin học viên trong đơn đăng ký | Cao | Gia sư cần xem SĐT, cấp lớp, mục tiêu học |
| WebSocket real-time notification | Trung bình | Hiện tại dùng polling |
| Tích hợp thanh toán online (VNPay/Momo) | Trung bình | Hiện tại chuyển khoản thủ công |
| Pagination cho danh sách | Thấp | Hiện tại load all |
| Quản lý môn học trong Admin UI | Thấp | Hiện tại thêm qua API |
| Refund khi hủy lớp | Thấp | Chưa có quy trình hoàn tiền |

---

## VIII. HƯỚNG DẪN CHẠY DỰ ÁN

### Backend
```bash
cd backend/backend
./gradlew bootRun
# Chạy tại: http://localhost:8080
# Database: MySQL localhost:3306/ketnoigiasu_db
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Chạy tại: http://localhost:5173
```

### Tài khoản test
```
Admin:   admin@ketnoigiasu.com / (tạo trực tiếp trong DB)
Tutor:   tranngocthanh280204@gmail.com / (đã tạo, enabled=1)
Student: (đăng ký qua form)
```

---

*Tài liệu được tạo ngày 10/05/2026*
