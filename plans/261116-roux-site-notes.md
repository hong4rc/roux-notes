# Roux Việt: ghi chú hoàn thành

Trạng thái: bản đầu hoàn chỉnh, build thành công (`bun run build`).

## Đã kiểm chứng bằng mô phỏng
- Động cơ khối lập phương riêng: `bun run scripts/test-engine.ts`.
- 42 case CMLL từ hai nguồn (Ruwix, Scheopner): `bun run scripts/verify-all.ts` in "all checks passed".
- Phủ đủ 648 trạng thái góc.
- Thuật toán LSE tìm bằng duyệt toàn bộ không gian M/U (184.320 trạng thái).

## Chưa kiểm chứng
- Tên chuẩn S1–S6 của các nhóm: trang dùng tên mô tả của Ruwix và ghi rõ nguồn.
- Cách đọc chính xác của "Roux".
- Một số chi tiết lịch sử chỉ dựa trên báo cáo nghiên cứu, trích nguồn ở trang Giới thiệu.

## Chạy
- `bun install`, `bun run dev` (cổng 5273), `bun run build`.
