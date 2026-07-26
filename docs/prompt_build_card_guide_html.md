# PROMPT - dựng trang HTML giải thích từng card của Diabetes Analytics Dashboard

> Copy toàn bộ nội dung dưới dòng kẻ ngang và đưa cho AI thực thi.
> AI đó cần có quyền đọc/ghi file trong repo và điều khiển được trình duyệt.

---

## VAI TRÒ

Bạn là kỹ sư frontend kiêm technical writer. Nhiệm vụ: dựng **một trang HTML tài liệu**
giải thích toàn bộ giao diện của web app trong thư mục `app/` của repo này, gồm ảnh chụp
từng card kèm phần giải thích đi kèm.

Trang này dùng để nộp kèm đồ án và để thuyết trình, nên độ chính xác quan trọng hơn độ
hào nhoáng.

## ĐẦU VÀO CÓ SẴN TRONG REPO

| Đường dẫn | Vai trò |
|---|---|
| `docs/website_card_guide.md` | **Nguồn nội dung chính.** Đã viết sẵn đầy đủ: từng tab, từng card, mỗi card có 3 phần "hiển thị gì / đọc thế nào / làm ra bằng cách nào" |
| `app/` | Source code Next.js của dashboard cần chụp ảnh |
| `.claude/launch.json` | Cấu hình chạy dev server, tên config là `dashboard`, port 3000 |
| `results/**/*.csv` | Dữ liệu gốc, dùng để đối chiếu nếu cần kiểm tra một con số |

## QUY TẮC VỀ NỘI DUNG VÀ CÁCH XỬ LÝ KHI LỆCH

**Không bịa.** KHÔNG tự thêm nhận định mới, KHÔNG tự sửa hay tự tính lại số liệu. Toàn bộ
chữ nghĩa lấy từ `docs/website_card_guide.md`. Bạn được phép biên tập cho gọn và chia nhỏ
đoạn cho dễ đọc trên web.

**Hai nguồn chân lý, phân vai rõ ràng.** Tài liệu và app có thể lệch nhau vì app đang được
sửa song song. Khi lệch thì áp dụng đúng thứ tự ưu tiên sau, **không dừng công việc**:

| Loại thông tin | Ai đúng | Bạn làm gì |
|---|---|---|
| Selector, class name, vị trí phần tử, chữ hiển thị trên giao diện | **App** | Dùng theo app. Tìm phần tử tương đương và chụp. Ghi vào danh sách lệch |
| Con số, cách diễn giải, chuỗi nguồn dữ liệu | **`website_card_guide.md`** | Dùng theo tài liệu. Không tự tính lại |
| Một card có trong tài liệu nhưng **không tồn tại** trong app | app | Bỏ card đó khỏi trang HTML, ghi vào danh sách lệch |
| Một card có trong app nhưng **không có** trong tài liệu | tài liệu | Vẫn chụp ảnh, để chỗ giải thích trống kèm nhãn `chưa có mô tả`, ghi vào danh sách lệch |

**Chỉ dừng lại và hỏi trong đúng một trường hợp:** khi một **con số** hiển thị trên app
khác với con số trong tài liệu. Đó là vấn đề về tính đúng của dữ liệu, không phải vấn đề
trình bày, và bạn không được tự quyết chọn số nào.

Mọi trường hợp lệch khác: cứ làm tiếp theo bảng trên, gom lại thành một danh sách và báo ở
mục 4 của báo cáo cuối. Đừng dừng cả công việc vì một selector đổi tên.

**Tuyệt đối không sửa file trong `app/`.** Nhiệm vụ của bạn là dựng tài liệu, không phải
sửa ứng dụng. Nếu thấy app cần sửa thì ghi vào danh sách lệch để người khác quyết.

### Những chỗ đã biết là lệch, tính đến 2026-07-26

Đọc kỹ mục này trước khi chụp, để không mất thời gian phát hiện lại:

Commit `c99eb97 fix(dashboard): tighten analytics layout` đã đổi hai thứ so với các bản
mô tả cũ mà bạn có thể gặp ở đâu đó trong repo:

- Disclaimer **không còn** là banner đầu trang. Component `DisclaimerBanner` và class
  `.disclaimer-banner` đã bị xoá khỏi codebase. Giờ nó là `<p className="footer-disclaimer">`
  nằm ở **cuối sidebar** (`Sidebar.tsx:61`), chữ chỉ còn `Research and education tool, not a
  diagnostic device. Association is not causation.`, không còn tiền tố `Research only`.
  Đây là quyết định có chủ đích, không phải lỗi. `website_card_guide.md` đã mô tả đúng
  trạng thái này ở mục 0 và ở Phụ lục.
- Mật độ bố cục đã siết lại: kpi-card thấp hơn, khoảng cách giữa các section hẹp hơn, bảng
  gọn hơn. Ảnh bạn chụp sẽ phản ánh trạng thái mới nhất, và như vậy là đúng.

---

## GIAI ĐOẠN 1 - CHỤP ẢNH TỪNG CARD

### 1.1. Khởi động app

Dùng công cụ preview để chạy config `dashboard` trong `.claude/launch.json`. Nếu port
3000 đang bận thì mở thẳng `http://localhost:3000`. Không dùng terminal để chạy dev
server.

Trước khi chụp, chạy `npm run prepare-data --prefix app` một lần để chắc chắn dữ liệu
JSON là mới nhất.

### 1.2. Thiết lập chụp

- Viewport: **1440 × 900**, `deviceScaleFactor` 2 để ảnh nét.
- Chụp **hai bộ**: một bộ theme sáng, một bộ theme tối. Đặt theme bằng cách set thuộc
  tính `data-theme` trên phần tử gốc (`light` hoặc `dark`).
- Chụp **theo phần tử**, không chụp cả màn hình. Mỗi ảnh chỉ chứa đúng một card, có chừa
  lề khoảng 12px xung quanh.
- Trước mỗi lần chụp, cuộn phần tử vào giữa màn hình và đợi ảnh cùng biểu đồ render xong
  (chờ đến khi không còn phần tử nào có `[data-loading]`, và đợi thêm 400ms cho animation
  của Recharts và của component `Reveal` chạy hết).
- Lưu vào `docs/card-guide/assets/light/<id>.png` và `docs/card-guide/assets/dark/<id>.png`.

### 1.3. Cách xác định phần tử cần chụp

**Đừng dùng selector kiểu `nth-child`**, nó sẽ vỡ khi layout đổi. Dùng chiến lược sau:

- Card dạng ChartCard: tìm phần tử `.card-title` có nội dung khớp tiêu đề trong bảng dưới
  (so khớp không phân biệt hoa thường, chấp nhận khớp một phần), rồi chụp
  `closest('.chart-card')` của nó.
- Khối KPI: tìm `.section-kicker` có nội dung khớp nhãn section, rồi chụp phần tử
  `.kpi-grid` đầu tiên nằm trong `closest('.section-block')`.
- Các khối còn lại: dùng đúng selector ghi trong cột "Cách lấy".

### 1.4. Danh mục ảnh cần chụp

Cột `id` chính là tên file ảnh.

#### Khung chung (chụp một lần, ở trang `/overview`)

| id | Cách lấy |
|---|---|
| `shell-sidebar` | `.sidebar` |
| `shell-topbar` | `.topbar` |
| `shell-disclaimer` | `.footer-disclaimer`, chụp cả `.sidebar-footer` bao quanh nó để thấy ngữ cảnh |

#### Tab Overview - `/overview`

| id | Cách lấy |
|---|---|
| `ov-hero` | `.page-head` |
| `ov-kpi` | section kicker `Study at a glance` → `.kpi-grid` |
| `ov-cohort-filters` | `.filter-toolbar` |
| `ov-cohort-metrics` | `.metric-strip` đầu tiên trong `.analysis-workbench` |
| `ov-age-profile` | card title `Age risk profile` |
| `ov-cohort-vs-pop` | card title `Selected cohort vs population` |
| `ov-evidence-chain` | `.evidence-grid` |
| `ov-pipeline` | card title `CRISP-DM evidence pipeline` |
| `ov-class-balance` | card title `Class balance` |

Trước khi chụp `ov-cohort-*`, đặt URL thành `/overview?sex=1&age=9&bmi=obesity` để bộ lọc
có trạng thái thật thay vì trống trơn. Chụp thêm một ảnh `ov-cohort-metrics-empty` ở
trạng thái mặc định để đối chiếu.

#### Tab RQ1 - `/rq1`

| id | Cách lấy |
|---|---|
| `rq1-hero` | `.page-head` |
| `rq1-kpi` | section kicker `Effect-size summary` → `.kpi-grid` |
| `rq1-largen` | `.callout` đầu tiên trên trang |
| `rq1-explorer` | card title `Linked categorical association explorer` |
| `rq1-levels` | card title bắt đầu bằng `Diabetes prevalence by` |
| `rq1-profile` | card title `Selected factor profile` |
| `rq1-numeric` | card title `Numeric variables` |
| `rq1-bmi-figure` | card title `BMI distribution by class` |
| `rq1-adjusted` | card title `Odds ratios from the 21-predictor logistic regression` |

Chụp ở trạng thái mặc định (`GenHlth` đang được chọn).

#### Tab RQ2 - `/rq2`

| id | Cách lấy |
|---|---|
| `rq2-hero` | `.page-head` |
| `rq2-holdout-kpi` | section kicker `Final result on the untouched holdout` → `.kpi-grid` |
| `rq2-calibration` | card title `Probability calibration` |
| `rq2-split-callout` | `.callout` trong cùng section |
| `rq2-dev-kpi` | section kicker `Development-set selection evidence` → `.kpi-grid` |
| `rq2-scorecard` | card title `Model scorecard` |
| `rq2-threshold` | card title `Decision-threshold explorer` |
| `rq2-confusion` | card title bắt đầu bằng `Confusion matrix` |
| `rq2-exports` | card title `Reproducibility exports` |

Chụp `rq2-threshold` và `rq2-confusion` **hai lần**: một lần ở `?threshold=0.50` (hậu tố
file `-t050`) và một lần ở `?threshold=0.13` (hậu tố `-t013`). Cặp ảnh này là minh hoạ
đắt nhất của cả trang, vì nó cho thấy sự đánh đổi bằng hình.

#### Tab RQ3 - `/rq3`

| id | Cách lấy |
|---|---|
| `rq3-hero` | `.page-head` |
| `rq3-kpi` | section kicker `Global importance summary` → `.kpi-grid` |
| `rq3-shap-ranking` | card title `Linked SHAP importance ranking` |
| `rq3-scatter` | card title `Rank agreement map` |
| `rq3-feature-profile` | `.feature-profile` |
| `rq3-table` | `.data-table` trong `.compact-section` |
| `rq3-groups` | `.group-cards` |
| `rq3-alignment` | card title `How closely do SHAP ranks` |
| `rq3-exports` | card title `Reproducibility exports` |

Chụp thêm `rq3-scatter-sex` ở URL `/rq3?feature=Sex`, vì Sex là ví dụ trung tâm của khung
bốn nhóm và cần thấy nó nằm xa đường chéo.

#### Tab Assistant - `/assistant`

| id | Cách lấy |
|---|---|
| `ai-hero` | `.page-head` |
| `ai-chat` | `.chat-shell` |
| `ai-suggestions` | `.suggestions-panel` |

Với `ai-chat`: trước khi chụp, bấm một nút gợi ý để có ít nhất một cặp hỏi đáp thật trong
khung, đừng chụp lúc khung còn trống.

### 1.5. Sau khi chụp

Ghi ra `docs/card-guide/assets/manifest.json` gồm mảng các mục
`{ id, light, dark, page, capturedAt, viewport }`. Trang HTML sẽ không đọc file này lúc
chạy, nhưng nó là bằng chứng để đối chiếu và để chụp lại về sau.

---

## GIAI ĐOẠN 2 - DỰNG TRANG HTML

### 2.1. File đầu ra

- `docs/card-guide/index.html` - một file duy nhất, **CSS và JS viết inline bên trong**,
  không dùng CDN, không dùng framework, không có bước build.
- Ảnh tham chiếu bằng đường dẫn tương đối tới `assets/`. **Không** nhúng base64, vì hơn 40
  ảnh ở scale 2 sẽ làm file phình lên hàng chục MB.
- Mở file bằng cách double-click phải chạy được ngay, không cần server.

### 2.2. Cấu trúc trang

```
Header
  Tiêu đề, một đoạn mô tả ngắn, chip: 5 tabs · 42 cards · BRFSS 2015
  Nút chuyển theme sáng/tối
  Nút chuyển ảnh light/dark (đổi toàn bộ ảnh trên trang cùng lúc)

Mục 0 - Luồng dữ liệu chung
  Sơ đồ pipeline dựng bằng HTML/CSS (không phải ảnh)
  4 nguyên tắc chung
  Bảng 3 thành phần khung chung, kèm ảnh shell-*

Nav dính (sticky)
  5 nút nhảy tới 5 tab

Mỗi tab = một <section>
  Tiêu đề tab + route + một câu mô tả vai trò
  Danh sách card, mỗi card là một khối

Footer
  Ngày sinh trang, commit hash nếu lấy được, câu nhắc cách chụp lại ảnh
```

### 2.3. Khối của một card - đây là phần quan trọng nhất

Mỗi card render thành một khối theo đúng khuôn sau:

```
┌────────────────────────────────────────────────────────────┐
│ [số thứ tự]  TÊN CARD                    [badge: tên route]│
├──────────────────────────┬─────────────────────────────────┤
│                          │  HIỂN THỊ GÌ                    │
│      ẢNH CHỤP CARD       │  ...                            │
│   (bấm vào để phóng to)  │                                 │
│                          │  ĐỌC THẾ NÀO                    │
│                          │  ...                            │
├──────────────────────────┴─────────────────────────────────┤
│  LÀM RA BẰNG CÁCH NÀO                                      │
│  ...                                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ chuỗi nguồn: file.csv → hàm xử lý → file.json → card │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

Yêu cầu chi tiết:

1. **Ảnh bên trái, chữ bên phải** trên màn hình rộng. Dưới 900px thì xếp dọc, ảnh lên
   trên.
2. **Chuỗi nguồn (data lineage)** là một dải riêng, nền khác, font monospace, hiển thị
   đường đi từ file CSV gốc tới card. Trích từ phần "làm ra bằng cách nào" trong file
   nguồn. Đây là điểm bán hàng của cả tài liệu, đừng làm nó chìm.
3. **Bấm vào ảnh thì mở lightbox** phóng to toàn màn hình, bấm ra ngoài hoặc phím Esc thì
   đóng. Viết bằng JS thuần, khoảng 20 dòng.
4. Card nào có **hai biến thể ảnh** (ví dụ `rq2-threshold-t050` và `-t013`) thì làm
   **thanh trượt so sánh trước/sau** hoặc hai tab nhỏ ngay trong ô ảnh, kèm nhãn rõ ràng
   `t = 0.50` và `t = 0.13`.
5. Card nào là **điểm nhấn** thì đánh dấu bằng viền hoặc badge riêng. Danh sách điểm nhấn:
   `ov-cohort-vs-pop` (cohort cube 208 ô), `rq1-adjusted` (đơn biến so với đa biến),
   `rq2-split-callout` (không chọn ngưỡng trên tập test), `rq2-threshold` (card ngôi sao),
   `rq2-calibration` (rất ít bài có), `rq3-groups` (đóng góp phương pháp riêng),
   `rq3-alignment` (câu trả lời định lượng cho RQ3).

### 2.4. Thiết kế

- **Chỉ dùng CSS thuần**, biến CSS cho màu, không thư viện.
- **Hai theme.** Mặc định theo `prefers-color-scheme`, có nút bật tắt ghi đè, lưu lựa chọn
  vào `localStorage`. Cả hai theme đều phải đọc được, không được chỉ chăm chút một cái.
- Bảng màu lấy đúng tinh thần của app: nền trung tính, xanh dương làm màu nhấn, đỏ dành
  riêng cho khái niệm rủi ro. Đừng dùng gradient tím kiểu template AI.
- Chiều rộng nội dung tối đa khoảng 1100px, canh giữa.
- Font: dùng font hệ thống (`system-ui`), không tải font ngoài.
- Ảnh có bo góc, viền mảnh và đổ bóng nhẹ để tách khỏi nền trang.
- **Responsive thật**: kiểm tra ở 1440px, 900px và 390px. Bảng nào rộng thì bọc trong
  `overflow-x: auto`, trang không bao giờ được cuộn ngang.
- Có `scroll-margin-top` cho mọi anchor để nav dính không che mất tiêu đề.

### 2.5. Quy tắc viết chữ

- **Tiếng Việt**, thuật ngữ kỹ thuật giữ nguyên tiếng Anh (PR-AUC, holdout, SHAP,
  threshold, cohort).
- **Không dùng dấu gạch ngang dài.** Dùng dấu phẩy, dấu hai chấm hoặc gạch nối ngắn.
- Câu ngắn. Mỗi đoạn tối đa 3 câu.
- Số theo định dạng của file nguồn: dùng dấu phẩy làm dấu thập phân trong phần văn xuôi
  tiếng Việt (0,4238), nhưng **giữ nguyên định dạng gốc khi trích lại chữ hiển thị trên
  giao diện** (giao diện dùng dấu chấm).
- Không dùng emoji.

---

## KIỂM TRA TRƯỚC KHI BÁO XONG

Tự chạy hết danh sách này, và báo lại kết quả từng mục:

- [ ] Mọi ảnh trong `assets/light/` đều có ảnh `dark/` tương ứng, không ảnh nào 404 khi mở
      trang.
- [ ] Số card trong trang HTML khớp với số mục trong `docs/website_card_guide.md`. Mỗi
      chỗ chênh phải giải thích được bằng một dòng trong danh sách lệch, không được chênh
      vì bỏ sót.
- [ ] Mọi con số xuất hiện trong phần chữ đều tìm được trong file nguồn. Không tự tính,
      không tự làm tròn khác đi.
- [ ] Nút chuyển theme hoạt động ở cả hai chiều, và lựa chọn còn giữ sau khi tải lại trang.
- [ ] Nút chuyển ảnh light/dark đổi được toàn bộ ảnh cùng lúc.
- [ ] Lightbox mở và đóng được bằng chuột và bằng phím Esc.
- [ ] Ở 390px, trang không cuộn ngang.
- [ ] Mở file trực tiếp bằng `file://` vẫn chạy đủ chức năng.
- [ ] Không có request nào ra ngoài internet. Kiểm tra bằng tab Network.
- [ ] Không có lỗi trong console.

## BÁO CÁO CUỐI

Trả lời gọn theo bốn ý:

1. Đường dẫn file đã tạo và tổng số ảnh đã chụp.
2. Kết quả từng mục trong danh sách kiểm tra ở trên.
3. Những chỗ bạn phải tự phán đoán vì file nguồn không nói rõ.
4. **Danh sách lệch.** Mỗi dòng gồm: card nào, tài liệu nói gì, app thực tế thế nào, bạn
   đã xử lý ra sao. Nếu không có chỗ nào lệch thì ghi thẳng "không có".
