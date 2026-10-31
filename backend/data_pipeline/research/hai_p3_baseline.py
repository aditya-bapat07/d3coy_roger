"""IsolationForest baseline on HAI 21.03 water-treatment (P3) tags.
Protocol fixed before looking at test results:
- train on train1 (normal operation only), features = 7 P3 tags + 1-step differences + 60 s rolling std, standardised on train
- threshold = 99.5th percentile of TRAIN anomaly scores (no test tuning)
- alarm = 30 s rolling mean of score above threshold
- report point-wise precision/recall against attack_P3 and event-level recall (share of attack_P3 segments with >= 1 alarm)
"""
import json, sys
import numpy as np, pandas as pd
from sklearn.ensemble import IsolationForest

tr_path, out = sys.argv[1], sys.argv[2]
te_paths = sys.argv[3:]
TAGS = ["P3_FIT01", "P3_LCP01D", "P3_LCV01D", "P3_LH", "P3_LIT01", "P3_LL", "P3_PIT01"]


def feats(df):
    x = df[TAGS].astype(float)
    d = x.diff().fillna(0).add_suffix("_d1")
    s = x.rolling(60, min_periods=1).std().fillna(0).add_suffix("_std60")
    return pd.concat([x, d, s], axis=1)


tr = pd.read_csv(tr_path)
assert tr["attack"].sum() == 0, "train file contains attack rows"
Xtr = feats(tr)
mu, sd = Xtr.mean(), Xtr.std().replace(0, 1)
Xtr = (Xtr - mu) / sd

model = IsolationForest(n_estimators=200, max_samples=4096, random_state=42, n_jobs=-1).fit(Xtr.values)
s_tr = -model.score_samples(Xtr.values)
thr = float(np.percentile(s_tr, 99.5))
per_file = []
TP = FP = FN = EV = HIT = FA = 0
NH = 0.0
for te_path in te_paths:
    te = pd.read_csv(te_path)
    Xte = (feats(te) - mu) / sd
    s_te = -model.score_samples(Xte.values)
    alarm = pd.Series(s_te).rolling(30, min_periods=1).mean().values > thr
    y = te["attack_P3"].values.astype(bool)
    tp = int((alarm & y).sum()); fp = int((alarm & ~y).sum()); fn = int((~alarm & y).sum())
    seg = (y != np.roll(y, 1)).cumsum()
    events = [g.index.values for _, g in pd.Series(y).groupby(seg) if g.iloc[0]]
    hit = int(sum(alarm[e].any() for e in events))
    fa = pd.Series(alarm & ~y)
    fa_ep = int(((fa != fa.shift()).cumsum()[fa]).nunique())
    nh = float((~y).sum()) / 3600
    per_file.append(dict(file=te_path.split("/")[-1], rows=len(te), attack_P3_seconds=int(y.sum()), events=len(events),
                         events_detected=hit, tp=tp, fp=fp, fn=fn, false_alarm_episodes=fa_ep, normal_hours=round(nh, 1)))
    TP += tp; FP += fp; FN += fn; EV += len(events); HIT += hit; FA += fa_ep; NH += nh
prec = TP / (TP + FP) if TP + FP else 0.0
rec = TP / (TP + FN) if TP + FN else 0.0
res = dict(
    dataset="HAI 21.03 (github.com/icsdataset/hai), CC BY-SA 4.0 per README", train_file="hai-21.03/train1.csv.gz",
    label="attack_P3 (water-treatment process: pumping between reservoirs, Siemens S7-300 PLC)", tags=TAGS,
    rows_train=len(tr), protocol=__doc__.strip(), threshold_from_train_p99_5=round(thr, 5),
    totals=dict(pointwise_precision=round(prec, 3), pointwise_recall=round(rec, 3), tp=TP, fp=FP, fn=FN,
                attack_P3_events=EV, events_detected=HIT, event_recall=round(HIT / EV, 3) if EV else None,
                false_alarm_episodes=FA, normal_hours=round(NH, 1),
                false_alarm_episodes_per_24h=round(FA / NH * 24, 2) if NH else None),
    per_file=per_file,
    note="Point-wise and event-level metrics, not eTaPR. HAI recommends eTaPR for comparison with published results; do not compare these numbers to HAICon leaderboards. Baseline only: one model, one threshold fixed from training data, no tuning on test files.")
json.dump(res, open(out, "w"), indent=1)
print(json.dumps(res["totals"], indent=1)); [print(f) for f in res["per_file"]]
