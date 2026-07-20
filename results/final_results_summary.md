# Final Results Summary

## Dataset & Split
- **Total Records:** 253,680
- **Features:** 21
- **Class 0 (No reported diabetes):** 218,334 (86.07%)
- **Class 1 (Prediabetes or diabetes):** 35,346 (13.93%)
- **Development Set:** 202,944
- **Holdout Test Set:** 50,736

## Selected Model & Threshold
- **Selected Model:** XGBoost
- **Selection Criterion:** Primary = Mean 5-Fold CV PR-AUC on Development Set, Tie-break = Mean CV ROC-AUC
- **Selected Screening Threshold:** 0.13

## Holdout Test Performance (Selected Threshold)
- **PR-AUC:** 0.4238
- **ROC-AUC:** 0.8272
- **Recall:** 0.8099
- **Precision:** 0.2991
- **Specificity:** 0.6928
- **F1-score:** 0.4369
- **Accuracy:** 0.7091
