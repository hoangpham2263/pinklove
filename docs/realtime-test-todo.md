# Realtime QA TODO: Admin <-> Provider

Mục tiêu: xác nhận luồng realtime giữa `admin` và `supplier` đã hoạt động đúng cho:

- `provider_order_assignments`
- `provider_order_events`
- màn admin order detail
- màn provider portal
- màn provider order detail
- core `SSE + Postgres LISTEN/NOTIFY`

## 1. Scope cần test

- Admin cập nhật assignment thì provider nhìn thấy thay đổi.
- Provider cập nhật trạng thái/note/reference thì admin nhìn thấy thay đổi.
- SSE stream hoạt động đúng với event `ready`, `provider-assignment.changed`, `provider-assignment.deleted`.
- Panel nhận event rồi chỉ fetch lại JSON resource liên quan, không reload cả page.
- Không có truy cập chéo assignment giữa các provider.

## 2. Chuẩn bị môi trường

- [ ] Seed dữ liệu demo:
  - `cd web && npm run seed:partner`
- [ ] Chuẩn bị ít nhất 3 session trình duyệt:
  - Session A: admin
  - Session B: provider Alpha
  - Session C: provider Beta
- [ ] Tài khoản test seed:
  - Admin: dùng tài khoản admin seed hiện có
  - Provider Alpha: `provider_alpha` / `12313`
  - Provider Beta: `provider_beta` / `12313`
- [ ] Đơn mẫu để test:
  - `PL-DEMO-001`
  - `PL-DEMO-002`
  - `PL-DEMO-003`
  - `PL-DEMO-004`
- [ ] Mở DevTools ở ít nhất 1 tab admin và 1 tab provider:
  - tab `Network`
  - tab `Console`

## 3. Route và điểm quan sát

- Admin order detail:
  - `/admin/orders/[orderId]`
- Provider portal:
  - `/partner/[slug]`
- Provider order detail:
  - `/partner/orders/[assignmentId]`
- SSE admin:
  - `/api/admin/realtime/assignments/[assignmentId]`
- SSE provider:
  - `/api/partner/realtime/assignments/[assignmentId]`
- SSE portal provider:
  - `/api/partner/realtime/portal`

Quan sát UI bắt buộc:

- [ ] Có badge/text `Realtime: connecting`
- [ ] Sau khi kết nối ổn định chuyển thành `Realtime: live`
- [ ] Khi backend gián đoạn chuyển thành `Realtime: reconnecting`

## 4. Smoke Test

- [ ] Mở 1 đơn đã được assign ở màn admin order detail.
  - Kỳ vọng: block realtime hiển thị `connecting` rồi sang `live`.
- [ ] Mở cùng assignment ở màn provider order detail.
  - Kỳ vọng: block realtime hiển thị `connecting` rồi sang `live`.
- [ ] Mở portal provider `/partner/[slug]` khi provider đã đăng nhập.
  - Kỳ vọng: portal hiển thị `Realtime: live` kể cả khi provider chưa có assignment nào.
- [ ] Kiểm tra tab `Network`.
  - Kỳ vọng: request SSE giữ kết nối mở, không bị đóng ngay.

## 5. Admin -> Provider

### 5.1 Cập nhật internal note

- [ ] Admin mở `/admin/orders/[id]` của đơn đã assign cho provider Alpha.
- [ ] Provider Alpha mở `/partner/orders/[assignmentId]` tương ứng.
- [ ] Từ admin, cập nhật `internal note` rồi bấm lưu.
  - Kỳ vọng: admin không lỗi submit.
  - Kỳ vọng: provider detail tự refresh trong khoảng 1-3 giây.
  - Kỳ vọng: timeline phía provider có event mới từ admin.
  - Kỳ vọng: `updatedAt` của assignment thay đổi.
  - Kỳ vọng: phía provider có toast báo admin vừa cập nhật assignment.

### 5.2 Reassign sang provider khác

- [ ] Từ admin, đổi provider của order từ Alpha sang Beta rồi lưu.
  - Kỳ vọng: admin không bị navigate sang route khác và vẫn ở nguyên order detail.
  - Kỳ vọng: trạng thái assignment bị reset về `pending_confirmation`.
  - Kỳ vọng: `accepted_at` và `completed_at` bị reset.
  - Kỳ vọng: timeline admin có event `assignment_reassigned`.
  - Kỳ vọng: provider Alpha không còn xem được assignment này.
  - Kỳ vọng: provider Beta thấy assignment mới ở portal hoặc detail.
  - Kỳ vọng: portal hoặc detail phía provider Beta có toast báo danh sách/assignment vừa đổi.

### 5.3 Tạo assignment mới

- [ ] Chọn 1 order chưa assign provider.
- [ ] Từ admin, assign provider lần đầu.
  - Kỳ vọng: order detail cập nhật block provider assignment mà không reload cả page.
  - Kỳ vọng: timeline có event `assignment_created`.
  - Kỳ vọng: assignment xuất hiện ở portal của provider được giao.

## 6. Provider -> Admin

### 6.1 Đổi trạng thái accepted

- [ ] Provider mở `/partner/orders/[assignmentId]`.
- [ ] Đổi trạng thái từ `pending_confirmation` sang `accepted`, rồi lưu.
  - Kỳ vọng: admin order detail tự refresh trong khoảng 1-3 giây.
  - Kỳ vọng: admin thấy `status = accepted`.
  - Kỳ vọng: timeline admin có message `Provider đã cập nhật trạng thái sang accepted.`
  - Kỳ vọng: `accepted_at` đã được set.
  - Kỳ vọng: phía admin có toast báo provider vừa cập nhật assignment.

### 6.2 Đổi trạng thái + reference + note

- [ ] Provider đổi tiếp sang `in_progress`.
- [ ] Nhập `providerReference`.
- [ ] Nhập `providerNote`.
- [ ] Lưu.
  - Kỳ vọng: admin tự refresh.
  - Kỳ vọng: admin thấy `status = in_progress`.
  - Kỳ vọng: admin thấy `providerReference` mới.
  - Kỳ vọng: admin thấy `providerNote` mới.
  - Kỳ vọng: timeline có ít nhất 2 event mới:
    - `status_changed`
    - `note_added`
  - Kỳ vọng: phía admin có toast báo thay đổi realtime.

### 6.3 Chuyển qua review và completed

- [ ] Provider đổi sang `ready_for_review`, lưu.
  - Kỳ vọng: admin tự refresh và thấy trạng thái mới.
- [ ] Provider đổi sang `completed`, lưu.
  - Kỳ vọng: admin tự refresh.
  - Kỳ vọng: `completed_at` đã được set.
- [ ] Provider đổi ngược từ `completed` sang trạng thái khác.
  - Kỳ vọng: `completed_at` bị clear.

## 7. Portal Provider List Refresh

- [ ] Provider Alpha đăng nhập vào `/partner/[slug]`.
- [ ] Giữ portal này mở.
- [ ] Từ admin, cập nhật một assignment bất kỳ của provider Alpha.
  - Kỳ vọng: portal provider tự refresh.
  - Kỳ vọng: card order cập nhật `lastEvent` hoặc `updatedAt`.
  - Kỳ vọng: portal provider có toast báo danh sách đơn vừa được cập nhật.
- [ ] Từ provider order detail, tiếp tục lưu một trạng thái mới.
  - Kỳ vọng: portal mở sẵn phản ánh trạng thái mới sau realtime refresh.
  - Kỳ vọng: portal mở sẵn có toast báo thay đổi mới.

## 8. Authorization và phân quyền

- [ ] Gọi `/api/admin/realtime/assignments/[id]` khi chưa đăng nhập.
  - Kỳ vọng: `401 unauthorized`.
- [ ] Gọi `/api/partner/realtime/assignments/[id]` khi chưa đăng nhập.
  - Kỳ vọng: `401 unauthorized`.
- [ ] Dùng provider Alpha gọi SSE của assignment thuộc provider Beta.
  - Kỳ vọng: `404 not_found`.
- [ ] Dùng user không phải provider mở `/partner/[slug]`.
  - Kỳ vọng: bị redirect khỏi partner workspace.
- [ ] Dùng provider Beta truy cập slug của provider Alpha.
  - Kỳ vọng: bị redirect về portal slug của chính Beta.

## 9. SSE / Connection Behavior

- [ ] Kiểm tra response header SSE ở cả admin và provider:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache, no-transform`
  - `Connection: keep-alive`
- [ ] Xác nhận stream có event `ready` khi vừa kết nối.
- [ ] Sau khi có cập nhật dữ liệu, xác nhận stream nhận event `provider-assignment.changed`.
- [ ] Với portal provider, xác nhận stream nhận event `provider-portal.changed`.
- [ ] Reload page khi SSE đang mở.
  - Kỳ vọng: UI quay lại `connecting` rồi `live`.
- [ ] Tắt backend/dev server tạm thời.
  - Kỳ vọng: UI chuyển `reconnecting`.
- [ ] Bật lại backend/dev server.
  - Kỳ vọng: UI quay lại `live`.
- [ ] Xóa assignment hoặc làm assignment không còn tồn tại.
  - Kỳ vọng: stream phát `provider-assignment.deleted` hoặc route trả `404`.

## 10. Data Integrity

- [ ] Mỗi lần admin assign lần đầu, DB có thêm event `assignment_created`.
- [ ] Mỗi lần admin update note cùng provider cũ, DB có thêm event `note_added`.
- [ ] Mỗi lần admin reassign provider, DB có thêm event `assignment_reassigned`.
- [ ] Mỗi lần provider đổi trạng thái, DB có thêm event `status_changed`.
- [ ] Nếu có `providerNote`, DB có thêm event `note_added`.
- [ ] Nếu không nhập `providerNote`, DB không sinh thừa event `note_added`.
- [ ] Khi chỉ đổi status, timeline không bị duplicate bất thường.
- [ ] Khi lưu liên tiếp nhiều lần nhanh, UI cuối cùng phản ánh đúng trạng thái mới nhất.

## 11. Edge Cases

- [ ] Provider nhập note dài nhiều dòng rồi lưu.
  - Kỳ vọng: admin render đúng, không vỡ layout, không mất dòng.
- [ ] Provider nhập `providerReference` dài hoặc có ký tự đặc biệt.
  - Kỳ vọng: admin hiển thị đúng.
- [ ] Provider bấm lưu 2 lần liên tiếp rất nhanh.
  - Kỳ vọng: không sinh trạng thái cuối sai.
- [ ] Provider đổi status liên tiếp: `accepted -> in_progress -> ready_for_review`.
  - Kỳ vọng: admin cuối cùng hiển thị đúng trạng thái sau cùng.
- [ ] Admin reassign khi provider đang mở detail.
  - Kỳ vọng: provider cũ mất quyền ở lần refresh/reconnect kế tiếp.
- [ ] Mở nhiều tab admin cùng xem 1 order.
  - Kỳ vọng: mọi tab đang mở đều tự refresh theo SSE.
- [ ] Mở nhiều tab provider cùng xem 1 assignment.
  - Kỳ vọng: mọi tab đang mở đều tự refresh theo SSE.

## 12. Checklist ghi nhận lỗi

Mỗi bug cần ghi đủ:

- [ ] Role test: admin / provider Alpha / provider Beta
- [ ] Route bị lỗi
- [ ] Dữ liệu input đã dùng
- [ ] Kết quả thực tế
- [ ] Kết quả kỳ vọng
- [ ] Screenshot hoặc network capture nếu liên quan SSE
- [ ] Có tái hiện được hay không

## 13. Pass Criteria

- [ ] Admin thay đổi thì provider thấy cập nhật mà không cần hard refresh.
- [ ] Provider thay đổi thì admin thấy cập nhật mà không cần hard refresh.
- [ ] Không có polling loop DB trong core realtime; cập nhật chỉ được phát khi có `NOTIFY` phù hợp.
- [ ] Portal provider và provider detail đều phản ánh dữ liệu mới trong flow bình thường.
- [ ] Toast realtime hiển thị đúng phía nhận thay đổi, không bắn trùng với chính thao tác vừa lưu.
- [ ] Không có lỗi quyền truy cập chéo assignment.
- [ ] Timeline không thiếu event quan trọng và không nhân đôi bất thường.
- [ ] SSE giữ kết nối ổn định và tự recover sau reconnect.
