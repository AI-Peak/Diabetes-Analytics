# Diabetes Analytics Dashboard - giải thích từng tab và từng card

Tài liệu này mô tả **toàn bộ giao diện** của web app trong thư mục `app/`: có những tab
nào, mỗi tab có những card nào, mỗi card nói lên điều gì, và **card đó được làm ra bằng
cách nào** từ dữ liệu gốc.

Đây là bản nội dung. Sau khi duyệt xong sẽ dùng làm nguồn để dựng file HTML có ảnh chụp
từng card kèm giải thích.

---

## 0. Luồng dữ liệu chung - đọc một lần, áp dụng cho mọi card

Mọi con số trên web đều đi qua đúng một đường ống, không có ngoại lệ:

```
run_pipeline.py  (Python: pandas, scipy, statsmodels, scikit-learn, XGBoost, SHAP)
        ↓  ghi ra
results/**/*.csv  +  results/modeling/model_selection.json
        ↓  đọc bởi
app/scripts/build-data.mjs   (Node, chạy bằng `npm run prepare-data`)
        ↓  ghi ra
app/data/generated/overview.json | rq1.json | rq2.json | rq3.json
        ↓  import tĩnh vào
app/src/lib/data/load.ts  →  parse bằng Zod schema (schemas.ts)
        ↓  props
React Server Component của từng trang  →  card
```

Bốn điều cần nhớ, vì chúng lặp lại ở mọi card bên dưới:

1. **Giao diện không tính toán lại bất cứ chỉ số thống kê hay ML nào.** Cái duy nhất
   trình duyệt tự tính là mấy phép cộng và chia hiển thị (ví dụ tỷ lệ của một cohort đã
   được gộp sẵn). Không có mô hình nào chạy trên trình duyệt.
2. **Zod chặn ở cửa.** `load.ts` gọi `Schema.parse()`, nên nếu JSON thiếu trường hoặc sai
   kiểu thì app ném lỗi ngay lúc load chứ không hiển thị số rác.
3. **Build tự kiểm tra chéo.** `build-data.mjs:458` và `:461` ném lỗi nếu cỡ mẫu holdout
   trong `model_selection.json` không khớp với `final_test_metrics.csv`, hoặc nếu
   development cộng holdout không ra đúng tổng dataset.
4. **Mọi card đều ghi nguồn ngay trên mặt card.** Dòng chữ nhỏ ở góc là tên file CSV hoặc
   JSON sinh ra nó, để người xem truy ngược được.

**Ba tầng lặp lại trên mọi trang:**

| Thành phần | Vị trí | Nội dung |
|---|---|---|
| **Sidebar** | trái, cố định | Logo, 5 mục điều hướng, khối "Data status" (records 253.680, build precomputed), link repo GitHub |
| **Topbar** | trên | Breadcrumb `Research / <tên trang>`, chip `BRFSS 2015 · cleaned`, nút chuyển theme sáng tối |
| **Disclaimer** | cuối sidebar, dưới khối Data status | `Research and education tool, not a diagnostic device. Association is not causation.` Nằm trong sidebar nên hiện ở **mọi trang**, không có nút tắt |

*Làm ra bằng cách nào:* Sidebar và Topbar đọc danh sách trang từ một hằng số duy nhất
(`src/lib/data/constants.ts:1`), nên thêm trang mới chỉ cần sửa một chỗ. Disclaimer là một
thẻ `<p className="footer-disclaimer">` cứng trong `Sidebar.tsx:61`. Vì Sidebar nằm trong
`AppShell` chứ không nằm trong nội dung của từng trang, không trang nào bỏ được nó và
không có tương tác nào tắt được nó.

Lưu ý về khả năng nhìn thấy trên mobile: từ 920px trở xuống, sidebar bị đẩy ra ngoài màn
hình (`transform: translateX(-105%)`) và chỉ hiện khi bấm nút menu. Nghĩa là **trên mobile,
disclaimer nằm trong khung điều hướng chứ không nằm trên mặt trang**. Đây là đánh đổi có
chủ đích, xem Phụ lục.

---

# TAB 1 - Overview (`/overview`)

Trang mặc định. Vào `/` sẽ tự chuyển hướng sang đây. Vai trò: trả lời "nghiên cứu này là
gì, dữ liệu bao nhiêu, kết quả chính ra sao" trong một màn hình.

## 1.1. Hero - tiêu đề nghiên cứu

**Hiển thị:** Eyebrow `Study overview`, tiêu đề "From population evidence to explainable
diabetes-risk screening", một câu tóm tắt CRISP-DM, và hai chip meta: `CDC BRFSS 2015` và
`SQL · Python · XGBoost · SHAP`.

**Vai trò:** Định vị ngay từ đầu rằng đây là nghiên cứu theo quy trình CRISP-DM, không
phải một demo model rời rạc.

**Làm ra bằng cách nào:** Component `PageHead`, nội dung viết cứng trong
`app/src/app/overview/page.tsx:17`. Bọc trong `Reveal` để có hiệu ứng xuất hiện dần khi
cuộn tới.

## 1.2. Khối "Study at a glance" - 4 thẻ KPI

| Thẻ | Giá trị | Ghi chú dưới thẻ |
|---|---|---|
| Records | 253.680 | `CDC BRFSS 2015 · cleaned` |
| Predictors | 21 | `Target · Diabetes_binary` |
| Prediabetes/Diabetes prevalence | 13,9% | số bản ghi dương tính |
| Holdout PR-AUC | 0,4238 | `XGBoost · locked holdout n=50.736 · CV PR-AUC 0,436` |

**Đọc thế nào:** Ba thẻ đầu mô tả dữ liệu, thẻ thứ tư là kết quả model. Thẻ thứ tư cố ý
ghi **hai** con số: PR-AUC trên holdout đã khóa (0,4238) và PR-AUC cross-validation
(0,436), để người xem không nhầm hai loại số này với nhau. Trước đây thẻ này hiện giá trị
CV nhưng dán nhãn "test n=50.736", và đó chính là lỗi đã được sửa trong đợt rà soát nhất
quán số liệu.

**Làm ra bằng cách nào:**
- Records, Predictors, prevalence: `build-data.mjs` hàm `datasetAnalytics()` đọc thẳng
  `data/processed/diabetes_cleaned.csv`, đếm số dòng, số cột và số bản ghi dương tính,
  ghi vào `overview.json` khối `dataset` + `classBalance`.
- Holdout PR-AUC: đọc `results/modeling/final_test_metrics.csv` (hàm `holdoutRows`), lấy
  đúng dòng ứng với ngưỡng đã chọn.
- CV PR-AUC: đọc `results/modeling/cv_model_comparison.csv`, lấy dòng có `isBest`.
- Component `KpiCard`, tham số `tone` quyết định màu viền: `risk` cho prevalence,
  `accent` cho PR-AUC.

## 1.3. Khối "Interactive cohort lab" - phòng lab lát cắt dân số

Đây là khối tương tác đầu tiên, gồm 4 phần con.

### 1.3.1. Thanh bộ lọc

**Hiển thị:** Bốn dropdown: Sex (All / Female / Male), Age group (13 nhóm tuổi từ 18-24
tới 80+), BMI band (Underweight / Healthy / Overweight / Obesity), Blood pressure (Any /
No high BP / High BP). Kèm nút "Reset filters" hiện số bộ lọc đang bật, và bị vô hiệu hoá
khi chưa lọc gì.

**Điểm kỹ thuật:** Trạng thái bộ lọc **nằm trong URL** chứ không nằm trong React state.
Chọn Female + tuổi 60-64 thì URL thành `?sex=0&age=9`. Nghĩa là copy link gửi cho người
khác thì họ mở ra thấy đúng lát cắt đó. Cài đặt ở `src/lib/use-url-state.ts`.

**Làm ra bằng cách nào:** Danh sách option viết cứng trong `CohortExplorer.tsx:14-49`
(khớp với mã hoá của BRFSS: Age 1-13, Sex 0/1). Hook `useUrlState` đọc và ghi query
string, kèm hàm validate để URL bịa bậy thì rơi về giá trị mặc định chứ không crash.

### 1.3.2. Dải 4 chỉ số tóm tắt cohort

**Hiển thị:** Cohort records / Diabetes prevalence / Population lift / Share of positive
cases.

**Đọc thế nào:** "Population lift" là tỷ lệ mắc của lát cắt chia cho tỷ lệ mắc toàn dân
số. Lift 2,5x nghĩa là nhóm này có tỷ lệ cao gấp 2,5 lần mặt bằng chung. "Share of
positive cases" cho biết nhóm này chiếm bao nhiêu phần trăm **tổng số ca dương tính**,
tức là đo mức độ đóng góp vào gánh nặng chứ không phải mức rủi ro.

**Bảo vệ thống kê có chủ đích:** Nếu lát cắt còn dưới 5 bản ghi thì mọi ước lượng bị
**che hoàn toàn** và hiện chữ "Suppressed". Nếu dưới 30 bản ghi thì vẫn hiện số nhưng bật
cảnh báo vàng "Small sample warning". Hai ngưỡng này khai báo ở
`CohortExplorer.tsx:11-12`.

**Làm ra bằng cách nào:** Trình duyệt cộng các ô của một **cohort cube** đã gộp sẵn.

### 1.3.3. Card "Age risk profile"

**Hiển thị:** Biểu đồ cột ngang, mỗi cột là một nhóm tuổi, giá trị là tỷ lệ mắc trong
nhóm đó **dưới các bộ lọc còn lại đang bật**. Bấm vào một cột thì cột đó trở thành bộ lọc
tuổi, và mọi thứ khác trên trang cập nhật theo.

**Đọc thế nào:** Cột màu cam là nhóm có dưới 30 bản ghi, tức số liệu không ổn định. Cột
đỏ là bình thường. Card này cho thấy tuổi là yếu tố mạnh, và mạnh **khác nhau** tuỳ theo
BMI hay huyết áp bạn đang lọc.

**Làm ra bằng cách nào:** Cột được tính lại trong `useMemo` mỗi khi bộ lọc đổi, từ chính
cohort cube. Biểu đồ là component `HBarChart` tự viết trên nền Recharts, có hỗ trợ chọn
bằng chuột và bằng bàn phím.

### 1.3.4. Card "Selected cohort vs population"

**Hiển thị:** Hai cặp cột: lát cắt đang chọn và toàn dân số, mỗi cặp chia thành "No
diabetes" và "Prediabetes or diabetes".

**Đọc thế nào:** Đây là cách nhìn trực quan nhất về lift: nếu dải đỏ của cohort dày hơn
hẳn dải đỏ của population thì nhóm đó rủi ro cao hơn mặt bằng.

**Ghi chú quan trọng in ngay dưới card:** "Selections are computed from 208 anonymous
aggregate cells; no person-level records are sent to the browser."

**Làm ra bằng cách nào:** Đây là điểm thiết kế đáng nói nhất của trang Overview.
`build-data.mjs` không gửi 253.680 dòng dữ liệu cá nhân xuống trình duyệt. Nó gộp trước
thành **208 ô tổng hợp** theo bốn chiều Sex × Age × BMI band × HighBP, mỗi ô chỉ chứa hai
số: tổng bản ghi `n` và số dương tính `positiveClassN`. Trình duyệt lọc và cộng các ô
này. Kết quả: payload nhỏ, phản hồi tức thì, và **không có dữ liệu cấp cá nhân nào rời
khỏi máy chủ**.

## 1.4. Khối "Evidence chain" - 3 thẻ dẫn sang RQ

**Hiển thị:** Ba thẻ bấm được, đánh số `01 / 03`, `02 / 03`, `03 / 03`. Mỗi thẻ gồm tiêu
đề câu hỏi, một câu phát hiện chính, mấy chip phương pháp, và link "Open RQ1/2/3".

Dưới ba thẻ có một dòng nối: "Each question builds on the last: identify evidence → test
prediction → inspect what the model learned."

**Vai trò:** Nói cho người xem biết ba trang RQ **không phải ba việc rời rạc** mà là một
chuỗi lập luận: tìm bằng chứng thống kê, kiểm tra xem bằng chứng đó có dự đoán được
không, rồi soi xem mô hình thực sự học được cái gì.

**Làm ra bằng cách nào:** Nội dung nằm ở khối `rqSummaries` trong `overview.json`, sinh
ra bởi `build-data.mjs`. Các con số trong câu phát hiện (13,9%, 81,0%, 0,71) được nội suy
từ chính kết quả pipeline chứ không gõ tay.

## 1.5. Khối "Method & data profile" - 2 card

### Card "CRISP-DM evidence pipeline"

**Hiển thị:** Dải 6 nút ngang: Business (3 research questions) → Data (SQL) → Preparation
(pandas) → Modeling (4 models) → Evaluation (PR-AUC) → Explainability (SHAP).

**Đọc thế nào:** Bước thứ sáu là điểm nhấn: giải thích được (explainability) được coi là
một đầu ra nghiên cứu chính thức, không phải phần phụ lục.

**Làm ra bằng cách nào:** Mảng `pipeline` trong `overview.json`, render thành các
`pipeline-node` bằng CSS grid.

### Card "Class balance"

**Hiển thị:** Một thanh ngang chia hai màu theo đúng tỷ lệ thật: 86,1% xanh (không ghi
nhận tiểu đường) và 13,9% đỏ (tiền tiểu đường hoặc tiểu đường), kèm chú giải có số bản
ghi tuyệt đối.

**Đọc thế nào:** Đây là card **thiết lập cho toàn bộ trang RQ2**. Nhìn thanh này là hiểu
ngay tại sao accuracy không dùng được: đoán bừa "không ai bị tiểu đường" đã được 86,1%
accuracy mà không phát hiện được ca nào.

**Làm ra bằng cách nào:** Hai số phần trăm điều khiển trực tiếp thuộc tính CSS `width`
của hai div, nên độ dài dải màu **đúng bằng tỷ lệ thật**, không phải hình vẽ ước lượng.

---

# TAB 2 - RQ1: Statistical Association (`/rq1`)

Trả lời: yếu tố nào có liên hệ với tiểu đường, và liên hệ đó có **đáng kể về mặt thực
chất** hay chỉ đáng kể về mặt thống kê.

## 2.1. Hero + 4 thẻ KPI "Effect-size summary"

| Thẻ | Nội dung |
|---|---|
| Categorical tested | 18 biến, `Chi-square + Cramér's V` |
| Numeric tested | 3 biến, `Welch t + Mann-Whitney` |
| Top Cramér's V | 0,299 `GenHlth` |
| Top Cohen's d | biến có hiệu ứng số lớn nhất (BMI) |

**Làm ra bằng cách nào:** Hai thẻ đầu chỉ là `.length` của hai mảng trong `rq1.json`. Hai
thẻ sau được tính ngay trong component bằng `toSorted()` trên trị tuyệt đối, tức là nếu
mai pipeline đổi kết quả thì thẻ tự đổi theo, không cần sửa code.

## 2.2. Callout "Large-N caution"

**Hiển thị:** Hộp cảnh báo màu vàng: "With N = 253,680, nearly all p-values are
approximately zero. Rank findings by **effect size**, not significance alone."

**Vì sao có:** Đây là **luận điểm phương pháp trung tâm của cả trang**. Với cỡ mẫu này,
p-value mất hoàn toàn khả năng phân biệt, mọi biến đều "có ý nghĩa". Nếu xếp hạng bằng
p-value thì kết luận sẽ vô nghĩa. Toàn bộ trang vì thế xếp hạng bằng effect size.

**Làm ra bằng cách nào:** Hiện có điều kiện, chỉ khi cờ `notes.largeN` trong `rq1.json`
bật. Cờ này do pipeline đặt, không phải người viết cứng vào giao diện.

## 2.3. Card "Linked categorical association explorer"

**Hiển thị:** Ba điều khiển ở trên:
- **Selected factor**: chọn 1 trong 18 biến phân loại
- **Rank by**: xếp hạng theo Cramér's V hoặc theo Max prevalence difference
- **Minimum Cramér's V**: slider 0 tới 0,25, lọc bỏ biến yếu

Dưới là biểu đồ cột ngang xếp hạng các biến còn lại. Bấm vào cột nào thì biến đó thành
biến đang chọn. Dưới cùng là dải chip: tên biến, mức diễn giải hiệu ứng, số bậc, số bản
ghi.

**Đọc thế nào:** Hai chế độ xếp hạng cho hai góc nhìn khác nhau. Cramér's V là độ mạnh
liên hệ chuẩn hoá. "Max prevalence difference" là chênh lệch tỷ lệ mắc tính bằng điểm
phần trăm giữa bậc cao nhất và bậc thấp nhất, dễ hiểu hơn với người không làm thống kê.
Đổi qua lại giữa hai chế độ sẽ thấy thứ hạng **không giống nhau**, và đó là một quan sát
có giá trị.

**Làm ra bằng cách nào:** Dữ liệu từ `results/statistical_analysis/chi_square_results.csv`
(Cramér's V, p, Holm p) được `build-data.mjs` **ghép** với tỷ lệ mắc theo từng bậc mà nó
tự gộp từ `diabetes_cleaned.csv`. Hai nguồn này gộp thành một mảng `categorical` duy nhất
trong `rq1.json`. Cả ba điều khiển đều đẩy trạng thái lên URL (`?factor=`, `?rank=`,
`?minV=`).

## 2.4. Card "Diabetes prevalence by \<biến\> level"

**Hiển thị:** Cột ngang cho từng bậc của biến đang chọn. Ví dụ chọn GenHlth thì thấy 5
bậc từ Excellent tới Poor. Bậc có tỷ lệ cao nhất được tô đỏ, còn lại màu xanh cyan. Hover
thấy chi tiết "x positive records of y".

**Đọc thế nào:** Đây là chỗ liên hệ thống kê trở nên **cụ thể**. Cramér's V 0,299 là con
số trừu tượng, còn "nhóm tự đánh giá sức khoẻ Poor có tỷ lệ mắc cao gấp nhiều lần nhóm
Excellent" thì ai cũng hiểu.

**Làm ra bằng cách nào:** Nhãn từng bậc được dịch từ mã số BRFSS sang chữ dễ đọc qua bảng
tra `LEVEL_LABELS` trong `build-data.mjs:73`. Ví dụ `GenHlth=1` thành "Excellent",
`Education=6` thành "College graduate". Không có bảng tra này thì biểu đồ chỉ hiện 1, 2,
3 và vô nghĩa với người xem.

## 2.5. Card "Selected factor profile"

**Hiển thị:** Dải 4 chỉ số (Cramér's V, Rate spread tính bằng điểm phần trăm, Highest
group, Lowest group), một khối văn xuôi tự sinh mô tả bậc cao nhất so với bậc thấp nhất,
và một callout nhắc "This is a bivariate association profile. It supports exploration but
does not estimate an adjusted or causal effect."

**Vai trò:** Ba card 2.3, 2.4, 2.5 **dùng chung một trạng thái**. Bấm cột ở card này thì
hai card kia đổi theo ngay. Đó là điểm "linked" mà tên card nhắc tới, và là thứ phân biệt
một dashboard thật với một bộ hình tĩnh xếp cạnh nhau.

**Làm ra bằng cách nào:** Câu văn xuôi được ghép chuỗi từ chính dữ liệu bậc, không viết
sẵn. Nghĩa là đổi biến nào cũng có mô tả đúng biến đó.

## 2.6. Card "Numeric variables: mean differences and effect sizes"

**Hiển thị:** Bảng 3 biến số liên tục (BMI, MentHlth, PhysHlth) với 7 cột: giá trị trung
bình nhóm không mắc, trung bình nhóm dương tính, chênh lệch, Cohen's d, trị tuyệt đối
rank-biserial, và một badge phân loại độ lớn (Large / Medium / Small / Negligible).

**Đọc thế nào:** Cột badge dùng ngưỡng quy ước của Cohen: 0,8 trở lên là Large, 0,5 là
Medium, 0,2 là Small. Chú ý là bảng báo cáo **hai** thước đo hiệu ứng: Cohen's d giả định
phân phối gần chuẩn, còn rank-biserial thì không. BMI và số ngày sức khoẻ kém đều lệch
mạnh, nên báo cáo cả hai là cách trung thực.

**Làm ra bằng cách nào:** Đọc thẳng `results/statistical_analysis/numerical_results.csv`.
Ngưỡng phân loại độ lớn nằm trong hàm `numericMagnitude` ở `Rq1Explorer.tsx:11`.

## 2.7. Card "BMI distribution by class"

**Hiển thị:** Ảnh boxplot xuất từ matplotlib, so sánh phân bố BMI giữa hai lớp.

**Vì sao vẫn giữ ảnh tĩnh:** Vì phân bố đầy đủ cần dữ liệu cấp cá nhân, mà nguyên tắc của
app là không gửi dữ liệu cá nhân xuống trình duyệt. Boxplot đã tóm tắt sẵn nên là dạng
xuất phù hợp. Card ghi rõ nó là "supporting evidence", không phải đường đọc chính.

**Làm ra bằng cách nào:** `build-data.mjs` **copy** file PNG từ `docs/figures/` sang
`app/public/figures/` trong lúc build, nên ảnh trên web luôn là ảnh mới nhất do pipeline
sinh ra, không phải bản chép tay có nguy cơ lạc hậu. Dùng `next/image` với `width` và
`height` khai báo cứng để không bị nhảy layout lúc tải.

## 2.8. Card "Odds ratios from the 21-predictor logistic regression"

**Hiển thị:** Bảng đủ 21 biến, 6 cột: Variable, Adjusted OR, 95% CI, VIF, Holm p, và
badge "Significant / Not significant". Dưới bảng có một dòng tự sinh nêu VIF cao nhất.

**Đọc thế nào:** Đây là card **quan trọng nhất trang RQ1**, và cũng dễ bị bỏ qua nhất.
Toàn bộ phần explorer phía trên là **đơn biến**: mỗi biến xét riêng lẻ. Bảng này là **đa
biến**: mỗi biến đã được hiệu chỉnh cho 20 biến còn lại. So sánh hai bên sẽ lộ ra những
biến chỉ mạnh vì mang thông tin chung với biến khác. Cụ thể AnyHealthcare, NoDocbcCost,
Smoker và Veggies **mất ý nghĩa** sau khi hiệu chỉnh, và chỉ mô hình đa biến mới cho thấy
điều đó.

Khoảng tin cậy chứa giá trị 1 nghĩa là không kết luận được chiều tác động. Cột VIF kiểm
tra đa cộng tuyến: cao nhất là 1,80, dưới ngưỡng quy ước 5, nên các ước lượng không bị
bất ổn vì biến trùng lặp thông tin.

**Làm ra bằng cách nào:** Từ `results/statistical_analysis/adjusted_association.csv`, do
statsmodels sinh ra. Cột Holm p có xử lý riêng: giá trị 0 hiển thị thành `<1e-300` chứ
không hiện "0", vì viết 0 là sai về mặt toán học. Câu về VIF được sinh động từ dòng có
VIF lớn nhất, nên đổi dữ liệu thì câu tự đổi.

---

# TAB 3 - RQ2: Prediction & Threshold (`/rq2`)

Trả lời: mô hình nào đáng tin trên dữ liệu mất cân bằng, và ngưỡng quyết định nào phù hợp
cho bối cảnh sàng lọc.

Trang này có một **nguyên tắc trình bày** xuyên suốt: luôn ghi rõ mỗi con số được tính
trên tập nào. Nhầm lẫn giữa số cross-validation và số holdout là lỗi phổ biến nhất trong
báo cáo ML sinh viên.

## 3.1. Khối "Final result on the untouched holdout" - 4 thẻ KPI

| Thẻ | Giá trị | Ghi chú |
|---|---|---|
| Winner | XGBoost | `Selected by CV PR-AUC 0.436` |
| Holdout recall @ 0.13 | 81,0% | `1.344 missed positives, down from 5.900 at t=0.50` |
| Holdout PR-AUC | 0,4238 | `ROC-AUC 0.8272 · n=50.736` |
| Holdout precision @ 0.13 | 29,9% | `12.491 false alarms accepted` |

**Đọc thế nào:** Bốn thẻ này là **con số headline của cả báo cáo**. Cặp thẻ 2 và 4 cố ý
đặt cạnh nhau để không ai đọc recall mà quên precision: đổi lấy 81% recall thì phải chấp
nhận 12.491 báo động nhầm. Đó là sự đánh đổi, không phải chiến thắng miễn phí.

**Làm ra bằng cách nào:** Từ `results/modeling/final_test_metrics.csv`, hàm `holdoutRows`
tách ra hai kịch bản: ngưỡng mặc định 0,50 và ngưỡng đã chọn 0,13, mỗi kịch bản kèm ma
trận nhầm lẫn đầy đủ. Nhờ vậy ghi chú "down from 5.900" được tính từ dữ liệu chứ không gõ
tay.

## 3.2. Card "Probability calibration on the same holdout"

**Hiển thị:** Ba chỉ số: Brier score 0,0974 (thấp hơn là tốt hơn), Calibration slope
0,959 (lý tưởng 1,00), Calibration intercept (lý tưởng 0,00).

**Đọc thế nào:** Đây là card mà **rất ít bài sinh viên có**. AUC chỉ nói mô hình xếp hạng
đúng thứ tự. Hiệu chỉnh nói xác suất đọc được như mức rủi ro thật hay không. Slope 0,959
gần 1 nghĩa là khi mô hình nói "20% rủi ro" thì trong thực tế nhóm đó mắc khoảng 20%.
Không có card này thì không ai được phép diễn giải output như một xác suất.

Card ghi thêm "No recalibration was applied", tức con số này là tính chất tự nhiên của mô
hình chứ không phải kết quả của một bước hiệu chỉnh hậu kỳ.

**Làm ra bằng cách nào:** Đọc `results/modeling/calibration_metrics.csv`, một dòng duy
nhất, ba trường.

## 3.3. Callout "Read the split labels"

**Hiển thị:** Hộp nhắc: mọi thứ **phía trên** là trên holdout đã khóa (n=50.736), mọi
panel **phía dưới** là trên development set (n=202.944).

**Vì sao có:** Vì chọn model và chọn ngưỡng **không bao giờ được đụng vào holdout**. Nếu
chọn ngưỡng trên tập test thì con số báo cáo bị thổi phồng. Callout này là chỗ app tự
tuyên bố nó không phạm lỗi đó, và tuyên bố ngay giữa trang chứ không giấu trong phụ lục.

**Làm ra bằng cách nào:** Hai cỡ mẫu được nội suy từ `data.splits`, cùng nguồn với các
assert trong `build-data.mjs`. Nghĩa là nếu số này sai thì build đã fail từ trước.

## 3.4. Khối "Development-set selection evidence" - 4 thẻ KPI

| Thẻ | Ý nghĩa |
|---|---|
| CV winner PR-AUC | 0,4359, ghi rõ `5-fold cross-validation on the development set` |
| OOF accuracy @ 0.50 | accuracy cao nhưng recall chỉ khoảng 16,5% |
| OOF recall @ 0.13 | recall sau khi chỉnh ngưỡng, kèm số false negative |
| OOF F1 @ 0.13 | F1 mới so với F1 ở ngưỡng 0,50 |

**Đọc thế nào:** Cặp thẻ 2 và 3 chính là **lập luận trung tâm của RQ2**. Ở ngưỡng mặc
định, mô hình có accuracy đẹp nhưng bỏ sót hơn 8 trong 10 ca dương tính. Đó là bằng chứng
cho thấy accuracy là mục tiêu sai trong bối cảnh này.

Mọi thẻ đều có ghi chú `Development out-of-fold`, không thẻ nào để trống nhãn tập.

**Làm ra bằng cách nào:** Từ `results/modeling/threshold_analysis.csv`, hai dòng ứng với
t=0,50 và t=0,13 được `build-data.mjs` đánh dấu thành `highlights.default` và
`highlights.optimized`. Ngưỡng 0,13 không viết cứng: nó đọc từ
`model_selection.json` trường `selected_threshold`, và nếu không tìm được dòng khớp thì
lấy dòng gần nhất.

## 3.5. Card "Model scorecard, ranked by \<metric\>"

**Hiển thị:** Nhóm nút radio chọn chỉ số xếp hạng (PR-AUC, ROC-AUC, Recall, Precision,
F1, Accuracy). Bảng 4 mô hình với 8 cột, cột đang xếp hạng được **in đậm**, dòng thắng có
badge "best PR-AUC" và nền nổi bật. Bấm vào một dòng thì dòng đó được chọn, và câu tóm
tắt bên dưới đổi theo.

**Đọc thế nào:** Đây là card tương tác có sức thuyết phục cao nhất trang. Đổi sang xếp
theo **Accuracy** thì XGBoost có thể **không** đứng đầu, và người xem tự thấy tại sao
chọn chỉ số nào lại quan trọng đến thế. Nhóm chọn PR-AUC vì nó tập trung vào lớp thiểu
số, còn accuracy thì bị lớp đa số 86% chi phối.

**Làm ra bằng cách nào:** Từ `results/modeling/cv_model_comparison.csv`. Bảng không dùng
biểu đồ thứ hai để thể hiện thứ hạng, thay vào đó sắp xếp lại chính bảng và in đậm cột
đang xét, giữ mọi con số vẫn đọc được cùng lúc. Cả chỉ số lẫn model đang chọn đều lưu
trên URL (`?metric=`, `?model=`).

## 3.6. Card "Decision-threshold explorer"

**Hiển thị:** Slider chạy qua các ngưỡng, hai nút tắt "Default 0.50" và "Screening 0.13",
dải 4 chỉ số (Precision, Recall, F1, Accuracy) cập nhật tức thì, và biểu đồ đường
precision-recall theo ngưỡng có đường dọc đánh dấu vị trí hiện tại. Bấm thẳng vào biểu đồ
cũng chọn được ngưỡng.

**Đọc thế nào:** Đây là **card ngôi sao của cả website**. Kéo slider sang trái thì recall
tăng, precision giảm, và người xem cảm nhận được sự đánh đổi bằng tay chứ không phải đọc
qua một bảng. Callout dưới card chốt lại luận điểm: trong sàng lọc sớm, false negative là
loại sai đắt hơn.

**Làm ra bằng cách nào:** Toàn bộ **99 mức ngưỡng đã được quét sẵn** trong pipeline Python
và xuất ra `threshold_analysis.csv`. Slider chỉ đang **tra bảng theo chỉ số dòng**, không
có mô hình nào chạy trên trình duyệt. Đây chính là ranh giới "UI không được tính lại chỉ
số" thể hiện bằng code.

Ghi chú: phụ đề card hiện ghi "19 precomputed thresholds" nhưng dữ liệu thực tế có 99
dòng. Xem mục Phụ lục cuối tài liệu.

## 3.7. Card "Confusion matrix · t=\<ngưỡng\>"

**Hiển thị:** Lưới 2×2: True negative, False positive, False negative, True positive.
Tiêu đề card đổi theo ngưỡng đang chọn. Ô false negative được **tô nhấn màu rủi ro**, hai
ô đúng tô màu trung tính, kèm chú giải.

**Đọc thế nào:** Thiết kế cố ý không đối xử với bốn ô như nhau. Trong sàng lọc, false
negative là người có nguy cơ nhưng bị cho về, còn false positive chỉ là người phải đi xét
nghiệm thêm. Việc tô màu là **một tuyên bố về giá trị**, và card nói thẳng điều đó thay
vì giấu.

**Làm ra bằng cách nào:** Cùng một dòng dữ liệu với card 3.6, chỉ khác cách trình bày.
Hai card chia sẻ chung state ngưỡng qua URL, nên chúng không bao giờ lệch nhau.

## 3.8. Card "Reproducibility exports"

**Hiển thị:** Hai tab ảnh: "Holdout ROC and PR" và "Threshold sweep". Mỗi lần chỉ hiện
một tab.

**Vì sao có:** Vì pipeline không xuất dữ liệu điểm của đường cong ra CSV, nên không vẽ
lại được bằng Recharts. Card nói thẳng đây là "archival artifacts rather than the primary
reading path".

**Vì sao dùng tab thay vì xếp chồng:** Bốn ảnh matplotlib xếp dọc chiếm rất nhiều chiều
cao mà người xem chỉ nhìn một cái tại một thời điểm. Dùng tab thì cả khối chỉ tốn chiều
cao của một hình.

**Làm ra bằng cách nào:** Component `FigureTabs`, mỗi ảnh khai báo sẵn `width`/`height`
thật để `next/image` giữ chỗ đúng tỷ lệ và không gây nhảy layout. Caption của mỗi ảnh ghi
rõ nó thuộc tập nào và cỡ mẫu bao nhiêu.

---

# TAB 4 - RQ3: Explainable AI (`/rq3`)

Trả lời: giải thích SHAP của XGBoost có nhất quán với bằng chứng thống kê cổ điển hay
không. Nói cách khác: mô hình có học được cấu trúc dịch tễ đáng tin, hay chỉ học được mẹo
vặt trong dữ liệu.

## 4.1. Khối "Global importance summary" - 4 thẻ KPI

**Hiển thị:** Bốn biến dẫn đầu theo SHAP: `SHAP rank #1 GenHlth (0.638)`, `#2 HighBP
(0.526)`, `#3 Age (0.399)`, `#4 BMI (0.398)`.

**Chi tiết đáng chú ý:** Thẻ BMI có ghi chú thêm `Stat #1 / SHAP #4` và được tô màu rủi
ro. Đây là một **điểm lệch được chủ động phơi bày ngay đầu trang** chứ không giấu: BMI
đứng số một về hiệu ứng thống kê nhưng chỉ xếp thứ tư trong mô hình.

**Làm ra bằng cách nào:** Bốn phần tử đầu của mảng `features` trong `rq3.json`, sinh từ
`results/xai/explanation_consistency.csv`.

## 4.2. Card "Linked SHAP importance ranking"

**Hiển thị:** Cột ngang mean|SHAP| cho các biến, tô màu theo nhóm nhất quán. Bấm vào cột
để chọn biến.

Phía trên có hai điều khiển dùng chung cho cả khối: nhóm nút radio lọc theo consistency
group (All / Group 1 / Group 2 / Group 3 / Group 4) và dropdown sắp xếp (SHAP rank / Stat
rank / Largest rank gap).

**Đọc thế nào:** Chế độ "Largest rank gap" là chế độ đáng dùng nhất: nó đẩy lên đầu những
biến mà SHAP và thống kê **bất đồng nhất**, tức là chỗ có thông tin.

**Làm ra bằng cách nào:** Từ `explanation_consistency.csv`, gồm mean|SHAP|, thứ hạng SHAP,
thứ hạng effect size, loại effect size, và nhãn nhóm.

## 4.3. Card "Rank agreement map"

**Hiển thị:** Biểu đồ tán xạ, trục hoành là thứ hạng thống kê, trục tung là thứ hạng
SHAP, mỗi điểm là một biến. Bấm vào điểm để chọn biến.

**Đọc thế nào:** Điểm nằm gần đường chéo nghĩa là hai cách xếp hạng đồng thuận. Điểm càng
xa đường chéo càng bất đồng. Đây là cách nhìn trực quan cho con số Spearman 0,71: đủ để
thấy xu hướng chung, nhưng phân tán rõ ràng chứ không phải trùng khít.

**Làm ra bằng cách nào:** Component `RankScatter` tự viết. Nó **liên kết hai chiều** với
bảng, biểu đồ cột và khối profile: bấm ở đâu cũng cập nhật cả bốn nơi.

## 4.4. Khối "Selected feature" - profile biến đang chọn

**Hiển thị:** Tên biến, nhãn tiếng Anh đầy đủ, nhóm nhất quán, và 4 chỉ số: mean|SHAP|,
SHAP rank, Stat rank, Rank gap.

**Vai trò:** Là trung tâm liên kết của cả trang. Ba cách chọn biến (bảng, cột, tán xạ)
đều đổ về đây.

## 4.5. Bảng "Interactive feature table"

**Hiển thị:** Bảng 7 cột đủ 21 biến: Feature, mean|SHAP|, SHAP rank, Stat rank, Rank gap,
Effect size kèm loại, và badge Consistency group. Header dính khi cuộn. Ba dòng BMI, Age,
DiffWalk có class `clash-row` để đánh dấu là các trường hợp bất đồng đáng chú ý.

**Đọc thế nào:** Cột "Effect size" ghi kèm **loại** thước đo (Cramér's V hay
rank-biserial) vì hai loại không so sánh trực tiếp được với nhau, chỉ so sánh trong cùng
loại.

## 4.6. Bốn thẻ nhóm nhất quán

**Hiển thị:** Bốn thẻ ứng với bốn nhóm, mỗi thẻ liệt kê các biến thành viên dưới dạng
chip:

| Nhóm | Số biến | Nghĩa |
|---|---|---|
| Group 1 - Consistent high evidence | 9 | Mạnh cả về thống kê lẫn trong mô hình |
| Group 2 - Meaningful marginal, lower model salience | 7 | Liên hệ đơn biến đáng kể nhưng SHAP xếp thấp |
| Group 3 - Model-salient, weak marginal | 1 (Sex) | SHAP xếp cao nhưng liên hệ đơn biến yếu |
| Group 4 - Weak evidence | 4 | Yếu ở cả hai phía |

**Vì sao quan trọng:** Đây là **đóng góp phương pháp riêng của nhóm**, không phải thứ có
sẵn trong thư viện SHAP. Thay vì hỏi câu nhị phân "SHAP có khớp thống kê không", khung
này biến câu hỏi thành hai trục liên tục và làm cho **sự bất đồng trở nên có ý nghĩa**.
Nhóm 3 chỉ có Sex là ví dụ đắt nhất: nhìn hai biến thì gần như vô dụng, nhưng trong mô
hình đa biến thì nó đóng góp có điều kiện.

**Làm ra bằng cách nào:** `build-data.mjs` gom các biến theo cột `Consistency_Group` của
`explanation_consistency.csv`. Ngưỡng phân nhóm do pipeline Python đặt: trục thống kê
dùng Cramér's V ≥ 0,05 hoặc |rank-biserial| ≥ 0,10, trục mô hình dùng top-10 mean|SHAP|.

Ghi chú: hiện đoạn mô tả dưới tiêu đề của bốn thẻ này đang hiển thị sai. Xem Phụ lục.

## 4.7. Card "How closely do SHAP ranks and statistical effect-size ranks agree?"

**Hiển thị:** Ba chỉ số tổng hợp (Spearman 0,7098 / Top-10 Jaccard 0,5385 / Features
compared 21), rồi một bảng độ trùng lặp theo ba mức cắt:

| Cutoff | Overlap vs univariate | Jaccard | Overlap vs adjusted OR | Jaccard |
|---|---|---|---|---|
| Top-5 | 4 / 5 | 0,6667 | 3 / 5 | 0,4286 |
| Top-10 | 7 / 10 | 0,5385 | 7 / 10 | 0,5385 |
| Top-15 | 13 / 15 | 0,7222 | 11 / 15 | 0,5789 |

Dưới bảng có một câu tự sinh: độ trùng tăng từ 4/5 lên 13/15 khi nới mức cắt.

**Đọc thế nào:** Đây là **câu trả lời định lượng cho RQ3**. Bảng cho thấy hai cách xếp
hạng đồng thuận về **biến nào quan trọng** hơn là về **thứ tự chính xác**. Và bảng so
sánh SHAP với **hai** chuẩn khác nhau: thứ hạng đơn biến và thứ hạng odds ratio đã hiệu
chỉnh, nên kết luận không phụ thuộc vào một cách xếp hạng duy nhất.

Câu cuối card nói rõ giới hạn: "This is evidence alignment, not clinical or statistical
validation of SHAP."

**Làm ra bằng cách nào:** Từ `results/xai/rank_sensitivity_analysis.csv`. Riêng hệ số
Spearman được `build-data.mjs` **tự tính lại** bằng hàm `midranks` + `pearson`
(`build-data.mjs:361,375`), tức tương quan Pearson trên thứ hạng có xử lý đồng hạng. Đây
là ngoại lệ hiếm hoi so với nguyên tắc "không tính lại", và lý do là để có một phép kiểm
tra chéo độc lập với con số Python xuất ra.

## 4.8. Card "Reproducibility exports" - 4 tab ảnh SHAP

| Tab | Ảnh | Vai trò |
|---|---|---|
| Global ranking | `shap_summary_bar.png` | Xếp hạng mean|SHAP| dạng cột, cách đọc đơn giản nhất |
| Global beeswarm | `shap_summary_dot.png` | Thêm **hướng** tác động, thứ mà bảng xếp hạng trị tuyệt đối không thể hiện được |
| Local · positive case | `shap_local_diabetic.png` | Vì sao **một** hồ sơ cụ thể bị đẩy về phía lớp dương |
| Local · negative case | `shap_local_healthy.png` | Bằng chứng cũng có thể đẩy ngược ra xa lớp dương |

**Đọc thế nào:** Hai tab đầu là giải thích **toàn cục** (mô hình nhìn chung học gì), hai
tab sau là giải thích **cục bộ** (một hồ sơ cụ thể vì sao có kết quả đó). Có đủ cả hai
cấp mới là giải thích được hoàn chỉnh. Caption của tab local ghi rõ "Not a diagnosis".

---

# TAB 5 - AI Assistant (`/assistant`)

Trợ lý hỏi đáp được **neo vào kết quả nghiên cứu**. Nó trả lời câu hỏi về chính nghiên cứu
này, bằng chính số liệu của nghiên cứu này.

## 5.1. Hero

**Hiển thị:** "Ask the evidence, not a generic chatbot", cùng ba chip: `Grounded context`,
`vi / en`, `No medical advice`.

## 5.2. Khung chat

**Hiển thị:** Luồng tin nhắn, mỗi tin có nhãn "Study assistant" hoặc "You". Tin nhắn chào
mặc định bằng tiếng Việt, nêu rõ phạm vi trả lời. Trong lúc chờ có dòng "Đang đối chiếu
context nghiên cứu…". Ô nhập ở dưới, nút gửi bị vô hiệu hoá khi ô trống hoặc đang gửi.

**Chi tiết đáng nói:** Nếu câu trả lời đến từ **fallback offline** thì dưới tin nhắn hiện
nhãn nhỏ `offline sample · grounded deterministic response`. Nghĩa là người xem luôn biết
mình đang nói chuyện với model thật hay với nội dung soạn sẵn. App không giả vờ.

**Làm ra bằng cách nào:** Component client gọi `POST /api/chat`, gửi kèm **tối đa 10 tin
gần nhất** để giữ ngữ cảnh mà không phình token.

## 5.3. Panel "Suggested questions"

**Hiển thị:** Danh sách câu hỏi bấm được, gửi thẳng chứ không cần gõ. Ví dụ "Why was
threshold 0.13 chosen?", "Do SHAP rankings agree with the statistics?".

**Vai trò:** Vừa là lối vào cho người dùng mới, vừa là **kịch bản demo an toàn** lúc bảo
vệ: bấm một nút là ra câu trả lời đã biết trước, không phụ thuộc vào việc gõ đúng.

**Làm ra bằng cách nào:** Mảng hằng trong `src/lib/ai/suggested-prompts.ts`.

## 5.4. Callout "Research assistant"

**Hiển thị:** "Not medical advice. No personalized diagnosis." Cố định trong panel, tách
riêng khỏi disclaimer ở sidebar. Đây là **lớp cảnh báo thứ hai**, đặt ngay cạnh chỗ người
dùng gõ câu hỏi, vì đó là nơi dễ hiểu nhầm nhất rằng trợ lý đang tư vấn y tế.

## 5.5. Bốn lớp bảo vệ ở phía sau - phần không nhìn thấy trên giao diện

Đây là phần cần giải thích khi trình bày, vì nó không hiện ra thành card:

1. **Ngữ cảnh được neo.** `src/lib/ai/system-instruction.ts` nạp kết quả thật của nghiên
   cứu vào system instruction, nên trợ lý trả lời từ dữ liệu có sẵn chứ không suy đoán.
2. **Ép quy ước thuật ngữ.** Bắt buộc dùng "no reported diabetes" và "prediabetes or
   diabetes", **cấm** dùng "healthy" và "diabetic", vì nhãn là tự khai báo chứ không phải
   chẩn đoán lâm sàng.
3. **Fallback tất định.** Không có API key thì `fallback.ts` trả lời bằng nội dung soạn
   sẵn từ chính kết quả nghiên cứu. Demo không phụ thuộc vào mạng hay quota.
4. **Giới hạn cứng ở tầng route.** Tối đa 12 tin mỗi request, mỗi tin tối đa 2000 ký tự,
   request sai cấu trúc bị chặn trước khi tới model (`api/chat/route.ts:17,23,45-48`).

Model đang dùng: **Gemini 2.5 Flash**, gọi thẳng qua REST endpoint chứ không qua SDK của
hãng, để đổi nhà cung cấp chỉ cần đổi base URL.

---

# Phụ lục - các chỗ lệch đã phát hiện

## Đã sửa

Hai lỗi dưới đây phát hiện trong lúc rà soát để viết tài liệu này, đã sửa trong commit
`fix(rq3): key consistency-group cards by group number`. Giữ lại ở đây để làm bối cảnh.

**1. Bốn thẻ nhóm ở trang RQ3 từng hiện chung một đoạn mô tả sai.**
`app/src/app/rq3/page.tsx:57-60` kiểm tra `group.key === "strong-agreement"` và
`"under-represented"`, nhưng key thực tế trong `rq3.json` đã đổi thành
`"group-1-consistent-high-evidence"`, `"group-2-..."` và tương tự. Không key nào khớp,
nên **cả bốn thẻ** đều rơi vào nhánh else và hiển thị đoạn mô tả dành riêng cho Group 2:
"Univariate effects remain significant but receive lower multivariate SHAP rank...". Ngoài
ra mọi chip đều bị tô cùng một màu và không thẻ nào nhận class `under`.

**2. Phụ đề của threshold explorer ghi sai số ngưỡng.**
`ThresholdExplorer.tsx:23` ghi "19 precomputed thresholds", nhưng `rq2.json` chứa **99**
dòng ngưỡng. Con số 19 là dấu vết của phiên bản cũ. Giờ đếm động từ `data.thresholds.length`.

## Đã chốt - disclaimer chuyển từ banner đầu trang vào sidebar

Không phải lỗi. Đây là một quyết định thiết kế có chủ đích, thực hiện trong commit
`c99eb97 fix(dashboard): tighten analytics layout`, cùng đợt siết mật độ bố cục.

| | Trước | Sau (hiện tại) |
|---|---|---|
| Vị trí | Đầu vùng nội dung, dưới topbar | Cuối sidebar, dưới khối Data status |
| Component | `DisclaimerBanner.tsx`, render trong `AppShell` | `<p>` cứng trong `Sidebar.tsx:61` |
| Class | `.disclaimer-banner` | `.footer-disclaimer` |
| Chữ | `Research only` + câu cảnh báo | Chỉ câu cảnh báo |
| Desktop | Luôn thấy | Luôn thấy |
| Mobile (≤920px) | Luôn thấy | Thấy sau khi mở menu điều hướng |

Lý do đánh đổi: dải banner chiếm một khoảng chiều cao cố định ở đầu mọi trang, và khi bố
cục được siết lại cho gọn thì nó trở thành phần tốn chỗ nhất mà không mang thông tin thay
đổi theo trang. Chuyển vào sidebar thì vẫn giữ được tính chất **có ở mọi route và không có
nút tắt**, vì sidebar nằm trong `AppShell` chứ không nằm trong nội dung trang.

Hệ quả cần biết khi thuyết trình: từ 920px trở xuống, `.sidebar` nhận
`transform: translateX(-105%)` và chỉ trượt vào khi có class `.open`
(`globals.css:1645-1657`). Nên trên mobile, cảnh báo nằm trong khung điều hướng chứ không
nằm trên mặt trang. Cách diễn đạt đúng là **"hiển thị cố định trong khung điều hướng, ở
mọi trang, không có nút tắt"**, đừng nói "hiển thị trên mọi trang" mà không nói rõ vị trí.

Ở trang `/assistant` vẫn còn một cảnh báo thứ hai đặt ngay cạnh ô nhập câu hỏi
("Not medical advice. No personalized diagnosis."), và cảnh báo đó nằm trong nội dung
trang nên hiện đầy đủ ở mọi kích thước màn hình. Xem mục 5.4.
