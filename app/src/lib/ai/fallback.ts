import { loadRq1 } from "@/lib/data/load";
import { PROJECT_CONTEXT } from "./system-instruction";

// Derived from the pipeline artifact rather than transcribed, so the offline
// responder cannot drift out of step with the report the way a hard-coded
// ranking did.
const topCramersV = [...loadRq1().categorical]
  .sort((a, b) => b.cramersV - a.cramersV)
  .slice(0, 5)
  .map((row) => `${row.variable} ${row.cramersV.toFixed(3)}`)
  .join(", ");

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
      ? "I cannot diagnose you or provide personalized medical advice. This dashboard reports study results from the analyzed sample only. Please discuss personal symptoms or treatment with a qualified clinician."
      : "Mình không thể chẩn đoán hoặc đưa ra tư vấn y khoa cá nhân. Dashboard này chỉ trình bày kết quả nghiên cứu trên mẫu dữ liệu được phân tích. Bạn nên trao đổi triệu chứng hoặc điều trị với bác sĩ/chuyên gia y tế có chuyên môn.";
  }

  if (/(tom tat|summary|summarize|3 rq|ket luan)/.test(normalized)) {
    return en
      ? "RQ1: General health and high blood pressure lead categorical associations, while BMI has the largest numeric rank-biserial effect in the sample. RQ2: XGBoost achieves the highest mean 5-fold CV PR-AUC; lowering the decision threshold prioritizes recall for screening. RQ3: SHAP signals align with statistical evidence across four evidence groups. These findings represent sample associations and model predictive signals, not population causality or diagnoses."
      : "RQ1: GenHlth và HighBP dẫn đầu liên hệ phân loại trong mẫu; BMI có hiệu ứng số lớn nhất. RQ2: XGBoost đạt 5-fold CV PR-AUC trung bình cao nhất; điều chỉnh ngưỡng sàng lọc giúp ưu tiên Recall. RQ3: SHAP căn chỉnh với bằng chứng thống kê qua 4 nhóm căn chỉnh. Đây là các liên hệ trong mẫu và tín hiệu mô hình, không phải quan hệ nhân quả hay chẩn đoán.";
  }

  if (/(pr-?auc|accuracy|mat can bang|imbalanc)/.test(normalized)) {
    return en
      ? "PR-AUC is primary because only 13.9% of records belong to the positive prediabetes/diabetes class. Accuracy can be misleading by favoring the 86.1% majority without reported diabetes, while PR-AUC focuses on positive class retrieval."
      : "PR-AUC được ưu tiên vì lớp dương gộp tiền tiểu đường/tiểu đường chỉ chiếm 13.9%. Accuracy có thể gây ngộ nhận nếu thiên về 86.1% mẫu không ghi nhận tiểu đường; PR-AUC tập trung trực tiếp vào khả năng truy xuất ca dương tính.";
  }

  if (/(threshold|nguong|0\.13|0\.15|false negative|bo sot)/.test(normalized)) {
    return en
      ? "Adjusting the screening threshold lowers false negatives and raises recall above 80% on the holdout test set. The trade-off is lower precision and an increase in false positive follow-up flags, which is acceptable in early non-invasive screening."
      : "Hạ ngưỡng sàng lọc giúp giảm số ca bỏ sót (False Negative) và nâng Recall lên trên 80% trên tập kiểm thử độc lập. Đánh đổi lại là Precision thấp hơn và số ca cần kiểm tra theo dõi (False Positive) tăng lên, đây là đánh đổi chấp nhận được trong sàng lọc ban đầu.";
  }

  if (/(cramer|top 5|yeu to)/.test(normalized)) {
    return en
      ? `Top categorical associations by Cramér's V: ${topCramersV}. These indicate strong marginal associations within the analyzed sample, but do not imply direct clinical causation.`
      : `Top liên hệ phân loại theo Cramér's V: ${topCramersV}. Đây là các chỉ số có liên hệ mẫu mạnh, nhưng không suy ra mối quan hệ nhân quả.`;
  }

  if (/(shap|consisten|nhat quan|group|thong ke)/.test(normalized)) {
    return en
      ? "Yes, leading SHAP signals broadly align with classical statistical effect sizes. The Effect-Size–SHAP Evidence Alignment framework classifies predictors into 4 groups: Consistent high evidence, Meaningful marginal association with lower model salience, Model-salient with weak marginal association, and Weak evidence."
      : "Có. Các tín hiệu SHAP hàng đầu nhìn chung căn chỉnh tốt với effect size thống kê. Khung Effect-Size–SHAP Evidence Alignment chia các biến thành 4 nhóm: Consistent high evidence, Meaningful marginal association với lower model salience, Model-salient với weak marginal association, và Weak evidence.";
  }

  if (/(context|du lieu|dataset|brfss|bao nhieu mau)/.test(normalized)) {
    return en
      ? "The study uses the CDC BRFSS 2015 dataset with 253,680 records (including 24,206 repeated feature profiles retained due to lack of respondent IDs). Class balance is 86.1% without reported diabetes (218,334) and 13.9% prediabetes/diabetes positive class (35,346), evaluated on a stratified 80/20 split."
      : "Nghiên cứu sử dụng dữ liệu CDC BRFSS 2015 gồm 253,680 bản ghi (bao gồm 24,206 bản ghi lặp lại về mặt đặc trưng được giữ lại do thiếu ID người tham gia). Tỷ lệ phân bố là 86.1% không ghi nhận tiểu đường (218,334) và 13.9% lớp dương tiền tiểu đường/tiểu đường (35,346), được đánh giá trên phân tách phân tầng 80/20.";
  }

  void PROJECT_CONTEXT;
  return en
    ? "That detail is not available in the study context I was given. I can answer about the dataset, RQ1 effect sizes, model metrics, screening threshold, and SHAP/statistical alignment."
    : "Chi tiết đó không có trong context nghiên cứu mình được cung cấp. Mình có thể trả lời về dataset, effect size của RQ1, metrics của các mô hình, ngưỡng sàng lọc và mức căn chỉnh giữa SHAP với thống kê.";
}
