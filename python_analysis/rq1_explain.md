# Module Phân tích Python: Kiểm định Giả thuyết Thống kê (RQ1)

Thư mục này chứa mã nguồn Python giải quyết **Câu hỏi Nghiên cứu 1 (RQ1)**:
> *"Những yếu tố nhân khẩu học, lối sống và liên quan đến sức khỏe nào có mối liên quan có ý nghĩa thống kê với bệnh tiểu đường trong tập dữ liệu CDC BRFSS 2015?"*

Giai đoạn này tuân theo quy trình CRISP-DM, kết hợp suy luận thống kê và phân tích khám phá trước khi thực hiện mô hình hóa học máy.

---

## 1. Cơ sở Toán học và Thống kê

Để hiểu mối quan hệ giữa các chỉ số sức khỏe và nguy cơ mắc bệnh tiểu đường, chúng tôi sử dụng một số kiểm định giả thuyết thống kê tùy thuộc vào kiểu dữ liệu của biến.

### 1.1 Kiểm định Chi-Square về tính độc lập (Biến phân loại)
Đối với các biến nhị phân và biến thứ tự, chúng tôi đánh giá mối liên quan của chúng với `Diabetes_binary` bằng bảng chéo (contingency table). Gọi $O_{ij}$ là tần số quan sát được ở hàng $i$ và cột $j$, và $E_{ij}$ là tần số kỳ vọng dưới giả thuyết không ($H_0$) về tính độc lập:

$$E_{ij} = \frac{\sum_{k} O_{ik} \cdot \sum_{k} O_{kj}}{N}$$

Thống kê Chi-Square được tính như sau:

$$\chi^2 = \sum_{i} \sum_{j} \frac{(O_{ij} - E_{ij})^2}{E_{ij}}$$

*   **Giả thuyết Không ($H_0$)**: Chỉ số sức khỏe (ví dụ: `HighBP`) và tình trạng tiểu đường độc lập với nhau (không liên quan).
*   **Giả thuyết Đối ($H_1$)**: Chỉ số sức khỏe và tình trạng tiểu đường có mối liên quan với nhau (không độc lập).

### 1.2 Hệ số Cramér's V (Kích thước ảnh hưởng đối với biến phân loại)
Vì kích thước mẫu lớn (*N* = 229,474) dễ làm phóng đại giá trị thống kê $\chi^2$ và dẫn đến các giá trị p-value cực kỳ nhỏ (thường $p < 0.05$ ngay cả đối với các mối liên quan rất yếu không đáng kể thực tế), chúng tôi tính toán **Cramér's V** để đo lường mức độ liên quan thực tế:

$$V = \sqrt{\frac{\chi^2}{N \cdot (k - 1)}}$$

Trong đó $N$ là kích thước mẫu, và $k = \min(r, c)$. Trong trường hợp của chúng tôi, biến mục tiêu `Diabetes_binary` có 2 nhóm ($r=2$), do đó $k - 1 = 1$, công thức được đơn giản hóa thành:

$$V = \sqrt{\frac{\chi^2}{N}}$$

**Thang đo diễn giải Cramér's V (đối với độ tự do $df = 1$):**
*   $V < 0.05$: Không đáng kể (Negligible)
*   $0.05 \le V < 0.10$: Yếu / Rất nhỏ (Weak / Very Small)
*   $0.10 \le V < 0.20$: Nhỏ (Small)
*   $0.20 \le V < 0.30$: Trung bình (Moderate)
*   $V \ge 0.30$: Mạnh (Strong)

---

### 1.3 Kiểm định t-Test độc lập hai mẫu (Welch's t-Test)
Đối với các biến liên tục/số (`BMI`, `MentHlth`, `PhysHlth`), chúng tôi so sánh giá trị trung bình của nhóm khỏe mạnh ($X_1$) và nhóm tiểu đường ($X_2$). Vì phương sai giữa hai nhóm và kích thước mẫu khác nhau, chúng tôi sử dụng kiểm định Welch's t-test:

$$t = \frac{\bar{X}_1 - \bar{X}_2}{\sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}}}$$

Trong đó $\bar{X}_i$ là trung bình mẫu, $s_i$ là độ lệch chuẩn mẫu, và $n_i$ là kích thước mẫu của nhóm tương ứng.

### 1.4 Hệ số Cohen's d (Kích thước ảnh hưởng tham số)
Cohen's d đo lường sự khác biệt chuẩn hóa giữa hai giá trị trung bình:

$$d = \frac{\bar{X}_1 - \bar{X}_2}{s_p}$$

Trong đó độ lệch chuẩn gộp (pooled standard deviation) $s_p$ được định nghĩa là:

$$s_p = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}}$$

**Thang đo diễn giải Cohen's d:**
*   $|d| < 0.2$: Không đáng kể (Negligible)
*   $0.2 \le |d| < 0.5$: Nhỏ (Small)
*   $0.5 \le |d| < 0.8$: Trung bình (Medium)
*   $|d| \ge 0.8$: Lớn (Large)

---

### 1.5 Kiểm định Mann-Whitney U (So sánh phi tham số)
Bởi vì các biến `BMI`, `MentHlth` và `PhysHlth` có độ lệch lớn và phân phối không chuẩn (đặc biệt là các ngày sức khỏe kém có nhiều giá trị bằng 0), các giả định của kiểm định t-test tham số bị vi phạm. Kiểm định phi tham số **Mann-Whitney U** được chọn làm kiểm định chính vì nó so sánh phân phối/hạng của dữ liệu thay vì giá trị trung bình.

Các quan sát từ cả hai mẫu được kết hợp và xếp hạng cùng nhau. Thống kê U cho mẫu 1 là:

$$U_1 = R_1 - \frac{n_1(n_1 + 1)}{2}$$

Trong đó $R_1$ là tổng thứ hạng của mẫu 1.

### 1.6 Kích thước ảnh hưởng đối với kiểm định Mann-Whitney U
1.  **Common Language Effect Size (CLES)**: Xác suất một cá nhân được chọn ngẫu nhiên từ nhóm tiểu đường có giá trị (ví dụ: BMI) cao hơn một cá nhân được chọn ngẫu nhiên từ nhóm khỏe mạnh:
    
    $$\text{CLES} = \frac{U_1}{n_1 \cdot n_2}$$
    
2.  **Hệ số tương quan Rank-Biserial ($r_{rb}$)**: Định lượng mức độ khác biệt về thứ hạng trong khoảng từ $-1$ đến $+1$:
    
    $$r_{rb} = 2 \cdot \text{CLES} - 1$$

---

## 2. Cấu trúc Thư mục và Kết quả Đầu ra

Khi chạy script phân tích, hệ thống sẽ tạo ra cấu trúc thư mục như sau:

```text
Diabetes-Analytics/
│
├── python_analysis/
│   ├── statistical_analysis.py    <- Kịch bản thực thi chính
│   ├── rq1_explain.md             <- Hướng dẫn giải thích này (Tiếng Việt)
│   └── README.md                  <- Hướng dẫn giải thích (Tiếng Anh)
│
├── results/
│   └── statistical_analysis/      <- Các file CSV và biểu đồ PNG được tạo ra
│       ├── chi_square_results.csv
│       ├── numerical_results.csv
│       ├── cramers_v_ranking.png
│       ├── top_categorical_prevalence.png
│       ├── bmi_boxplot.png
│       └── health_days_comparison.png
│
└── docs/
    └── statistical_analysis.md    <- Báo cáo học thuật được tự động xuất ra
```

---

## 3. Cách thực thi phân tích

### 3.1 Yêu cầu hệ thống
Hãy đảm bảo bạn đã cài đặt Python 3.10+ và các thư viện cần thiết bằng lệnh:
```bash
pip install pandas numpy scipy matplotlib seaborn
```

Đồng thời, đảm bảo quá trình tiền xử lý dữ liệu đã được thực hiện trước đó để tạo ra tệp dữ liệu sạch tại `data/processed/diabetes_cleaned.csv`.

### 3.2 Chạy chương trình
Chạy kịch bản phân tích thống kê từ thư mục gốc của dự án:
```powershell
python python_analysis/statistical_analysis.py
```

Chương trình sẽ tự động thực hiện tất cả các kiểm định, lưu kết quả vào thư mục `results/`, vẽ các biểu đồ chẩn đoán trực quan và biên soạn báo cáo học thuật chính thức tại `docs/statistical_analysis.md`.
