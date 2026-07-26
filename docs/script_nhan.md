# Script thuyết trình - Nguyễn Trọng Nhân

Bản tách riêng phần của Nhân từ [script_thuyet_trinh.md](script_thuyet_trinh.md), đã bổ
sung slide 20 và phần Q&A riêng. Dùng file này khi tập một mình; file gốc dùng khi tập
cả nhóm để canh chỗ bàn giao.

**Slide phụ trách:** 10, 11 (Phần 2) và 17, 18, 19, 20 (Phần 4)
**Tổng thời lượng mục tiêu:** 5 phút 15 giây

| Slide | Tiêu đề | Thời lượng | Nói sau ai |
|---|---|---|---|
| 10 | Advanced Data Visualization | 60 giây | Đạt (slide 9) |
| 11 | Interactive Dashboard | 60 giây | chính mình |
| 17 | AI-Powered Application | 55 giây | Khang (slide 16) |
| 18 | Developing AI-Powered Solutions | 45 giây | chính mình |
| 19 | Conclusion | 55 giây | chính mình |
| 20 | AI Reflection & Q&A | 40 giây | chính mình |

**Quy ước trong script**

- Phần in thường là lời thoại, đọc thẳng được.
- `[CẮT ĐƯỢC]` là câu bỏ đi vẫn không hụt ý. Thiếu giờ thì bỏ mấy dòng này trước.
- `[CHUYỂN]` là câu bàn giao. Đừng bỏ, hội đồng nhìn vào đây để đánh giá nhóm có tập
  chung hay không.
- `[LƯU Ý]` là ghi chú cho người nói, không đọc lên.
- Số đọc kiểu Việt: `0,4238` đọc là "không phẩy bốn hai ba tám", `253.680` đọc là
  "hai trăm năm mươi ba nghìn sáu trăm tám mươi".

**Việc phải làm trước khi lên trình bày**

1. Mở sẵn tab thứ hai: dashboard đang chạy ở trang `/assistant`, và file backup slide.
2. Đừng chạy `npm install` khi dev server đang bật. Có lần cài giữa chừng làm
   `/overview`, `/rq1`, `/rq3` trả 500 vì thiếu `@babel/runtime`.
3. Đừng chạy `python presentation/make_deck.py`. File deck thật là
   `DAP391m_Diabetes_Analytics.pptx.pptx` đã sửa tay, còn script build ghi ra tên khác
   và sẽ dựng lại từ source cũ.

**Đã xử lý xong, chỉ cần liếc xác nhận**

- Hộp viền đỏ `INTERNAL NOTE` trên slide 9 và 15: đã xoá. Hộp vàng trên slide 15 vẫn
  còn ("Stated limitation: hyperparameter search was not performed..."), giữ nguyên,
  đó là nội dung có chủ đích.
- Sơ đồ grounding slide 17: hộp giữa nay ghi đúng `LLM via Gemini 2.5 Flash`, khớp với
  `app/src/app/api/chat/route.ts:12,54`.

---

# PHẦN 2 - hai slide đầu

## Slide 10 - Advanced Visualization · 60 giây

Cảm ơn Đạt. Phần tiếp theo là trực quan hóa nâng cao, và đây cũng chính là câu trả lời
cho RQ3.

Hình bên trái là **beeswarm SHAP**. Mỗi điểm là một người trả lời khảo sát. Hình này cho
biết cùng lúc ba thứ: thứ hạng đặc trưng, hướng tác động, và độ phân tán. Năm biến dẫn
đầu là GenHlth không phẩy sáu ba tám, HighBP không phẩy năm hai sáu, Age, BMI và HighChol.

Hình bên phải là **đóng góp phương pháp riêng của nhóm em**, không phải hình có sẵn trong
thư viện. Thay vì chỉ hỏi "SHAP có khớp với thống kê không", nhóm em dựng một khung bốn
nhóm trên hai trục: effect size thống kê và độ nổi bật trong mô hình.

Nhóm một có chín biến vừa mạnh về thống kê vừa nổi bật trong mô hình. Đáng chú ý nhất là
**nhóm ba chỉ có duy nhất biến Sex**: liên hệ hai biến rất yếu, nhưng SHAP xếp hạng bảy.
Nghĩa là giới tính đóng góp **có điều kiện** bên trong mô hình đa biến. Nếu chỉ nhìn
thống kê hai biến thì đã bỏ sót nó.

Số liệu trả lời RQ3 nằm ở dải dưới: trùng **bảy trên mười** ở top-mười, Jaccard không
phẩy năm bốn, tương quan hạng Spearman **không phẩy bảy mươi mốt**.

Kết luận: khớp mạnh nhưng không tuyệt đối. Mô hình về cơ bản tìm lại đúng bằng chứng
thống kê, và **chính những chỗ lệch mới là chỗ có thông tin**.

---

## Slide 11 - Interactive Dashboard · 60 giây

Nhóm em xây dashboard bằng **Next.js thay vì Plotly hay Dash**. Lý do ghi ở dải vàng dưới
cùng: dashboard này được triển khai như một ứng dụng web thật, có tích hợp trợ lý AI ở
bên trong. Nhóm em đang làm thêm một bản Plotly Dash để bổ sung.

Ảnh bên trái chụp trực tiếp từ ứng dụng đang chạy, không phải bản vẽ mô phỏng.

Có năm trang, mỗi câu hỏi nghiên cứu một trang riêng. Trang tương tác nhất là **RQ2**:
kéo slider ngưỡng thì recall, precision và ma trận nhầm lẫn cập nhật ngay lập tức, để
người dùng tự cảm nhận sự đánh đổi mà Khang sẽ nói ở slide mười bốn.

Điểm kỹ thuật em muốn nhấn là **data contract**. Dashboard không tự tính toán lại bất cứ
thứ gì. Có một script build đọc thẳng kết quả từ pipeline Python xuất ra JSON, và khi
load thì validate bằng Zod schema. Nghĩa là về mặt kiến trúc, **không thể có chuyện số
trên dashboard lệch với số trong báo cáo**.

[CẮT ĐƯỢC] Ba điểm còn lại: trạng thái được mã hóa trong URL nên chia sẻ được đúng một
view cụ thể; có theme sáng tối và đã QA trên mobile; và cảnh báo không dùng để chẩn đoán
hiển thị cố định ở mọi trang.

[CHUYỂN] Dashboard hiển thị kết quả. Còn kết quả đó được tạo ra như thế nào thì Khang
trình bày.

---

# PHẦN 4 - bốn slide cuối

## Slide 17 - AI-Powered Application · 55 giây

Cảm ơn Khang. Sản phẩm ứng dụng của nhóm em là một trợ lý AI **được neo vào kết quả
nghiên cứu**. Nó trả lời câu hỏi về chính nghiên cứu này, bằng chính số liệu của nghiên
cứu này.

Vấn đề lớn nhất khi gắn một mô hình ngôn ngữ vào báo cáo khoa học là **ảo giác số liệu**:
nó bịa ra con số nghe rất hợp lý. Nhóm em xử lý bằng bốn quyết định thiết kế.

Một, **ngữ cảnh được neo**: file `system-instruction` nạp sẵn kết quả thật của nghiên cứu
vào ngữ cảnh, nên trợ lý không suy đoán ra ngoài phạm vi dữ liệu.

Hai, **ép quy ước thuật ngữ**. Bắt buộc gọi là "không ghi nhận tiểu đường" và "tiền tiểu
đường hoặc tiểu đường". **Cấm** dùng từ "khỏe mạnh" hay "bệnh nhân tiểu đường", vì nhãn
của bộ dữ liệu là tự khai báo chứ không phải chẩn đoán lâm sàng.

Ba, **fallback tất định**: nếu không có API key thì trợ lý vẫn trả lời được bằng nội dung
soạn sẵn. Nghĩa là buổi demo hôm nay không phụ thuộc vào mạng.

Bốn, cảnh báo không dùng để chẩn đoán, hiển thị cố định, không tắt được.

[LƯU Ý] Model đang dùng là **Gemini 2.5 Flash**, gọi thẳng qua REST chứ không qua SDK của
hãng. Slide 17 đã sửa đúng tên model.

[LƯU Ý] Nếu còn giờ và thầy muốn xem demo trực tiếp thì mở `/assistant` và bấm chip
**"Vì sao điều chỉnh ngưỡng sàng lọc?"**. Năm chip gợi ý trên web đều là tiếng Việt,
đừng gõ câu tiếng Anh vì không có sẵn. Bốn chip còn lại: "Tóm tắt kết luận của 3 RQ",
"Vì sao PR-AUC quan trọng hơn Accuracy ở đây?", "SHAP có khớp với kiểm định thống kê
không?", "Top 5 yếu tố theo Cramér's V?".

---

## Slide 18 - Developing AI-Powered Solutions · 45 giây

Slide này nói về **cách nhóm em dùng AI để phát triển ứng dụng**, và nhóm em coi đây là
một phần cần được ghi chép đàng hoàng chứ không phải chuyện làm cho xong.

Nguyên tắc bao trùm ghi ngay ở dòng đầu: **AI được hỏi để so sánh phương án và đánh đổi,
không phải để sinh code**.

Mỗi quyết định kiến trúc đi qua đúng **sáu bước** ở dải trên: chốt ràng buộc trước, hỏi
AI liệt kê phương án, tự quyết, tự viết code, đối chiếu số ngược về pipeline, rồi ghi
quyết định vào audit log.

Con số đáng nói nằm ở dòng giữa: **mười bảy quyết định** được ghi trong audit log, trong
đó có **năm lần gợi ý của mô hình là sai** và nhóm em phải bắt được trước khi nó lọt vào
báo cáo.

Ba nguyên tắc làm việc ở dưới. Một, **ràng buộc trước câu hỏi**: quy ước nhãn lớp, giới
hạn phạm vi và lập trường không chẩn đoán được chốt trước khi viết dòng code nào, nên mọi
phương án đem đi hỏi đều đã bị ràng buộc sẵn.

Hai, **ranh giới do chính build enforce**, không phải lời hứa. Kết quả phân tích đi vào
app qua `build-data.mjs` và Zod schema, giao diện **không được phép** tự tính lại một chỉ
số nào, và build **ném lỗi** nếu cỡ mẫu hai tập không khớp.

Ba, **kiểm chứng chứ không tin**: mọi giá trị hiển thị đều đối chiếu ngược về artefact
của pipeline, ảnh QA được commit vào `app/docs/qa`, và mười tám con số headline đã đối
chiếu chéo qua ba mặt repo, dashboard và slide.

Gộp lại thì ba nguyên tắc này cùng nói một điều: **ranh giới không nằm ở lời hứa, nó
nằm trong build**, và mọi con số hiển thị đều có đường truy ngược về pipeline.

[LƯU Ý] Slide 18 không có dải chữ dưới cùng, đừng chỉ tay xuống đáy slide. Câu "AI chỉ
đụng tầng trình bày, không đụng tầng tính toán" là gạch đầu dòng của **slide 20**, để
dành nói ở đó.

---

## Slide 19 - Conclusion · 55 giây

Em xin tóm lại theo ba câu hỏi.

**RQ1**: cả hai mươi mốt chỉ số có ý nghĩa đơn biến sau hiệu chỉnh Holm, còn **mười bảy
trên hai mươi mốt** giữ được ý nghĩa trong mô hình đa biến. Xếp theo effect size thì sức
khỏe tự đánh giá và BMI dẫn đầu.

**RQ2**: XGBoost được chọn, ROC-AUC trên holdout không phẩy tám hai bảy, và việc chỉnh
ngưỡng cắt được bảy mươi bảy phần trăm số ca bỏ sót.

**RQ3**: SHAP về cơ bản tìm lại đúng bằng chứng thống kê, tương quan hạng không phẩy bảy
mươi mốt, và những chỗ lệch thì giải thích được bằng khung bốn nhóm.

Về hạn chế, nhóm em xin **chủ động nêu chứ không đợi bị hỏi**.

Dữ liệu là **tự khai báo và cắt ngang**, nên mọi kết luận là liên hệ chứ không phải nhân
quả, và nhãn không phải chẩn đoán lâm sàng bằng HbA1c. Mẫu chưa áp trọng số khảo sát nên
không đại diện cho toàn quốc. Precision ở ngưỡng sàng lọc chỉ **hai mươi chín phẩy chín
mốt phần trăm**, tức khoảng bảy trong mười ca được gắn cờ là báo động nhầm: chấp nhận
được cho phân loại ưu tiên, không chấp nhận được cho chẩn đoán. Nhóm em chưa chạy tìm
kiếm siêu tham số, và mô hình chưa qua thẩm định lâm sàng.

Cột phải là năm hướng phát triển tiếp theo.

---

## Slide 20 - AI Reflection & Q&A · 40 giây

Cuối cùng là phản tư về việc sử dụng AI.

Khối bên trái là **chỗ AI có giúp**: so sánh phương án kiến trúc trước mỗi quyết định của
dashboard, soạn tài liệu và phần khung sinh hình, và rà soát phương pháp để tìm các lỗi
kinh điển như rò rỉ dữ liệu, chọn ngưỡng trên tập test, hay xếp hạng bằng p-value khi cỡ
mẫu rất lớn.

Khối bên phải là **chỗ con người giữ quyền**. Mọi quyết định khoa học đều do nhóm đưa ra
và tự bảo vệ được: chọn PR-AUC thay ROC-AUC, chiến lược chia dữ liệu, ràng buộc recall
tám mươi phần trăm, và khung căn chỉnh bằng chứng bốn nhóm. **Không có con số nào trên
slide do AI sinh ra**, tất cả truy ngược được về một file CSV hoặc JSON do
`run_pipeline.py` xuất ra. Gạch đầu dòng cuối gói lại cả bài: **AI chỉ đụng vào tầng
trình bày, chưa bao giờ đụng vào tầng tính toán**.

Bốn bài học lớn nhất. Một, khi cỡ mẫu rất lớn thì p-value mất khả năng phân biệt, phải
chuyển sang effect size, và nhóm em chỉ thấy điều đó khi mọi p-value đều tụt về không.
Hai, accuracy có thể là mục tiêu sai: chọn điểm vận hành thực chất là một phán đoán giá
trị xem loại sai nào gây hại hơn. Ba, tính tái lập phải được thiết kế chứ không tự có.
Bốn, giải thích được chỉ đáng tin khi được đối chiếu chéo với bằng chứng độc lập.

Nhóm em xin cảm ơn thầy và các bạn đã lắng nghe, và sẵn sàng nhận câu hỏi.

---

# Q&A - phần của Nhân

Nguyên tắc: câu hỏi thuộc slide của mình thì mình trả lời trước. Nếu bí thì nói "em xin
nhường bạn bổ sung" chứ đừng đoán bừa. Trả lời sai một con số hại hơn nhiều so với nói
"chỗ này em chưa kiểm chứng được".

## Nhóm A - Slide 10, trực quan hóa và SHAP

**1. Khung bốn nhóm chia theo ngưỡng nào? Có phải nhóm tự đặt cho đẹp không?**
Hai trục, mỗi trục một ngưỡng chốt trước. Trục thống kê dùng ngưỡng effect size:
Cramér's V lớn hơn hoặc bằng 0,05 cho biến phân loại, hoặc trị tuyệt đối rank-biserial
lớn hơn hoặc bằng 0,10 cho biến liên tục. Trục mô hình dùng top-10 theo mean trị tuyệt
đối SHAP. Nhóm em cố ý **không dùng p < 0,05** làm trục, vì với n bằng 253.680 thì mọi
p-value đều về 0 và không phân biệt được gì. Chi tiết ở
`python_analysis/rq3_explain.md` mục 2 và cột `Consistency_Group` trong
`results/xai/explanation_consistency.csv`.

**2. SHAP tính trên tập nào? Có bị rò rỉ từ tập train không?**
Tính post-hoc bằng `shap.TreeExplainer` trên mẫu 10.000 bản ghi lấy từ **tập holdout đã
khóa**, không phải tập train. Mô hình đọc thẳng từ `results/modeling/final_model.joblib`.
Nên giải thích được sinh trên dữ liệu mô hình chưa từng thấy.

**3. Sex có effect size yếu mà SHAP xếp hạng bảy, có phải là nhiễu không?**
Đây chính là điểm nhóm em muốn nêu chứ không phải chỗ né. Effect size là **liên hệ hai
biến**, SHAP là **đóng góp có điều kiện bên trong mô hình đa biến**. Sex có thể gần như
không phân biệt được gì khi nhìn một mình, nhưng lại điều chỉnh tác động của BMI và Age
khi kết hợp. Nếu chỉ nhìn thống kê hai biến thì đã bỏ sót. Đó là lý do khung bốn nhóm
tồn tại: chỗ lệch mới là chỗ có thông tin.

**4. Spearman 0,71 với chỉ 21 biến thì có ý nghĩa thống kê không?**
Có. p bằng 3,13 nhân mười mũ trừ bốn. Và nhóm em báo cáo kèm hai chỉ số độc lập nữa để
không phụ thuộc một con số: trùng 7 trên 10 ở top-10 và Jaccard 0,5385.

**5. Sao dùng SHAP mà không dùng feature importance có sẵn của XGBoost?**
Feature importance theo gain của cây bị lệch về phía biến có nhiều mức giá trị và không
cho biết **hướng** tác động. SHAP cho cả thứ hạng, hướng, độ phân tán, và giải thích được
ở cấp từng hồ sơ, nên mới so sánh được với effect size có dấu của thống kê.

**6. Sao slide 10 bỏ biểu đồ SHAP bar?**
Có ghi trong audit log entry 001. Bar chart lặp lại đúng thông tin thứ hạng mà beeswarm
đã có, trong khi beeswarm cho thêm hướng và độ phân tán. Giữ cả hai là tốn diện tích
slide mà không thêm thông tin.

## Nhóm B - Slide 11, dashboard

**7. Sao dùng Next.js mà không dùng Plotly hoặc Dash như đề bài ghi?**
Dashboard được triển khai như một ứng dụng web thật, có tích hợp trợ lý AI ở trong, có
theme sáng tối, state chia sẻ qua URL và đã QA trên mobile. Đề bài nêu tên công cụ, còn
thứ được chấm là dashboard tương tác, và nhóm em đáp ứng đủ tiêu chí đó. Bản Plotly Dash
đang làm để bổ sung. Quyết định này ghi ở audit log entry 005, kèm lý do chọn ngược lại
gợi ý ban đầu của AI.

**8. Làm sao chắc số trên dashboard khớp với số trong báo cáo?**
Đây là ràng buộc kiến trúc chứ không phải kỷ luật thủ công. `scripts/build-data.mjs` đọc
thẳng CSV và JSON của pipeline rồi xuất ra JSON cho app, khi load thì validate bằng Zod
schema, và UI không có đường nào để tự tính lại một chỉ số. Ngoài ra build có assert
chéo: nếu cỡ mẫu dev cộng holdout không ra tổng dataset thì build **ném lỗi** chứ không
xuất dữ liệu sai. Bằng chứng ở `build-data.mjs:459,462`.

**9. Slider ngưỡng có chạy lại mô hình trong lúc kéo không?**
Không. Toàn bộ 99 mức ngưỡng đã được quét sẵn trong pipeline và xuất ra file. Slider chỉ
đang tra bảng. Nếu tính lại ở client thì mới là vi phạm chính cái ranh giới em nói ở slide
18.

## Nhóm C - Slide 17 và 18, trợ lý AI và cách dùng AI

**10. Trợ lý dùng model gì?**
Gemini 2.5 Flash, gọi thẳng qua REST endpoint chứ không qua SDK của hãng
(`app/src/app/api/chat/route.ts:12,54`). Lý do không dùng SDK ghi ở audit log entry 011:
SDK khoá cứng vào một vendor, còn gọi REST thì đổi provider chỉ là đổi base URL.

**11. Nhóm dùng AI bao nhiêu phần trăm?**
Em xin trả lời theo **ranh giới** chứ không theo phần trăm, vì phần trăm không kiểm chứng
được. AI hỗ trợ tầng trình bày và tài liệu. Tầng tính toán khoa học và mọi quyết định
phương pháp là do nhóm làm, và đều truy vết được qua git history, thư mục `prompts`, và
17 entry trong AI audit log.

**12. Năm lần AI đưa gợi ý sai là những lần nào?**
Đánh dấu H1 tới H5 trong audit log. H1: AI khẳng định RQ3 chỉ có 2 nhóm nhất quán vì tin
theo file spec cũ, trong khi CSV thực tế có 4 nhóm. H2: AI gọi kiểu catch lỗi rồi lặng lẽ
dùng giá trị mặc định là "defensive best practice", thực tế nó che mất bug đọc trượt file
nên dashboard luôn hiện ngưỡng hard-code. H3: AI nói gọi hai lớp là "Healthy" và
"Diabetic" là ổn, sai vì nhãn BRFSS là tự khai báo. H4: AI nói chỉ cần câu lệnh trong
system prompt là chặn được prompt injection, không đủ. H5: AI báo số trên slide 19 khớp
với dashboard, nhưng thực chất nó đối chiếu slide với chính bản nháp slide chứ không mở
file kết quả.

**13. Nếu người dùng hỏi trợ lý câu ngoài phạm vi nghiên cứu thì sao?**
System instruction ràng buộc chỉ trả lời trong phạm vi PROJECT CONTEXT. Ngoài ra route có
giới hạn cứng: tối đa 12 tin nhắn một lượt, mỗi tin tối đa 2000 ký tự, và request sai cấu
trúc bị chặn ở tầng parse trước khi tới model. Chi tiết ở `route.ts:17,23,37-48`.

**14. Trợ lý có đưa lời khuyên y tế không?**
Không, và đây là ràng buộc thiết kế chứ không phải mong đợi. Ba lớp chặn, mỗi lớp đều
chỉ được ra dòng code:

- Cảnh báo không dùng để chẩn đoán hiển thị cố định trên mọi trang và không tắt được.
  Desktop nằm ở footer sidebar (`Sidebar.tsx:61`), dưới 920px sidebar thu thành drawer
  nên có thêm một dải cố định ngay dưới topbar (`AppShell.tsx`, class `.shell-disclaimer`).
- Quy ước thuật ngữ là một câu lệnh cứng trong `system-instruction.ts:8`: bắt buộc
  "không ghi nhận tiểu đường" / "tiền tiểu đường hoặc tiểu đường", cấm "healthy",
  "diabetic", "bệnh nhân tiểu đường", kèm lý do nhãn BRFSS là tự khai báo.
- Nhánh câu hỏi mang tính y khoa trong `fallback.ts:25-29` được bắt riêng trước mọi
  nhánh khác, trả về đúng lập trường không chẩn đoán kể cả khi mất mạng.

**15. Demo mà mất mạng hoặc hết quota thì sao?**
Vẫn chạy. Không có API key thì route trả lời bằng `fallbackAnswer`, là nội dung tất định
soạn sẵn từ chính kết quả nghiên cứu. Đây là quyết định có chủ đích, ghi ở audit log
entry 014.

**16. AI có viết code trong repo này không?**
AI được dùng để liệt kê phương án và đánh đổi, phần code là nhóm tự viết, và mỗi quyết
định kiến trúc đều có dòng evidence dạng `file:line` trong audit log để đối chiếu.

## Nhóm D - Slide 19 và 20, kết luận

**17. Hạn chế lớn nhất của nghiên cứu là gì?**
Bản chất dữ liệu. BRFSS là **tự khai báo và cắt ngang**, nên mọi kết luận là liên hệ chứ
không phải nhân quả, và nhãn không đến từ HbA1c hay đường huyết lúc đói. Kể cả mô hình có
AUC cao hơn nữa thì hạn chế này vẫn không mất đi.

**18. Sao nói mẫu không đại diện toàn quốc trong khi n tới 253.680?**
Vì BRFSS có bộ trọng số khảo sát để hiệu chỉnh xác suất chọn mẫu và tỷ lệ không phản hồi,
mà nhóm em chưa áp trọng số đó. Cỡ mẫu lớn không thay thế được thiết kế chọn mẫu. Đây là
một trong năm hướng phát triển tiếp theo.

**19. Precision chỉ 30 phần trăm thì dùng thực tế được không?**
[LƯU Ý] Câu này để Khang trả lời trước, mình chỉ đỡ nếu Khang bí.
Ở vai trò sàng lọc bậc một thì được: mục đích là lọc ra nhóm cần đi xét nghiệm xác nhận,
không phải chẩn đoán. Nhưng nhóm em nói rõ mô hình chưa qua thẩm định lâm sàng.

**20. Bài học nào nhóm rút ra mà không có trong sách?**
Tính tái lập phải được thiết kế chứ không tự có. Ba thứ cụ thể nhóm em phải làm: cố định
seed, ghim phiên bản thư viện, và thêm một bước tự động kiểm tra output. Không có bước
thứ ba thì lỗi đọc trượt file ở H2 đã lọt vào báo cáo mà không ai biết.

## Bảng phân công nhanh nếu bị hỏi chéo

| Chủ đề câu hỏi | Người trả lời chính |
|---|---|
| SHAP, khung bốn nhóm, dashboard, trợ lý AI, cách dùng AI | **Nhân** |
| PR-AUC, SMOTE, ngưỡng 0,13, khoảng tin cậy, hiệu chỉnh, tuning | Khang |
| Effect size, OR, CholCheck, feature engineering, EDA, SQL | Đạt |

## Backup slide nên mở sẵn ở tab thứ hai

| Backup | Dùng khi bị hỏi |
|---|---|
| B1 - bảng effect size đủ 21 biến | "Còn các biến khác thì sao?" |
| B2 - bảng quét 99 ngưỡng | "Sao lại chọn đúng 0,13?" |
| B3 - đường hiệu chỉnh | "Xác suất mô hình đưa ra có tin được không?" |
| B4 - SHAP cục bộ cho ca âm tính | "Giải thích cho ca âm tính thì sao?" |
| B5 - từ điển dữ liệu | "Biến X nghĩa là gì?" |
| B7 - phân bố biến phân loại | "Phân bố các biến phân loại ra sao?" |
| AI audit log (file xlsx) | "Năm lần AI sai là những lần nào?" |
