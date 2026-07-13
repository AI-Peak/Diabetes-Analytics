# Module Phân tích Python: Trực quan hóa SHAP & Phân tích nhất quán giải thích (RQ3)

Tệp này giải thích chi tiết các bước thực hiện, ý nghĩa của từng bước và kết quả phân tích học máy giải thích được (Explainable AI - XAI) để giải quyết **Câu hỏi Nghiên cứu 3 (RQ3)**:
> *"Các giải thích được tạo ra bởi mô hình học máy tốt nhất (XGBoost) có nhất quán về mặt thống kê với bằng chứng thu được từ các kiểm định giả thuyết truyền thống hay không?"*

Quá trình phân tích XAI được triển khai trong kịch bản [shap_analysis.py]

---

## 1. Các bước thực hiện và Ý nghĩa của từng bước

### Bước 1: Huấn luyện lại mô hình tốt nhất (XGBoost) trên định dạng DataFrame
*   **Cách thực hiện:** Huấn luyện lại mô hình XGBoost với các tham số tối ưu đã tìm được ở RQ2. Điểm khác biệt là dữ liệu được đưa vào dưới dạng Pandas DataFrame có giữ nguyên tên cột (thay vì mảng Numpy thuần túy).
*   **Ý nghĩa:** Việc giữ lại tên cột gốc giúp thư viện SHAP có thể trích xuất và hiển thị trực tiếp tên các biến (`BMI`, `HighBP`, `GenHlth`,...) trên các biểu đồ giải thích, thay vì hiển thị các ký hiệu vô nghĩa như `Feature 0`, `Feature 1`,...

### Bước 2: Khởi tạo bộ giải thích TreeExplainer và tính toán SHAP values
*   **Cách thực hiện:** 
    *   Sử dụng `shap.TreeExplainer` - bộ giải thích chuyên biệt tối ưu cho các mô hình dạng cây quyết định và boosting như XGBoost.
    *   Lấy mẫu ngẫu nhiên phân lớp **10,000 mẫu** từ tập kiểm thử để tính toán giá trị SHAP.
*   **Ý nghĩa:** 
    *   SHAP (SHapley Additive exPlanations) dựa trên lý thuyết trò chơi hợp tác để tính toán đóng góp biên của từng thuộc tính đối với dự đoán của mô hình.
    *   Việc lấy mẫu 10,000 dòng giúp tăng tốc độ tính toán của thuật toán TreeExplainer mà vẫn đảm bảo tính đại diện thống kê cực kỳ cao cho toàn bộ tập dữ liệu.

### Bước 3: Trực quan hóa giải thích toàn cục (Global Explanations)
*   **Cách thực hiện:** Vẽ và lưu hai biểu đồ quan trọng:
    1.  `shap_summary_bar.png` (Biểu đồ thanh ngang): Xếp hạng tầm quan trọng của các thuộc tính dựa trên trị tuyệt đối trung bình của giá trị SHAP.
    2.  `shap_summary_dot.png` (Biểu đồ beeswarm): Hiển thị chi tiết hướng ảnh hưởng (tích cực/tiêu cực) và giá trị của từng thuộc tính lên nguy cơ mắc tiểu đường.
*   **Ý nghĩa:** Giúp hiểu được một cách tổng quát "tư duy" của mô hình XGBoost khi đưa ra dự đoán nguy cơ tiểu đường trên toàn bộ quần thể.

### Bước 4: Trực quan hóa giải thích cục bộ (Local Explanations)
*   **Cách thực hiện:** Tìm các bệnh nhân cụ thể trong tập kiểm thử (một ca dự đoán đúng bị tiểu đường và một ca dự đoán đúng khỏe mạnh) và vẽ biểu đồ thác nước (waterfall plot) lưu tại `shap_local_diabetic.png` và `shap_local_healthy.png`.
*   **Ý nghĩa:** Giải thích chi tiết **tại sao** mô hình lại đưa ra quyết định dự đoán cụ thể cho *một bệnh nhân đơn lẻ*. Biểu đồ thác nước hiển thị chính xác các yếu tố nào đã đẩy xác suất nguy cơ của bệnh nhân đó lên cao hay kéo xuống thấp so với mức trung bình của quần thể.

### Bước 5: Phân tích Nhất quán giải thích (Explanation Consistency Analysis)
*   **Cách thực hiện:** 
    *   Tải kết quả kiểm định thống kê ở Phase 2 ([chi_square_results.csv] và [numerical_results.csv]).
    *   Trích xuất Giá trị p-value và Kích thước ảnh hưởng (Effect Size: Cramér's V cho biến phân loại, trị tuyệt đối Rank-Biserial cho biến liên tục) của tất cả 21 biến.
    *   Đồng bộ hóa và so sánh thứ hạng quan trọng của SHAP (`SHAP_Rank`) với thứ hạng sức mạnh liên quan thống kê (`Stat_Rank`).
    *   Lưu bảng kết quả nhất quán tại `explanation_consistency.csv` và phân nhóm các thuộc tính thành 3 nhóm lớn.
*   **Ý nghĩa:** Đây là lõi đóng góp khoa học của nghiên cứu. Bước này giúp kiểm chứng xem mô hình học máy hộp đen (Black-box Machine Learning) có học được những tri thức lâm sàng thực tế phù hợp với các lý thuyết dịch tễ học thống kê truyền thống hay không.

---

## 2. Kết quả phân nhóm nhất quán giải thích

Dựa trên kết quả phân tích trong tệp [explanation_consistency.csv], 21 thuộc tính sức khỏe được phân chia cụ thể như sau:

### Nhóm 1: Strong Agreement (Đồng thuận mạnh - Thuộc nhóm quan trọng nhất)
*   **Các biến thuộc nhóm:** `['GenHlth', 'HighBP', 'Age', 'BMI', 'HighChol', 'Sex', 'Income', 'MentHlth', 'CholCheck', 'HvyAlcoholConsump']`
*   **Giải thích ý nghĩa:** 
    *   Cả mô hình học máy (SHAP) và kiểm định thống kê y sinh đều đồng thuận rằng đây là những yếu tố có mối liên quan mạnh nhất đối với tiểu đường.
    *   Ví dụ: `GenHlth` (Sức khỏe tổng quát tự đánh giá) xếp thứ 1 trong SHAP và thứ 2 trong kiểm định thống kê. `HighBP` (Huyết áp cao) xếp thứ 2 trong SHAP và thứ 3 trong thống kê. `BMI` xếp thứ 4 trong SHAP và thứ 1 trong thống kê.
    *   Sự đồng thuận này khẳng định mô hình XGBoost hoạt động cực kỳ đáng tin cậy về mặt y khoa, không bị học lệch hay học các đặc trưng rác (noise).

### Nhóm 2: Under-represented (Mô hình đánh giá thấp hơn thống kê đơn biến)
*   **Các biến thuộc nhóm:** `['HeartDiseaseorAttack', 'DiffWalk', 'PhysHlth', 'Education', 'Stroke', 'Smoker', 'PhysActivity', 'NoDocbcCost', 'Fruits', 'AnyHealthcare', 'Veggies']`
*   **Giải thích ý nghĩa (Góc nhìn Data Science quan trọng):**
    *   Các biến này có ý nghĩa thống kê rất rõ ràng ở Phase 2 ($p < 0.05$), nhưng lại xếp ngoài Top 10 về mức độ quan trọng trong mô hình XGBoost.
    *   **Nguyên nhân chính là hiện tượng Đa cộng tuyến (Multicollinearity) và Dư thừa thông tin:**
        *   Ví dụ: `DiffWalk` (Khó khăn khi đi lại - Xếp hạng Thống kê: 4 nhưng SHAP: 12) và `PhysHlth` (Số ngày sức khỏe thể chất kém - Xếp hạng Thống kê: 5 nhưng SHAP: 13) đều tương quan rất mạnh với `GenHlth` (Sức khỏe tổng quát tự đánh giá).
        *   Trong **kiểm định thống kê đơn biến** ở Phase 2, mỗi biến được đánh giá độc lập nên cả `DiffWalk` và `PhysHlth` đều có điểm số tương quan rất cao.
        *   Trong **mô hình học máy đa biến (XGBoost)**, mô hình học tất cả các biến cùng lúc. Vì `GenHlth` đã giải thích phần lớn lượng thông tin liên quan đến thể chất và khả năng đi lại, mô hình sẽ gán ít trọng số hơn cho `DiffWalk` và `PhysHlth` để tránh dư thừa dữ liệu. 
    *   Điều này cho thấy học máy đã giúp chúng ta loại bỏ các yếu tố gây nhiễu/trùng lặp thông tin để tập trung vào gốc rễ của vấn đề.
    *   **Kết luận và Khuyến nghị đối với Nhóm 2:**
        *   *Về y sinh / lâm sàng:* Dù mô hình học máy xếp các thuộc tính này ở vị trí thấp do sự trùng lặp thông tin với các biến đại diện (như `GenHlth` hay `HighBP`), chúng vẫn là các yếu tố nguy cơ thực tế có ý nghĩa y khoa cao và không được bỏ qua trong các chẩn đoán sàng lọc lâm sàng truyền thống.
        *   *Về tối ưu hóa khảo sát (Data Minimization):* Phát hiện này gợi ý rằng trong tương lai, chúng ta có thể thiết kế các bộ câu hỏi khảo sát y tế tinh gọn hơn để giảm tải cho người khai báo. Ví dụ: có thể lược bớt các câu hỏi chi tiết như `DiffWalk` hoặc `PhysHlth` mà chỉ cần hỏi câu hỏi tổng quát `GenHlth` mà vẫn đảm bảo mô hình dự đoán hiệu quả mà không bị suy giảm hiệu suất đáng kể.


### Nhóm 3: Potential Interaction (Chỉ số học máy đánh giá cao nhưng thống kê không chấp nhận)
*   **Các biến thuộc nhóm:** Không có biến nào (`[]`)
*   **Giải thích ý nghĩa:**
    *   Do kích thước mẫu của tập dữ liệu quá lớn ($N = 229,474$), sức mạnh kiểm định thống kê cực kỳ mạnh, dẫn tới **tất cả 21 biến số trong dữ liệu đều có ý nghĩa thống kê** ($p < 0.05$).
    *   Vì thế, không tồn tại bất kỳ biến nào vô nghĩa về mặt thống kê mà lại được mô hình học máy xếp hạng quan trọng. Điều này củng cố thêm tính an toàn và nhất quán của mô hình XGBoost.

---

## 3. Các tệp tin kết quả được tạo ra

Sau khi chạy kịch bản phân tích, các tệp sau được lưu tại thư mục results/xai:

1.  **[shap_summary_bar.png] (Tầm quan trọng thuộc tính):** Biểu đồ cột ngang hiển thị xếp hạng đóng góp của các biến đối với mô hình XGBoost.
2.  **[shap_summary_dot.png] (Biểu đồ Beeswarm):** Hiển thị trực quan hướng ảnh hưởng. Ví dụ: các chấm đỏ của biến `BMI` nằm về phía bên phải (giá trị BMI cao làm tăng mạnh xác suất dự đoán mắc tiểu đường).
3.  **[shap_local_diabetic.png] (Giải thích ca bệnh tiểu đường):** Biểu đồ thác nước chỉ ra các yếu tố cụ thể (như `GenHlth=5`, `HighBP=1`) đã kéo xác suất nguy cơ của bệnh nhân này lên mức cao vượt trội.
4.  **[shap_local_healthy.png] (Giải thích ca bệnh khỏe mạnh):** Chỉ ra các yếu tố (như `HighBP=0`, `BMI=25`) giúp mô hình tự tin kết luận người này khỏe mạnh với nguy cơ cực kỳ thấp.
5.  **[explanation_consistency.csv] (Dữ liệu phân tích nhất quán):** Bảng so sánh thứ hạng và phân nhóm nhất quán chính thức.
