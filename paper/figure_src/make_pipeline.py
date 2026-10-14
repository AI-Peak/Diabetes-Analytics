"""Generate pipeline_method.drawio (open in draw.io / diagrams.net, then File > Export as PNG/PDF)."""
import os
from xml.sax.saxutils import escape

OUT = os.path.dirname(os.path.abspath(__file__))
PAGE_W, PAGE_H = 1000, 770
FS, FS_CONT, FS_EDGE = 14, 16, 13

COL = {"blue": ("#2F6DB5", "#EAF2FB"), "orange": ("#D9731F", "#FDEFE0"), "green": ("#2E8B57", "#E7F4EC")}

N = {}
def node(i, x, y, w, h, color, head="", body="", kind="box"):
    N[i] = dict(x=x, y=y, w=w, h=h, color=color, head=head, body=body, kind=kind)

# legend
node("lg1", 20, 10, 24, 16, "blue", kind="legend")
node("lg2", 280, 10, 24, 16, "orange", kind="legend")
node("lg3", 640, 10, 24, 16, "green", kind="legend")

# core pipeline: two rows of four
rows = [("BRFSS 2015", "dataset\n(n = 253,680)"),
        ("Data validation", "missing values,\nranges, targets"),
        ("Statistical analysis", "chi-square tests,\nlogistic regression"),
        ("Data split", "stratified 80/20\n(random state 42)"),
        ("Cross-validation", "5-fold stratified\n(development set)"),
        ("Candidate models", "LR, DT, RF,\nXGBoost"),
        ("Model selection", "highest mean\nPR-AUC"),
        ("Selected model", "XGBoost")]
bw, gap, x0, h1 = 222, 30, 11, 84
for k, (hd, bd) in enumerate(rows):
    node("r%d" % k, x0 + (k % 4) * (bw + gap), 45 if k < 4 else 165, bw, h1, "blue", hd, bd)

# threshold selection module
node("c_sel", 10, 285, 980, 235, "orange", "Threshold selection (development set only)", kind="container")
node("oof", 30, 335, 190, 84, "orange", "Out-of-fold predictions", "from 5-fold CV")
node("ths", 270, 335, 190, 84, "orange", "Threshold search", "0.01 to 0.99")
node("dia", 510, 322, 190, 110, "orange", body="Recall ≥ 0.80?", kind="diamond")
node("sel", 750, 335, 220, 84, "orange", "Selected threshold t*", "highest Precision\nwith Recall ≥ 0.80")

# final evaluation
node("c_fin", 10, 550, 980, 200, "green", "Final evaluation and interpretation (independent holdout set)", kind="container")
cards = [("Independent\nholdout evaluation", "(20% split,\nn = 50,736)"),
         ("Discrimination", "ROC-AUC, PR-AUC\n(95% bootstrap CI)"),
         ("Classification", "at selected t*:\nPrecision, Recall,\nSpecificity, F1-score"),
         ("Calibration", "Brier score,\ncalibration slope,\nintercept"),
         ("Interpretability", "SHAP vs. effect-size\nranking")]
for k, (hd, bd) in enumerate(cards):
    node("f%d" % k, 14 + k * 198, 595, 180, 140, "green", hd, bd)

R, L, T, B = (1, .5), (0, .5), (.5, 0), (.5, 1)
E = []
for k in (0, 1, 2, 4, 5, 6):
    E.append(("r%d" % k, R, "r%d" % (k + 1), L, "", []))
E.append(("r3", B, "r4", T, "", [(878, 147), (122, 147)]))
E.append(("r7", B, "c_sel", (0.8857, 0), "", []))
E.append(("oof", R, "ths", L, "", []))
E.append(("ths", R, "dia", L, "", []))
E.append(("dia", R, "sel", L, "yes", []))
E.append(("dia", B, "ths", B, "no", [(605, 455), (365, 455)]))
E.append(("c_sel", B, "c_fin", T, "", []))
for k in range(4):
    E.append(("f%d" % k, R, "f%d" % (k + 1), L, "", []))

def drawio():
    cells, cid, ids = [], [2], {}
    def nid():
        cid[0] += 1
        return cid[0]
    font = "fontFamily=Helvetica;fontColor=#222222;fontSize=%d;"
    for i in ["c_sel", "c_fin"] + [k for k in N if k not in ("c_sel", "c_fin")]:
        n = N[i]
        s, f = COL[n["color"]]
        ids[i] = nid()
        if n["kind"] == "container":
            v = "<b>%s</b>" % escape(n["head"])
            style = ("rounded=1;arcSize=3;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=%s;strokeWidth=1.5;"
                     "verticalAlign=top;align=left;spacingLeft=12;spacingTop=6;" % s) + font % FS_CONT
        elif n["kind"] == "legend":
            v = ""
            style = "rounded=1;fillColor=%s;strokeColor=%s;strokeWidth=1.25;" % (f, s)
        else:
            if n["head"]:
                v = "<b>%s</b><br>%s" % (escape(n["head"]).replace("\n", "<br>"), escape(n["body"]).replace("\n", "<br>"))
            else:
                v = escape(n["body"])
            shape = "rhombus" if n["kind"] == "diamond" else "rounded=1;arcSize=10"
            style = ("%s;whiteSpace=wrap;html=1;fillColor=%s;strokeColor=%s;strokeWidth=1.25;" % (shape, f, s)) + font % FS
        cells.append('<mxCell id="%d" value="%s" style="%s" vertex="1" parent="1">'
                     '<mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
                     % (ids[i], escape(v, {'"': "&quot;"}), style, n["x"], n["y"], n["w"], n["h"]))
    for txt, x in [("Core pipeline", 52), ("Threshold selection module (dev. only)", 312), ("Final evaluation (holdout)", 672)]:
        cells.append('<mxCell id="%d" value="%s" style="text;html=0;align=left;verticalAlign=middle;fontFamily=Helvetica;fontSize=%d;" vertex="1" parent="1">'
                     '<mxGeometry x="%d" y="9" width="300" height="18" as="geometry"/></mxCell>' % (nid(), txt, FS_EDGE, x))
    for a, aa, b, ba, lab, wp in E:
        style = ("edgeStyle=orthogonalEdgeStyle;rounded=0;html=0;endArrow=block;endFill=1;strokeColor=#555555;strokeWidth=1.5;"
                 "exitX=%s;exitY=%s;entryX=%s;entryY=%s;fontFamily=Helvetica;fontSize=%d;" % (aa[0], aa[1], ba[0], ba[1], FS_EDGE))
        pts = "".join('<mxPoint x="%d" y="%d"/>' % p for p in wp)
        geo = '<mxGeometry relative="1" as="geometry">%s</mxGeometry>' % (('<Array as="points">%s</Array>' % pts) if wp else "")
        cells.append('<mxCell id="%d" value="%s" style="%s" edge="1" parent="1" source="%d" target="%d">%s</mxCell>'
                     % (nid(), lab, style, ids[a], ids[b], geo))
    xml = ('<mxfile host="app.diagrams.net"><diagram id="pipeline" name="Pipeline">'
           '<mxGraphModel dx="1000" dy="%d" grid="1" gridSize="10" page="1" pageWidth="%d" pageHeight="%d">'
           '<root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram></mxfile>'
           % (PAGE_H, PAGE_W, PAGE_H, "".join(cells)))
    with open(os.path.join(OUT, "pipeline_method.drawio"), "w", encoding="utf-8") as fh:
        fh.write(xml)

if __name__ == "__main__":
    drawio()
    print("done")
