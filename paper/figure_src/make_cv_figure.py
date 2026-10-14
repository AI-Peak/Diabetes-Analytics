"""Redraw Fig. 3 (5-fold CV model comparison) from results/modeling/cv_model_comparison.csv.

Value labels sit above each marker so they never touch the error bars.
"""
import os
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CSV = os.path.join(ROOT, "results", "modeling", "cv_model_comparison.csv")
OUT = os.path.join(HERE, "..", "images", "cv_model_comparison.png")

df = pd.read_csv(CSV).sort_values("Mean_PR_AUC", ascending=True).reset_index(drop=True)
best = df["Mean_PR_AUC"].idxmax()

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11})
fig, axes = plt.subplots(1, 2, figsize=(10, 3.9), sharey=True)
panels = [("Mean_PR_AUC", "Std_PR_AUC", "Mean CV PR-AUC", "(a) PR-AUC (primary selection metric)"),
          ("Mean_ROC_AUC", "Std_ROC_AUC", "Mean CV ROC-AUC", "(b) ROC-AUC")]

for ax, (m, sd, xlabel, title) in zip(axes, panels):
    lo = (df[m] - df[sd]).min()
    hi = (df[m] + df[sd]).max()
    pad = (hi - lo) * 0.18
    for y, row in df.iterrows():
        c = "#2563EB" if y == best else "#64748B"
        ax.errorbar(row[m], y, xerr=row[sd], fmt="o", color=c, ecolor=c, elinewidth=1.8,
                    capsize=4, markersize=7, zorder=3)
        ax.text(row[m], y + 0.30, "%.4f" % row[m], ha="center", va="bottom", fontsize=10,
                fontweight="bold" if y == best else "normal", color=c)
    ax.set_xlim(lo - pad, hi + pad)
    ax.set_ylim(-0.6, len(df) - 0.1)
    ax.set_yticks(range(len(df)))
    ax.set_yticklabels(df["Model"], fontsize=11)
    ax.set_xlabel(xlabel, fontsize=11)
    ax.set_title(title, fontsize=11.5, fontweight="bold")
    ax.grid(axis="x", color="#E5E7EB", linewidth=0.8)
    ax.set_axisbelow(True)
    for sp in ("top", "right"):
        ax.spines[sp].set_visible(False)
    ax.tick_params(axis="x", labelsize=10)

fig.tight_layout()
fig.savefig(OUT, dpi=300, bbox_inches="tight", facecolor="white")
print("saved", os.path.abspath(OUT))
