# Activity Diagrams — Hệ thống Kết Nối Gia Sư

---

# ACTOR 1: USER (Tất cả người dùng)

## 1. Quản lý tài khoản

### 1.1 Đăng ký tài khoản
```
[Bắt đầu]
    → Chọn loại tài khoản (Học viên / Gia sư)
    → Nhập thông tin đăng ký (họ tên, email, mật khẩu, SĐT)
    → Hệ thống gửi OTP về email
    → Nhập mã OTP
    → [OTP hợp lệ?]
        → Không: Nhập lại / Gửi lại OTP
        → Có: Tạo tài khoản thành công
    → Chuyển đến trang Đăng nhập
[Kết thúc]
```

### 1.2 Đăng nhập hệ thống
```
[Bắt đầu]
    → Nhập email + mật khẩu
    → [Thông tin đúng?]
        → Không: Hiển thị lỗi → Nhập lại
        → Có: Tạo JWT Token
    → [Role?]
        → STUDENT → Student Dashboard
        → TUTOR   → Tutor Dashboard
        → ADMIN   → Admin Dashboard
[Kết thúc]
```

### 1.3 Đăng xuất
```
[Bắt đầu]
    → Ấn nút Đăng xuất
    → Xóa JWT Token khỏi localStorage
    → Xóa thông tin user khỏi localStorage
    → Chuyển về trang Đăng nhập
[Kết thúc]
```

### 1.4 Quên mật khẩu / Khôi phục mật khẩu
```
[Bắt đầu]
    → Nhập email đã đăng ký
    → Hệ thống gửi OTP về email
    → Nhập OTP xác thực
    → [OTP hợp lệ?]
        → Không: Nhập lại / Gửi lại
        → Có: Tiếp tục
    → Nhập mật khẩu mới + xác nhận
    → Cập nhật mật khẩu
    → Chuyển đến trang Đăng nhập
[Kết thúc]
```

## 2. Quản lý hồ sơ cá nhân

### 2.1 Cập nhật thông tin cơ bản
```
[Bắt đầu]
    → Vào trang Hồ sơ cá nhân
    → Chỉnh sửa: họ tên, SĐT, avatar
    → Lưu → Cập nhật User entity
[Kết thúc]
```

### 2.2 Quản lý hồ sơ Gia sư
```
[Bắt đầu]
    → Vào trang Hồ sơ gia sư
    → [Chọn mục cập nhật]
        → Cập nhật video giới thiệu: Nhập URL video
        → Cập nhật bằng cấp: Nhập thông tin trường, chuyên ngành, năm tốt nghiệp
        → Cập nhật điểm mạnh: Nhập mô tả điểm mạnh
        → Cập nhật thời khóa biểu: Nhập lịch rảnh
        → Cập nhật khu vực sống: Nhập địa chỉ
    → Lưu → Cập nhật TutorProfile entity
[Kết thúc]
```

### 2.3 Quản lý hồ sơ Học viên
```
[Bắt đầu]
    → Vào trang Hồ sơ học viên
    → [Chọn mục cập nhật]
        → Cập nhật điểm yếu: Nhập môn học cần cải thiện
        → Cập nhật thời khóa biểu: Nhập lịch học mong muốn
        → Cập nhật khu vực sống: Nhập địa chỉ
        → Cập nhật mục tiêu học tập: Nhập mục tiêu
    → Lưu → Cập nhật StudentProfile entity
[Kết thúc]
```

---

# ACTOR 2: HỌC VIÊN

## 3. Quản lý đăng ký

### 3.1 Tìm kiếm khóa học
```
[Bắt đầu]
    → Vào trang Tìm khóa học
    → Nhập từ khóa / chọn môn học / lọc giá
    → Hệ thống hiển thị danh sách khóa học APPROVED
    → [Khóa học được đẩy tin?] → Hiển thị ưu tiên đầu
    → Xem chi tiết khóa học
[Kết thúc]
```

### 3.2 Xem hồ sơ gia sư
```
[Bắt đầu]
    → Ấn vào tên gia sư trong trang khóa học
    → Xem: thông tin cá nhân, bằng cấp, điểm mạnh, môn dạy
    → Xem đánh giá từ học viên khác
    → [Muốn đăng ký?] → Chuyển đến đăng ký khóa học
[Kết thúc]
```

### 3.3 Đăng ký khóa học
```
[Bắt đầu]
    → Chọn khóa học muốn đăng ký
    → Nhập ghi chú (tùy chọn)
    → Gửi đơn → CourseRegistration (PENDING)
    → Thông báo gia sư có đơn mới
    → Chờ gia sư duyệt
[Kết thúc]
```

## 4. Quản lý thanh toán (Học viên)

### 4.1 Thanh toán tiền học
```
[Bắt đầu]
    → Gia sư duyệt đơn → Payment TUITION_FEE tạo tự động
    → Học viên vào tab Hóa đơn
    → Xem thông tin chuyển khoản (ngân hàng gia sư)
    → Chuyển khoản thực tế
[Kết thúc]
```

### 4.2 Gửi minh chứng thanh toán
```
[Bắt đầu]
    → Học viên nhập URL ảnh minh chứng chuyển khoản
    → Gửi → Payment → PENDING_VERIFY
    → Admin xác nhận
    → [Duyệt?]
        → Có: Payment → SUCCESS, Registration → ACTIVE
        → Không: Thông báo học viên
    → [Hết hạn 24h?] → Payment → FAILED
[Kết thúc]
```

### 4.3 Yêu cầu hoàn tiền
```
[Bắt đầu]
    → [Payment đã SUCCESS?]
        → Không: Không thể yêu cầu
        → Có: Tiếp tục
    → Nhập lý do hoàn tiền (cung cấp lý do hoàn trả)
    → Tải lên minh chứng sự cố (URL ảnh/link Drive)
    → Gửi → RefundRequest (PENDING)
    → Admin xem xét và phê duyệt
[Kết thúc]
```

### 4.4 Theo dõi trạng thái đóng tiền
```
[Bắt đầu]
    → Vào tab Hóa đơn
    → Xem danh sách hóa đơn + trạng thái
        → PENDING: Chờ nộp minh chứng (có hạn 24h)
        → PENDING_VERIFY: Chờ Admin duyệt
        → SUCCESS: Đã thanh toán
        → FAILED: Hết hạn
    → Xem lịch sử yêu cầu hoàn tiền
[Kết thúc]
```

## 5. Quản lý học tập (Học viên)

### 5.1 Nhắn tin với gia sư
```
[Bắt đầu]
    → Vào lớp học → Tab Nhắn tin
    → Kết nối WebSocket real-time
    → [Loại tin nhắn?]
        → Trao đổi thông tin: Nhập text → Gửi → Broadcast real-time
        → Nhận tài liệu học tập: Xem file gia sư gửi → Tải xuống
[Kết thúc]
```

### 5.2 Xem tiến độ học tập
```
[Bắt đầu]
    → Vào lớp học → Tab Buổi học
    → Xem thanh tiến độ (số buổi hoàn thành / tổng)
    → Xem từng buổi: trạng thái, thời gian, nhật ký gia sư
    → [Buổi có link online?] → Ấn vào phòng học
[Kết thúc]
```

### 5.3 Xem thông báo lớp học
```
[Bắt đầu]
    → Nhận thông báo từ gia sư (nghỉ học, thay đổi lịch...)
    → Vào tab Thông báo → Xem nội dung
    → Đánh dấu đã đọc
[Kết thúc]
```

## 6. Quản lý đánh giá (Học viên)

### 6.1 Chấm điểm gia sư / Viết nhận xét
```
[Bắt đầu]
    → [Khóa học đã COMPLETED?]
        → Không: Không thể đánh giá
        → Có: Tiếp tục
    → Chọn số sao (1-5)
    → Viết nhận xét chi tiết
    → Gửi đánh giá → Hiển thị trên hồ sơ gia sư
    → Gia sư nhận thông báo
[Kết thúc]
```

## 7. Quản lý cá nhân (Học viên)

### 7.1 Báo cáo vi phạm
```
[Bắt đầu]
    → Vào lớp học → Tab Báo cáo
    → Nhập tiêu đề + mô tả vi phạm chi tiết
    → Gửi → Admin nhận thông báo xử lý
[Kết thúc]
```

### 7.2 Xem lịch học
```
[Bắt đầu]
    → Vào Dashboard → Tab Khóa học
    → Xem danh sách khóa học đang học (ACTIVE)
    → Vào từng lớp → Xem lịch từng buổi học
[Kết thúc]
```

### 7.3 Theo dõi tiến độ
```
[Bắt đầu]
    → Vào lớp học
    → Xem thanh tiến độ tổng (%)
    → Xem chi tiết từng buổi: hoàn thành / chưa học / sắp diễn ra
    → Xem nhật ký gia sư ghi sau mỗi buổi
[Kết thúc]
```

---

# ACTOR 3: GIA SƯ

## 8. Quản lý khóa học (Gia sư)

### 8.1 Tạo khóa học
```
[Bắt đầu]
    → [Đã ký hợp đồng & nộp phí sàn?]
        → Không: Thông báo hoàn thành điều kiện trước
        → Có: Tiếp tục
    → Nhập: tiêu đề, mô tả, giá/buổi, tổng số buổi, môn học
    → Gửi → Course (PENDING_APPROVE)
    → Admin nhận thông báo duyệt
[Kết thúc]
```

### 8.2 Đăng ký đẩy tin
```
[Bắt đầu]
    → Chọn khóa học APPROVED
    → Ấn "Đẩy tin" → Tạo Payment PROMOTE (50.000đ)
    → Nộp minh chứng chuyển khoản
    → Admin duyệt → Course.isPromoted = true (+7 ngày)
    → Khóa học hiển thị ưu tiên trên trang tìm kiếm
[Kết thúc]
```

### 8.3 Duyệt hồ sơ học viên
```
[Bắt đầu]
    → Vào tab Đơn đăng ký
    → Xem thông tin học viên + ghi chú
    → [Quyết định?]
        → Duyệt: Registration → APPROVED
                  Tạo Payment TUITION_FEE cho học viên
                  Thông báo học viên nộp tiền trong 24h
        → Từ chối: Registration → REJECTED
                    Thông báo học viên
[Kết thúc]
```

## 9. Quản lý hợp đồng (Gia sư)

### 9.1 Tiếp nhận hợp đồng
```
[Bắt đầu]
    → Admin phát hành hợp đồng
    → Gia sư nhận thông báo
    → Vào trang Hợp đồng → Xem danh sách
    → Đọc nội dung hợp đồng
[Kết thúc]
```

### 9.2 Ký kết hợp đồng
```
[Bắt đầu]
    → Mở hợp đồng PENDING
    → Đọc toàn bộ nội dung
    → Vẽ chữ ký tay trên canvas
    → Xác nhận ký → Contract (SIGNED)
    → Hệ thống nhúng chữ ký vào văn bản
[Kết thúc]
```

### 9.3 Tra cứu lịch sử hợp đồng
```
[Bắt đầu]
    → Vào trang Hợp đồng
    → Xem danh sách: ID, ngày cấp, ngày ký, trạng thái
    → Xem chi tiết nội dung hợp đồng
[Kết thúc]
```

### 9.4 Tải file PDF hợp đồng
```
[Bắt đầu]
    → Chọn hợp đồng đã SIGNED
    → Ấn "Tải PDF"
    → Hệ thống render HTML → PDF (Flying Saucer)
    → Xác thực token qua query param
    → Trả về file PDF → Browser tải về
[Kết thúc]
```

## 10. Quản lý hoạt động giảng dạy (Gia sư)

### 10.1 Gửi tài liệu học tập
```
[Bắt đầu]
    → Vào lớp học → Tab Nhắn tin
    → Ấn nút 📎 Tài liệu
    → Nhập tên tài liệu + chọn file từ thiết bị
    → Upload → Lưu file vào server
    → Broadcast link tải qua WebSocket cho học viên
[Kết thúc]
```

### 10.2 Trao đổi thông tin / Gửi bài tập
```
[Bắt đầu]
    → Vào lớp học → Tab Nhắn tin
    → [Loại tin nhắn?]
        → Tin nhắn thường: Chọn mode "Tin nhắn" → Nhập text → Gửi
        → Gửi bài tập: Chọn mode "Bài tập" → Nhập đề bài → Gửi
    → Tin nhắn broadcast real-time qua WebSocket
    → Lưu vào DB (Message entity)
[Kết thúc]
```

### 10.3 Xác nhận hoàn thành buổi dạy
```
[Bắt đầu]
    → Vào lớp học → Tab Buổi học
    → [Đã đến giờ học?]
        → Không: Nút xác nhận bị khóa
        → Có: Tiếp tục
    → [Buổi trước đã hoàn thành?]
        → Không: Thông báo hoàn thành theo thứ tự
        → Có: Tiếp tục
    → Ấn "Xác nhận đã dạy"
    → Nhập nhật ký nội dung buổi học
    → Lưu → CourseSession.isCompleted = true
    → Thông báo học viên
[Kết thúc]
```

### 10.4 Ghi nhận xét buổi học
```
[Bắt đầu]
    → Buổi học đã hoàn thành
    → Nhập nhật ký: nội dung đã dạy, nhận xét học viên
    → Lưu → CourseSession.notes cập nhật
    → [Trong vòng 24h?] → Có thể sửa lại nhật ký
    → Học viên xem được nhật ký trong lớp học
[Kết thúc]
```

### 10.5 Gửi thông báo lớp học
```
[Bắt đầu]
    → Nhập nội dung thông báo khẩn (nghỉ học, đổi lịch...)
    → Ấn Gửi
    → Hệ thống tạo Notification cho tất cả học viên ACTIVE
    → Học viên nhận thông báo real-time
[Kết thúc]
```

### 10.6 Gửi báo cáo học tập cho phụ huynh
```
[Bắt đầu]
    → Vào lớp học → Tab Báo cáo PH
    → Chọn học viên cần gửi báo cáo
    → Nhập nhận xét thêm (tùy chọn)
    → Hệ thống tổng hợp: tiến độ, nhật ký từng buổi
    → Gửi email HTML đến email học viên (email phụ huynh)
[Kết thúc]
```

## 11. Quản lý thanh toán (Gia sư)

### 11.1 Xem doanh thu dự kiến
```
[Bắt đầu]
    → Vào trang Quản lý thanh toán → Tab Doanh thu
    → Hệ thống tính: Tổng học phí thu, Phí sàn 10%, Thực nhận
    → Hiển thị 3 thẻ tóm tắt
[Kết thúc]
```

### 11.2 Đối soát phí %
```
[Bắt đầu]
    → Xem bảng đối soát:
        → Phí đăng ký sàn 200.000đ (1 lần): đã nộp / chưa
        → Phí % sàn (10% học phí): tự động khấu trừ
    → Xem số tiền thực nhận sau khấu trừ
[Kết thúc]
```

### 11.3 Cập nhật thông tin thụ hưởng
```
[Bắt đầu]
    → Vào tab Tài khoản thụ hưởng
    → Nhập: tên ngân hàng, số tài khoản, tên chủ tài khoản
    → Lưu → Cập nhật TutorProfile
    → Admin dùng thông tin này khi chuyển tiền
[Kết thúc]
```

### 11.4 Theo dõi lịch sử nhận tiền
```
[Bắt đầu]
    → Vào tab Lịch sử nhận tiền
    → Xem từng khoản: khóa học, học phí, phí 10%, thực nhận
    → Xem thời gian Admin xác nhận chuyển tiền
[Kết thúc]
```

## 12. Quản lý tương tác (Gia sư)

### 12.1 Xem bảng điểm uy tín
```
[Bắt đầu]
    → Vào hồ sơ gia sư (public)
    → Xem: điểm trung bình, số lượng đánh giá, phân bố sao
    → Xem từng đánh giá của học viên
[Kết thúc]
```

### 12.2 Phản hồi đánh giá
```
[Bắt đầu]
    → Vào tab Đánh giá trong Dashboard
    → Chọn đánh giá chưa có phản hồi
    → Nhập nội dung phản hồi
    → Gửi → Hiển thị dưới đánh giá trên hồ sơ công khai
[Kết thúc]
```

### 12.3 Gửi khiếu nại
```
[Bắt đầu]
    → Xem đánh giá không đúng sự thật
    → Ấn "Khiếu nại đánh giá này"
    → Nhập lý do khiếu nại
    → Gửi → Admin nhận và xem xét
    → [Admin quyết định?]
        → Chấp nhận: Xóa đánh giá
        → Từ chối: Giữ nguyên đánh giá
[Kết thúc]
```

---

# ACTOR 4: ADMIN

## 13. Quản lý người dùng

### 13.1 Duyệt hồ sơ gia sư / Phân quyền người dùng
```
[Bắt đầu]
    → Xem danh sách tài khoản gia sư mới đăng ký
    → Kiểm tra thông tin: CCCD, bằng cấp, trường học
    → [Hợp lệ?]
        → Có: Phát hành hợp đồng cho gia sư
        → Không: Từ chối / Yêu cầu bổ sung thông tin
[Kết thúc]
```

### 13.2 Khóa tài khoản vi phạm
```
[Bắt đầu]
    → Nhận báo cáo vi phạm từ học viên
    → Xem xét nội dung vi phạm
    → [Mức độ vi phạm?]
        → Nhẹ: Gửi cảnh báo (WARN)
        → Nặng: Khóa tài khoản (BAN) → User.enabled = false
    → Thông báo người dùng bị khóa
[Kết thúc]
```

### 13.3 Xóa tài khoản người dùng
```
[Bắt đầu]
    → Xác định tài khoản cần xóa
    → Xác nhận xóa
    → Xóa User + các dữ liệu liên quan
    → Ghi log hệ thống
[Kết thúc]
```

## 14. Quản lý nội dung

### 14.1 Kiểm duyệt khóa học
```
[Bắt đầu]
    → Xem danh sách khóa học PENDING_APPROVE
    → Kiểm tra: tiêu đề, mô tả, giá, môn học
    → [Hợp lệ?]
        → Duyệt: Course → APPROVED
                  Tạo tự động N CourseSession
                  Thông báo gia sư
        → Từ chối: Course → REJECTED
                    Thông báo gia sư + lý do
[Kết thúc]
```

### 14.2 Duyệt yêu cầu đẩy tin
```
[Bắt đầu]
    → Xem Payment PROMOTE đang PENDING_VERIFY
    → Kiểm tra minh chứng chuyển khoản 50.000đ
    → [Hợp lệ?]
        → Có: Payment → SUCCESS
               Course.isPromoted = true (+7 ngày)
               Thông báo gia sư
        → Không: Thông báo từ chối
[Kết thúc]
```

### 14.3 Thiết lập danh mục môn học
```
[Bắt đầu]
    → Vào quản lý môn học
    → Thêm / Sửa / Xóa môn học
    → Cập nhật Subject entity
    → Gia sư dùng khi tạo khóa học
[Kết thúc]
```

### 14.4 Xóa khóa học vi phạm
```
[Bắt đầu]
    → Phát hiện khóa học vi phạm chính sách
    → [Hành động?]
        → Ẩn tạm thời: Course → HIDDEN
        → Xóa vĩnh viễn: Xóa Course + CourseSession
    → Thông báo gia sư lý do
[Kết thúc]
```

## 15. Quản lý hợp đồng (Admin)

### 15.1 Khởi tạo hợp đồng cụ thể
```
[Bắt đầu]
    → Vào tab Hợp đồng
    → Nhập Tutor Profile ID
    → Soạn nội dung hợp đồng HTML (dùng placeholder)
    → Phát hành → Contract (PENDING)
    → Hệ thống điền thông tin gia sư vào placeholder
    → Thông báo gia sư ký hợp đồng
[Kết thúc]
```

### 15.2 Theo dõi trạng thái ký kết
```
[Bắt đầu]
    → Xem danh sách hợp đồng
    → Lọc theo trạng thái: PENDING / SIGNED / CANCELLED
    → Xem chi tiết: ngày phát hành, ngày ký, chữ ký
[Kết thúc]
```

### 15.3 Xóa hợp đồng lỗi
```
[Bắt đầu]
    → Chọn hợp đồng cần xóa (thường là PENDING lỗi)
    → Xác nhận xóa
    → Xóa Contract khỏi DB
    → Phát hành lại hợp đồng mới nếu cần
[Kết thúc]
```

## 16. Quản lý tài chính (Admin)

### 16.1 Xác nhận minh chứng thanh toán
```
[Bắt đầu]
    → Xem danh sách Payment PENDING_VERIFY
    → Kiểm tra minh chứng (link ảnh)
    → [Loại thanh toán?]
        → TUITION_FEE: Duyệt → Registration → ACTIVE
        → PLATFORM_FEE: Duyệt → Gia sư được tạo khóa học
        → PROMOTE: Duyệt → Course.isPromoted = true
    → Thông báo người dùng kết quả
[Kết thúc]
```

### 16.2 Chuyển tiền học phí → Khấu trừ phí nền tảng
```
[Bắt đầu]
    → Xem danh sách học phí chưa chuyển (transferredToTutor = false)
    → Xem: học phí gốc, khấu trừ 10%, số tiền thực chuyển
    → Xem tài khoản ngân hàng gia sư
    → Chuyển khoản thực tế cho gia sư
    → Ấn "Chuyển tiền & Upload minh chứng"
    → Upload ảnh minh chứng từ thiết bị
    → Xác nhận → Payment.transferredToTutor = true
    → Thông báo gia sư đã nhận tiền
[Kết thúc]
```

### 16.3 Phê duyệt hoàn tiền → Xác thực lý do hoàn trả
```
[Bắt đầu]
    → Xem danh sách RefundRequest PENDING
    → Đọc lý do hoàn tiền của học viên
    → Xem minh chứng sự cố (nếu có)
    → [Quyết định?]
        → Duyệt: RefundRequest → APPROVED
        → Từ chối: RefundRequest → REJECTED + ghi chú lý do
    → Thông báo học viên kết quả
[Kết thúc]
```

### 16.4 Thực hiện hoàn tiền → Thu hồi quyền truy cập lớp
```
[Bắt đầu]
    → Admin duyệt yêu cầu hoàn tiền
    → Hệ thống tự động: Registration → REFUNDED
    → Học viên mất quyền truy cập lớp học ngay lập tức
    → Admin chuyển tiền hoàn lại cho học viên (ngoài hệ thống)
    → Thông báo học viên: tiền sẽ về trong 3-5 ngày
[Kết thúc]
```

## 17. Quản lý vận hành

### 17.1 Kiểm tra nhật ký đào tạo
```
[Bắt đầu]
    → Nhận báo cáo vi phạm từ học viên
    → Xem nhật ký lớp học liên quan (CourseSession)
    → Kiểm tra: số buổi đã dạy, nội dung nhật ký, tiến độ
    → Đánh giá mức độ vi phạm của gia sư
[Kết thúc]
```

### 17.2 Giải quyết khiếu nại → Xác minh nội dung khiếu nại
```
[Bắt đầu]
    → Xem danh sách khiếu nại review PENDING
    → Đọc nội dung đánh giá bị khiếu nại
    → Đọc lý do khiếu nại của gia sư
    → Xác minh tính xác thực
    → [Quyết định?]
        → Chấp nhận: Xóa review khỏi hệ thống
        → Từ chối: Giữ nguyên review
    → Thông báo gia sư kết quả
[Kết thúc]
```

### 17.3 Hủy lớp học
```
[Bắt đầu]
    → Xem xét vi phạm nghiêm trọng
    → Nhập lý do hủy lớp
    → Registration → CANCELLED_BY_ADMIN
    → Thông báo cả học viên lẫn gia sư
    → [Cần hoàn tiền?] → Tạo RefundRequest tự động
[Kết thúc]
```

### 17.4 Xóa khiếu nại sai lệch
```
[Bắt đầu]
    → Xem xét khiếu nại không có cơ sở
    → Xác nhận xóa
    → Xóa Complaint khỏi DB
    → Thông báo gia sư khiếu nại bị từ chối
[Kết thúc]
```

### 17.5 Khóa tài khoản vi phạm (từ khiếu nại)
```
[Bắt đầu]
    → Sau khi xác minh vi phạm nghiêm trọng
    → Khóa tài khoản: User.enabled = false
    → Tất cả JWT Token của user bị vô hiệu hóa
    → Thông báo người dùng lý do khóa
[Kết thúc]
```

---

# TỔNG KẾT — Bộ Activity Diagrams

## Danh sách đầy đủ (theo Actor)

### USER (Dùng chung)
| # | Activity |
|---|---|
| 1.1 | Đăng ký tài khoản |
| 1.2 | Đăng nhập hệ thống |
| 1.3 | Đăng xuất |
| 1.4 | Quên mật khẩu / Khôi phục mật khẩu |
| 2.1 | Cập nhật thông tin cơ bản |
| 2.2 | Quản lý hồ sơ Gia sư |
| 2.3 | Quản lý hồ sơ Học viên |

### HỌC VIÊN
| # | Activity |
|---|---|
| 3.1 | Tìm kiếm khóa học |
| 3.2 | Xem hồ sơ gia sư |
| 3.3 | Đăng ký khóa học |
| 4.1 | Thanh toán tiền học |
| 4.2 | Gửi minh chứng thanh toán |
| 4.3 | Yêu cầu hoàn tiền |
| 4.4 | Theo dõi trạng thái đóng tiền |
| 5.1 | Nhắn tin với gia sư |
| 5.2 | Xem tiến độ học tập |
| 5.3 | Xem thông báo lớp học |
| 6.1 | Chấm điểm gia sư / Viết nhận xét |
| 7.1 | Báo cáo vi phạm |
| 7.2 | Xem lịch học |
| 7.3 | Theo dõi tiến độ |

### GIA SƯ
| # | Activity |
|---|---|
| 8.1 | Tạo khóa học |
| 8.2 | Đăng ký đẩy tin |
| 8.3 | Duyệt hồ sơ học viên |
| 9.1 | Tiếp nhận hợp đồng |
| 9.2 | Ký kết hợp đồng |
| 9.3 | Tra cứu lịch sử hợp đồng |
| 9.4 | Tải file PDF hợp đồng |
| 10.1 | Gửi tài liệu học tập |
| 10.2 | Trao đổi thông tin / Gửi bài tập |
| 10.3 | Xác nhận hoàn thành buổi dạy |
| 10.4 | Ghi nhận xét buổi học |
| 10.5 | Gửi thông báo lớp học |
| 10.6 | Gửi báo cáo học tập cho phụ huynh |
| 11.1 | Xem doanh thu dự kiến |
| 11.2 | Đối soát phí % |
| 11.3 | Cập nhật thông tin thụ hưởng |
| 11.4 | Theo dõi lịch sử nhận tiền |
| 12.1 | Xem bảng điểm uy tín |
| 12.2 | Phản hồi đánh giá |
| 12.3 | Gửi khiếu nại |

### ADMIN
| # | Activity |
|---|---|
| 13.1 | Duyệt hồ sơ gia sư / Phân quyền người dùng |
| 13.2 | Khóa tài khoản vi phạm |
| 13.3 | Xóa tài khoản người dùng |
| 14.1 | Kiểm duyệt khóa học |
| 14.2 | Duyệt yêu cầu đẩy tin |
| 14.3 | Thiết lập danh mục môn học |
| 14.4 | Xóa khóa học vi phạm |
| 15.1 | Khởi tạo hợp đồng cụ thể |
| 15.2 | Theo dõi trạng thái ký kết |
| 15.3 | Xóa hợp đồng lỗi |
| 16.1 | Xác nhận minh chứng thanh toán |
| 16.2 | Chuyển tiền học phí → Khấu trừ phí nền tảng |
| 16.3 | Phê duyệt hoàn tiền → Xác thực lý do hoàn trả |
| 16.4 | Thực hiện hoàn tiền → Thu hồi quyền truy cập lớp |
| 17.1 | Kiểm tra nhật ký đào tạo |
| 17.2 | Giải quyết khiếu nại → Xác minh nội dung |
| 17.3 | Hủy lớp học |
| 17.4 | Xóa khiếu nại sai lệch |
| 17.5 | Khóa tài khoản vi phạm (từ khiếu nại) |

---
**Tổng cộng: 44 Activity Diagrams**
- User: 7
- Học viên: 14
- Gia sư: 19 (bao gồm cả User)
- Admin: 17
