import { PROJECT_CONTEXT } from "./system-instruction";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function englishQuestion(value: string): boolean {
  return /\b(why|what|how|which|summarize|explain|compare|does|is)\b/i.test(value);
}

export function fallbackAnswer(question: string): string {
  const normalized = normalize(question);
  const en = englishQuestion(question);

  if (/(chan doan|diagnos|toi bi|do i have|thuoc|medication|treatment)/.test(normalized)) {
    return en
      ? "I cannot diagnose you or provide personalized medical advice. This dashboard reports population-level research results only. Please discuss personal symptoms or treatment with a qualified clinician."
      : "Mình không thể chẩn đoán hoặc đưa ra tư vấn y khoa cá nhân. Dashboard này chỉ trình bày kết quả nghiên cứu ở cấp độ quần thể. Bạn nên trao đổi triệu chứng hoặc điều trị với bác sĩ/chuyên gia y tế có chuyên môn.";
  }

  if (/(tom tat|summary|summarize|3 rq|ket luan)/.test(normalized)) {
    return en
      ? "RQ1: General health and high blood pressure lead categorical associations, while BMI has the largest numeric rank-biserial effect. RQ2: XGBoost is best by mean 5-fold CV PR-AUC (0.4359); adjusting the threshold to 0.13 raises holdout recall to 81.0%. RQ3: SHAP signals align with statistical evidence across four evidence groups (Spearman r = 0.71). These are associations and model signals, not causes or diagnoses."
      : "RQ1: GenHlth và HighBP dẫn đầu liên hệ phân loại; BMI có hiệu ứng số lớn nhất. RQ2: XGBoost tốt nhất theo 5-fold CV PR-AUC (0.4359); hạ ngưỡng xuống 0.13 nâng Recall tập kiểm thử lên 81.0%. RQ3: SHAP căn chỉnh với bằng chứng thống kê qua 4 nhóm căn chỉnh (Spearman r = 0.71). Đây là liên hệ/tín hiệu mô hình, không phải quan hệ nhân quả hay chẩn đoán.";
  }

  if (/(pr-?auc|accuracy|mat can bang|imbalanc)/.test(normalized)) {
    return en
      ? "PR-AUC is primary because only 13.9% of records are diabetic. Accuracy can look high by favoring the 86.1% healthy majority, while PR-AUC focuses on how well positive cases are retrieved. XGBoost has the best 5-fold CV PR-AUC at 0.4359."
      : "PR-AUC được ưu tiên vì lớp tiểu đường chỉ chiếm 13.9%. Accuracy có thể cao nếu thiên về 86.1% mẫu khỏe mạnh; PR-AUC tập trung hơn vào khả năng phát hiện ca dương tính. XGBoost có 5-fold CV PR-AUC cao nhất: 0.4359.";
  }

  if (/(threshold|nguong|0\.13|0\.15|false negative|bo sot)/.test(normalized)) {
    return en
      ? "At the validation-selected screening threshold 0.13, XGBoost holdout recall rises to 81.0% and false negatives fall to 1,344, compared with 16.5% recall and 5,900 false negatives at 0.50. The trade-off is lower precision (29.9%) and more false positives (13,416), acceptable for early screening."
      : "Ở ngưỡng sàng lọc 0.13, Recall tập test của XGBoost tăng lên 81.0% và False Negative giảm còn 1,344; tại 0.50, Recall chỉ 16.5% với 5,900 ca bị bỏ sót. Đổi lại, Precision còn 29.9% và False Positive tăng lên 13,416. Đây là đánh đổi phù hợp cho sàng lọc sớm.";
  }

  if (/(cramer|top 5|yeu to)/.test(normalized)) {
    return en
      ? "Top categorical associations by Cramér's V are GenHlth (0.299), HighBP (0.263), HighChol (0.200), DiffWalk (0.218), and Age (0.186). They are associated with diabetes in this dataset; the analysis does not establish causation."
      : "Top liên hệ phân loại theo Cramér's V: GenHlth (0.299), HighBP (0.263), HighChol (0.200), DiffWalk (0.218) và Age (0.186). Đây là các yếu tố có liên hệ trong dữ liệu, không chứng minh quan hệ nhân quả.";
  }

  if (/(shap|consisten|nhat quan|group|thong ke)/.test(normalized)) {
    return en
      ? "Yes, leading SHAP signals broadly agree with classical statistics (Top-10 overlap = 7/10, Jaccard = 0.54, Spearman r = 0.71). The framework classifies predictors into 4 groups: Consistent high evidence, Model redundant, Model salient, and Weak evidence. Lower SHAP rank for factors such as DiffWalk/PhysHlth is interpreted as shared signal or redundancy."
      : "Có. Các tín hiệu SHAP hàng đầu nhìn chung khớp với thống kê (Top-10 overlap = 7/10, Jaccard = 0.54, Spearman r = 0.71). Nghiên cứu chia 4 nhóm: Consistent high evidence, Model redundant, Model salient và Weak evidence. DiffWalk/PhysHlth có hạng SHAP thấp hơn được lý giải bởi tín hiệu chia sẻ/dư thừa.";
  }

  if (/(context|du lieu|dataset|brfss|bao nhieu mau)/.test(normalized)) {
    return en
      ? "The study uses the CDC BRFSS 2015 dataset with 253,680 records (retaining repeated feature profiles) and 21 predictors. Class balance is 86.1% healthy (218,334) and 13.9% diabetic (35,346), evaluated on a stratified 80/20 split with 50,736 test records."
      : "Nghiên cứu dùng CDC BRFSS 2015 gồm 253,680 bản ghi (giữ nguyên repeated feature profiles) và 21 biến dự báo. Phân bố lớp là 86.1% khỏe mạnh (218,334) và 13.9% tiểu đường (35,346), đánh giá trên tập test 50,736 bản ghi.";
  }

  void PROJECT_CONTEXT;
  return en
    ? "That detail is not available in the study context I was given. I can answer about the dataset, RQ1 effect sizes, the model metrics, screening threshold, and SHAP/statistical consistency."
    : "Chi tiết đó không có trong context nghiên cứu mình được cung cấp. Mình có thể trả lời về dataset, effect size của RQ1, metrics của các mô hình, ngưỡng sàng lọc và mức nhất quán giữa SHAP với thống kê.";
}
