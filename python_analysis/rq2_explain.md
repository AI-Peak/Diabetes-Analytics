# Module Phân tích Python: So sánh Mô hình Học máy & Tối ưu hóa Ngưỡng Sàng lọc (RQ2)

Tệp này giải thích chi tiết các bước thực hiện, ý nghĩa của từng bước và kết quả thu được khi giải quyết **Câu hỏi Nghiên cứu 2 (RQ2)**:
> *"Mô hình học máy nào mang lại hiệu suất dự đoán đáng tin cậy nhất trên tập dữ liệu BRFSS gốc bị mất cân bằng?"*

Quá trình huấn luyện và đánh giá mô hình được triển khai trong kịch bản [model_training.py] theo quy trình CRISP-DM chuẩn hóa và phương pháp luận không rò rỉ dữ liệu (zero-leakage).

---

## 1. Quy trình Đánh giá & Lựa chọn Mô hình (Strict Methodology)

### Bước 1: Chia tập dữ liệu Độc lập (Stratified Train-Test Partition)
*   Tập dữ liệu gốc ($N = 253,680$) được phân chia thành:
    *   **Development Set (80%):** 202,944 bản ghi dùng cho kiểm thử chéo (5-Fold CV) và chọn ngưỡng sàng lọc OOF.
    *   **Untouched Holdout Test Set (20%):** 50,736 bản ghi hoàn toàn độc lập, chỉ được sử dụng đúng một lần để đánh giá hiệu suất cuối cùng.
*   Việc chia dữ liệu sử dụng `stratify=y` và `random_state=42` để bảo toàn chính xác tỷ lệ mất cân bằng nhóm tự nhiên (13.93% tiểu đường / 86.07% khỏe mạnh).

### Bước 2: Xây dựng Pipeline riêng cho từng nhóm mô hình (No Data Leakage)
*   **Logistic Regression Pipeline:**
    *   `ColumnTransformer`: Biến số (`BMI`, `MentHlth`, `PhysHlth`) được chuẩn hóa bằng `StandardScaler`; biến thứ tự (`GenHlth`, `Age`, `Education`, `Income`) được mã hóa `OneHotEncoder(drop='first')` để không áp đặt khoảng cách tuyến tính giả định; biến nhị phân được giữ nguyên `passthrough`.
*   **Tree-based Pipelines (Decision Tree, Random Forest, XGBoost):**
    *   Sử dụng ma trận đặc trưng gốc mà không áp dụng `StandardScaler` (vì mô hình dạng cây bất biến với phép biến đổi đơn điệu), giúp bảo toàn ý nghĩa gốc của đặc trưng cho XAI.
*   Tất cả các bước tiền xử lý đều nằm trong `Pipeline` của scikit-learn để scaler/encoder được fit riêng trong từng fold của CV.

### Bước 3: Lựa chọn Mô hình bằng 5-Fold Stratified CV trên Development Set
*   Thực hiện 5-fold CV chỉ trên Development Set.
*   Tiêu chí lựa chọn mô hình:
    *   **Primary Criterion:** Mean Cross-Validated PR-AUC.
    *   **Tie-break 1:** Mean Cross-Validated ROC-AUC.
    *   **Tie-break 2:** Độ lệch chuẩn PR-AUC giữa các fold thấp hơn.
*   **Kết quả Lựa chọn:** Mô hình **XGBoost** đạt chỉ số **Mean CV PR-AUC cao nhất (0.4359 ± 0.0077)** và **Mean CV ROC-AUC (0.8305)**, vượt qua Random Forest (PR-AUC 0.4301), Logistic Regression (PR-AUC 0.4163), và Decision Tree (PR-AUC 0.4015). Tập kiểm thử (Holdout Test) **không** tham gia vào quá trình chọn mô hình này.

### Bước 4: Tối ưu hóa Ngưỡng Quyết định bằng OOF Probabilities
*   Sử dụng dự đoán Out-Of-Fold (OOF) của mô hình XGBoost trên Development Set.
*   Mục tiêu Recall $\ge 0.80$ được định nghĩa trước cho bài toán sàng lọc sớm.
*   Thuật toán chọn ngưỡng tìm được **ngưỡng sàng lọc $0.13$** (đạt OOF Recall = 80.97%, Precision = 30.00%, F1 = 0.4378).

### Bước 5: Đánh giá Cuối cùng trên Untouched Holdout Test Set
Sau khi mô hình và ngưỡng đã được khóa hoàn toàn:
1. Huấn luyện pipeline XGBoost trên toàn bộ 202,944 bản ghi của Development Set.
2. Dự đoán tập kiểm thử 50,736 bản ghi đúng một lần.

---

## 2. Kết quả Đánh giá trên Holdout Test Set (N = 50,736)

| Tiêu chí | Ngưỡng mặc định (0.50) | Ngưỡng sàng lọc đã chọn (0.13) | Khoảng tin cậy Bootstrap 95% (Ngưỡng 0.13) |
| :--- | :---: | :---: | :---: |
| **ROC-AUC** | 0.8272 | 0.8272 | [0.8223, 0.8322] |
| **PR-AUC** | 0.4238 | 0.4238 | [0.4135, 0.4347] |
| **Recall (Độ nhạy)** | **16.54%** | **80.99%** | **[80.04%, 81.94%]** |
| **Precision (Độ chính xác)**| 55.83% | 29.91% | [29.53%, 30.28%] |
| **F1-score** | 0.2552 | 0.4369 | [0.4317, 0.4418] |
| **Specificity** | 97.88% | 69.26% | — |
| **False Negatives (Bỏ sót bệnh)** | **5,900 ca** | **1,344 ca** | **Cắt giảm 4,556 ca (77.22%)** |
| **False Positives (Báo động giả)** | **925 ca** | **13,416 ca** | **Tăng thêm 12,491 ca** |

---

## 3. Kết luận cho RQ2

1.  **Mô hình được chọn:** **XGBoost** thông qua 5-fold CV trên Development Set (`Mean PR-AUC = 0.4359`).
2.  **Ngưỡng sàng lọc:** Ngưỡng **0.13** (validation-selected screening threshold) tăng chỉ số Recall từ 16.54% lên **80.99%**, giúp phát hiện hơn 80% số ca nguy cơ trong cộng đồng và cắt giảm **77.22% số ca bỏ sót bệnh**.
