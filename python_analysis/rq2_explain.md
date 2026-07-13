# Module Phân tích Python: So sánh Mô hình Học máy & Tối ưu hóa Ngưỡng (RQ2)

Tệp này giải thích chi tiết các bước thực hiện, ý nghĩa của từng bước và kết quả thu được khi giải quyết **Câu hỏi Nghiên cứu 2 (RQ2)**:
> *"Mô hình học máy nào mang lại hiệu suất dự đoán đáng tin cậy nhất trên tập dữ liệu BRFSS gốc bị mất cân bằng?"*

Quá trình huấn luyện mô hình được triển khai trong kịch bản [model_training.py] theo quy trình chuẩn hóa CRISP-DM.

---

## 1. Các bước thực hiện và Ý nghĩa của từng bước

### Bước 1: Tải dữ liệu và Xác định bài toán
*   **Cách thực hiện:** Đọc tập dữ liệu sạch `diabetes_cleaned.csv` từ thư mục `data/processed/`.
*   **Ý nghĩa:** Xác định biến mục tiêu là `Diabetes_binary` (0: Khỏe mạnh, 1: Tiểu đường) và các biến độc lập là 21 chỉ số nhân khẩu học, sức khỏe và lối sống.

### Bước 2: Chia tập dữ liệu huấn luyện và kiểm thử (Stratified Train-Test Split)
*   **Cách thực hiện:** Chia dữ liệu theo tỷ lệ **80% huấn luyện (Train)** và **20% kiểm thử (Test)**, sử dụng tham số `stratify=y` và `random_state=42`.
*   **Ý nghĩa:** 
    *   Tập dữ liệu gốc bị mất cân bằng nhóm rất lớn (khoảng **84.7%** nhóm khỏe mạnh và chỉ **15.3%** nhóm tiểu đường). 
    *   Phương pháp chia **Stratified** bắt buộc tỷ lệ mất cân bằng này phải được giữ nguyên y hệt trong cả hai tập huấn luyện và tập kiểm thử. Điều này đảm bảo mô hình được đánh giá trên một tập kiểm thử phản ánh đúng thực tế quần thể.

### Bước 3: Chuẩn hóa thuộc tính (Feature Standardization)
*   **Cách thực hiện:** Sử dụng `StandardScaler` để đưa tất cả các biến về cùng một thang đo (trung bình bằng 0, độ lệch chuẩn bằng 1).
*   **Ý nghĩa:**
    *   Cực kỳ quan trọng đối với **Logistic Regression** vì mô hình tuyến tính rất nhạy cảm với thang đo của biến số. Nếu không chuẩn hóa, các biến có thang đo lớn (như `BMI` chạy từ 12-98) sẽ lấn át các biến nhị phân khác (như `HighBP` chỉ nhận 0-1) và làm mô hình không thể hội tụ tốt.
    *   Mặc dù các mô hình dạng cây (Decision Tree, Random Forest, XGBoost) không bị ảnh hưởng bởi thang đo, việc chuẩn hóa giúp thống nhất định dạng dữ liệu đầu vào cho tất cả các mô hình để so sánh công bằng.

### Bước 4: Khởi tạo và Huấn luyện đa mô hình (Model Training)
*   **Cách thực hiện:** Huấn luyện đồng thời 4 thuật toán phổ biến từ đơn giản đến phức tạp:
    1.  **Logistic Regression:** Mô hình tuyến tính phân loại làm mốc so sánh (baseline).
    2.  **Decision Tree:** Mô hình dạng cây quyết định trực quan.
    3.  **Random Forest:** Phương pháp học máy ensemble (kết hợp nhiều cây quyết định độc lập).
    4.  **XGBoost:** Thuật toán boosting mạnh mẽ (huấn luyện các cây quyết định tuần tự để sửa sai cho cây trước).
*   **Ý nghĩa:** Việc so sánh nhiều thuật toán giúp tìm ra mô hình có khả năng học được các mối quan hệ phi tuyến và tương tác biến phức tạp nhất mà vẫn kiểm soát được hiện tượng quá khớp (overfitting).

### Bước 5: Đánh giá mô hình bằng các chỉ số chuyên biệt (Evaluation Metrics)
*   **Cách thực hiện:** Tính toán 6 chỉ số đánh giá cho từng mô hình trên tập kiểm thử: **Accuracy**, **Precision**, **Recall**, **F1-score**, **ROC-AUC**, và **PR-AUC**.
*   **Ý nghĩa:**
    *   **Accuracy (Độ chính xác tổng thể):** Không phản ánh đúng hiệu suất đối với dữ liệu mất cân bằng. Nếu mô hình đoán tất cả là "khỏe mạnh", độ chính xác vẫn đạt 84.7% nhưng mô hình hoàn toàn vô dụng.
    *   **Recall (Độ nhạy):** Tỷ lệ người bị tiểu đường thực tế được mô hình phát hiện ra. Trong y tế, chỉ số này được ưu tiên cao để tránh bỏ sót bệnh nhân.
    *   **Precision (Độ chính xác dương tính):** Tỷ lệ số ca dự đoán tiểu đường thực sự bị bệnh. Giúp tránh báo động giả gây hoang mang và tốn kém chi phí xét nghiệm lại.
    *   **ROC-AUC:** Khả năng phân biệt giữa hai nhóm khỏe mạnh và tiểu đường của mô hình.
    *   **PR-AUC (Precision-Recall Area Under Curve):** **Đây là chỉ số quan trọng nhất để chọn mô hình tốt nhất.** Khác với ROC-AUC, PR-AUC tập trung hoàn toàn vào lớp thiểu số (lớp bệnh tiểu đường), do đó nó đánh giá chính xác hơn khả năng dự đoán của mô hình trên dữ liệu mất cân bằng.

### Bước 6: Phân tích và Tối ưu hóa ngưỡng quyết định (Threshold-Sensitive Analysis)
*   **Cách thực hiện:** Đối với mô hình tốt nhất, thay đổi ngưỡng quyết định (Probability Threshold) từ **0.05 đến 0.95** để đánh giá sự thay đổi của Precision, Recall và F1-score.
*   **Ý nghĩa:** 
    *   Theo mặc định, mô hình dự đoán một người bị tiểu đường nếu xác suất lớn hơn hoặc bằng **0.50**. Ở ngưỡng này, do dữ liệu mất cân bằng, mô hình xu hướng đoán rất an toàn dẫn đến chỉ số **Recall cực kỳ thấp** (bỏ sót rất nhiều bệnh nhân thực tế).
    *   Trong sàng lọc y tế sớm, bỏ sót bệnh (False Negative) nguy hiểm hơn nhiều so với đoán nhầm (False Positive). Vì thế, chúng ta tối ưu hóa ngưỡng quyết định xuống thấp hơn (ví dụ: **0.15**) nhằm tăng mạnh chỉ số Recall lên mức chấp nhận được (~80%), tối đa hóa cơ hội phát hiện bệnh sớm cho bệnh nhân.

---

## 2. Kết quả kiểm thử và So sánh mô hình

Kết quả đánh giá 4 mô hình trên tập kiểm thử (Test Set - 45,895 mẫu) với ngưỡng mặc định (0.50):

| Tên mô hình | Accuracy | Precision | Recall | F1-score | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost** | **0.8555** | 0.5966 | **0.1707** | **0.2654** | **0.8184** | **0.4448** |
| **Random Forest** | 0.8541 | **0.6307** | 0.1107 | 0.1883 | 0.8155 | 0.4421 |
| **Decision Tree** | 0.8520 | 0.5677 | 0.1349 | 0.2180 | 0.8042 | 0.4172 |
| **Logistic Regression** | 0.8505 | 0.5398 | 0.1537 | 0.2393 | 0.8102 | 0.4142 |

### Nhận xét & Chọn mô hình tốt nhất:
*   **XGBoost** là mô hình tốt nhất vì đạt chỉ số **PR-AUC cao nhất (0.4448)** và **ROC-AUC cao nhất (0.8184)**. Nó có khả năng học các mối quan hệ phi tuyến phức tạp trong dữ liệu tốt hơn các mô hình còn lại.
*   *Lưu ý:* Ở ngưỡng mặc định `0.50`, tất cả các mô hình đều có chỉ số **Recall cực kỳ thấp** (chỉ đạt 11.07% đến 17.07%), chứng tỏ mô hình bỏ sót tới hơn 80% bệnh nhân tiểu đường thực tế. Điều này đòi hỏi bước tối ưu hóa ngưỡng ở phần tiếp theo.

---

## 3. Tối ưu hóa ngưỡng quyết định trên mô hình XGBoost

Nhằm phục vụ mục tiêu sàng lọc sớm trong y tế (giảm thiểu tối đa số ca bỏ sót bệnh), chúng ta điều chỉnh ngưỡng xác suất quyết định của mô hình XGBoost từ mặc định `0.50` xuống ngưỡng tối ưu hóa `0.15`.

Bảng so sánh hiệu suất trước và sau khi tối ưu hóa ngưỡng:

| Tiêu chí so sánh | Ngưỡng mặc định (0.50) | Ngưỡng tối ưu hóa (0.15) | Ý nghĩa lâm sàng |
| :--- | :---: | :---: | :--- |
| **Ngưỡng quyết định** | 0.50 | 0.15 | Chẩn đoán nhạy bén hơn đối với các ca có nguy cơ thấp-trung bình. |
| **Accuracy (Độ chính xác)** | 85.55% | 70.45% | Chấp nhận giảm độ chính xác tổng thể để tập trung phát hiện bệnh. |
| **Recall (Độ nhạy)** | **17.07%** | **79.61%** | **Tăng gấp 4.6 lần**, phát hiện được gần 80% số bệnh nhân thực tế. |
| **Precision (Độ chính xác dương)**| 59.66% | 31.53% | Precision giảm đồng nghĩa số ca phải xét nghiệm lại (báo động giả) tăng lên. |
| **F1-score** | 0.2654 | 0.4518 | Cân bằng hài hòa hơn giữa Precision và Recall trên lớp thiểu số. |
| **Số ca bỏ sót bệnh (False Negatives)**| **5,821 ca** | **1,431 ca** | **Giảm 75% số ca bỏ sót bệnh nguy hiểm.** |
| **Số ca phát hiện đúng (True Positives)**| **1,198 ca** | **5,588 ca** | **Phát hiện thêm được 4,390 bệnh nhân thực tế.** |

### So sánh Ma trận nhầm lẫn (Confusion Matrix):
*   **Tại ngưỡng mặc định (0.50):**
    ```text
    [[38066 (TN),   810 (FP)]
     [ 5821 (FN),  1198 (TP)]]
    ```
    *(Bỏ sót đến 5,821 bệnh nhân thực tế do dự đoán quá an toàn)*

*   **Tại ngưỡng tối ưu hóa (0.15):**
    ```text
    [[26744 (TN), 12132 (FP)]
     [ 1431 (FN),  5588 (TP)]]
    ```
    *(Chỉ còn bỏ sót 1,431 bệnh nhân, phát hiện thành công 5,588 bệnh nhân)*

---

## 4. Kết luận cho RQ2

1.  **Mô hình đáng tin cậy nhất** trên tập dữ liệu mất cân bằng là **XGBoost** với các chỉ số vượt trội về khả năng phân loại (`ROC-AUC = 0.8184`, `PR-AUC = 0.4448`).
2.  **Chiến lược tối ưu hóa ngưỡng quyết định về mức 0.15** là bắt buộc đối với ứng dụng sàng lọc y tế thực tế, giúp tăng chỉ số Recall lên sát mục tiêu **79.61%** và cắt giảm tới **75% số lượng ca bỏ sót bệnh nguy hiểm**.
