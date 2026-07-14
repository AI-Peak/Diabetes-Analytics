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
      ? "RQ1: General health and high blood pressure lead the categorical associations, while BMI has the largest numeric effect. RQ2: XGBoost is best by PR-AUC (0.4448); lowering the threshold to 0.15 raises recall to 79.6%. RQ3: SHAP broadly agrees with statistical ranks, with correlated factors under-represented in multivariate importance. These are associations and model signals, not causes or diagnoses."
      : "RQ1: GenHlth và HighBP dẫn đầu liên hệ phân loại; BMI có hiệu ứng số lớn nhất. RQ2: XGBoost tốt nhất theo PR-AUC (0.4448); hạ ngưỡng xuống 0.15 nâng Recall lên 79.6%. RQ3: SHAP nhìn chung nhất quán với xếp hạng thống kê, còn một số biến tương quan bị giảm hạng trong mô hình đa biến. Đây là liên hệ/tín hiệu mô hình, không phải quan hệ nhân quả hay chẩn đoán.";
  }

  if (/(pr-?auc|accuracy|mat can bang|imbalanc)/.test(normalized)) {
    return en
      ? "PR-AUC is primary because only 15.3% of records are diabetic. Accuracy can look high by favoring the 84.7% healthy majority, while PR-AUC focuses on how well positive cases are retrieved and how precise those alerts are. XGBoost has the best PR-AUC at 0.4448."
      : "PR-AUC được ưu tiên vì lớp tiểu đường chỉ chiếm 15.3%. Accuracy có thể vẫn cao nếu mô hình thiên về 84.7% mẫu khỏe mạnh; PR-AUC tập trung hơn vào khả năng tìm đúng ca dương tính và độ chính xác của các cảnh báo đó. XGBoost có PR-AUC cao nhất: 0.4448.";
  }

  if (/(threshold|nguong|0\.15|false negative|bo sot)/.test(normalized)) {
    return en
      ? "At threshold 0.15, XGBoost recall rises to 79.6% and false negatives fall to 1,431, compared with 17.1% recall and 5,821 false negatives at 0.50. The trade-off is lower precision (31.5%) and more false positives (12,132), which can be acceptable for early screening rather than diagnosis."
      : "Ở ngưỡng 0.15, Recall của XGBoost tăng lên 79.6% và số False Negative giảm còn 1,431; tại 0.50, Recall chỉ 17.1% với 5,821 ca bị bỏ sót. Đổi lại, Precision giảm còn 31.5% và False Positive tăng lên 12,132. Đây là đánh đổi phù hợp hơn cho sàng lọc sớm, không phải chẩn đoán.";
  }

  if (/(cramer|top 5|yeu to)/.test(normalized)) {
    return en
      ? "Top five categorical associations by Cramér's V are GenHlth 0.2816, HighBP 0.2543, DiffWalk 0.2053, HighChol 0.1949, and Age 0.1891. They are associated with diabetes in this dataset; the analysis does not establish causation."
      : "Top 5 liên hệ phân loại theo Cramér's V: GenHlth 0.2816, HighBP 0.2543, DiffWalk 0.2053, HighChol 0.1949 và Age 0.1891. Đây là các yếu tố có liên hệ trong dữ liệu, không chứng minh quan hệ nhân quả.";
  }

  if (/(shap|consisten|nhat quan|group|thong ke)/.test(normalized)) {
    return en
      ? "Yes, the leading SHAP signals broadly agree with classical statistics: GenHlth is SHAP #1 / Stat #2, BMI #4 / #1, and Age #3 / #7. The study has exactly two groups: Strong Agreement and Under-represented. Lower SHAP rank for factors such as DiffWalk and PhysHlth is interpreted as shared signal or multicollinearity, not as proof of noise."
      : "Có. Các tín hiệu SHAP hàng đầu nhìn chung khớp với thống kê: GenHlth SHAP #1 / Stat #2, BMI #4 / #1 và Age #3 / #7. Nghiên cứu có đúng 2 nhóm: Strong Agreement và Under-represented. DiffWalk/PhysHlth có hạng SHAP thấp hơn được lý giải bởi tín hiệu chia sẻ/đa cộng tuyến, không phải bằng chứng rằng chúng là nhiễu.";
  }

  if (/(context|du lieu|dataset|brfss|bao nhieu mau)/.test(normalized)) {
    return en
      ? "The study uses the cleaned CDC BRFSS 2015 dataset with 229,474 records and 21 predictors. The class balance is 84.7% healthy (194,377) and 15.3% diabetic (35,097), with a stratified 80/20 split and 45,895 test records."
      : "Nghiên cứu dùng CDC BRFSS 2015 đã làm sạch, gồm 229,474 bản ghi và 21 biến dự báo. Phân bố lớp là 84.7% khỏe mạnh (194,377) và 15.3% tiểu đường (35,097), chia stratified 80/20 với 45,895 bản ghi kiểm thử.";
  }

  void PROJECT_CONTEXT;
  return en
    ? "That detail is not available in the study context I was given. I can answer about the dataset, RQ1 effect sizes, the four model metrics, the 0.15 screening threshold, and SHAP/statistical consistency."
    : "Chi tiết đó không có trong context nghiên cứu mình được cung cấp. Mình có thể trả lời về dataset, effect size của RQ1, metrics của 4 mô hình, ngưỡng sàng lọc 0.15 và mức nhất quán giữa SHAP với thống kê.";
}
