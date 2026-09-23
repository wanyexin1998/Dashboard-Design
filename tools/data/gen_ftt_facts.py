# Offline generator for the FTT fact tables. Everything is integer tenths (万元×10) or integer orders, with exact marginals.
import math, json, datetime
REV=[55.7,54.7,60.1,55.3,43.5,42.8,57.1,62.2,58.1,62.8,59.7,43.6,46.6,69.7,62.9,64.6,69.7,73.9,50.8,49.8,76.4,66.4]
ORD=[100,105,116,108,83,78,110,115,107,118,111,85,91,134,115,121,132,137,96,95,139,122]
REG=['华东','华南','华北','西南','华中','其他']
RT=[412.6,298.3,236.5,171.2,102.4,65.4]
RO=[705,544,456,361,222,130]   # 区域客单价不同：华东 5,852 … 华中 4,613 元；合计仍是 2,418 单
assert abs(sum(RT)-1286.4)<1e-9 and sum(RO)==2418 and abs(sum(REV)-1286.4)<1e-6 and sum(ORD)==2418
def ipf(w,rows,cols,it=500):
    w=[r[:] for r in w]
    for _ in range(it):
        for i,r in enumerate(w):
            s=sum(r); w[i]=[v*rows[i]/s for v in r]
        for j in range(len(cols)):
            s=sum(w[i][j] for i in range(len(w)))
            for i in range(len(w)): w[i][j]*=cols[j]/s
    return w
def controlled_round(w,rows,cols):
    """Round a real matrix to integers keeping integer row and column sums exact (greedy on residuals)."""
    n,m=len(w),len(w[0]);R=[[math.floor(v) for v in r] for r in w];res=[[w[i][j]-R[i][j] for j in range(m)] for i in range(n)]
    rd=[rows[i]-sum(R[i]) for i in range(n)];cd=[cols[j]-sum(R[i][j] for i in range(n)) for j in range(m)]
    assert sum(rd)==sum(cd)
    while any(rd):
        best=None
        for i in range(n):
            if rd[i]<=0: continue
            for j in range(m):
                if cd[j]<=0: continue
                if best is None or res[i][j]>res[best[0]][best[1]]: best=(i,j)
        if best is None: raise SystemExit('no cell')
        i,j=best;R[i][j]+=1;res[i][j]-=1;rd[i]-=1;cd[j]-=1
    return R
def wobble(d,r,seed):  # deterministic variation per day/region
    return 1+0.09*math.sin(1.7*d+2.3*r+seed)+0.05*math.cos(0.9*d*(r+1)+seed*1.3)
# ---- region × day revenue (tenths) ----
w=[[RT[r]*wobble(d,r,0.4) for r in range(6)] for d in range(22)]
w=ipf(w,[v*10 for v in REV],[v*10 for v in RT])
RD=controlled_round(w,[round(v*10) for v in REV],[round(v*10) for v in RT])
# ---- region × day orders ----
w=[[RO[r]*wobble(d,r,1.1)*(RD[d][r]/max(1,sum(RD[d]))/(RT[r]/1286.4)) for r in range(6)] for d in range(22)]
w=ipf(w,ORD,RO)
ROD=controlled_round(w,ORD,RO)
# ---- region × channel orders: channel ticket sizes differ (直营 > 分销 > 电商); columns = channel orders ----
REG_CH=[[186.4,121.0,105.2],[130.2,96.7,71.4],[101.8,80.2,54.5],[72.5,52.3,46.4],[40.1,33.6,28.7],[25.1,18.9,21.4]]
CHO=[944,761,713]            # 直营 5,891 · 分销 5,292 · 电商 4,595 元
FRESH,REPEAT=1012,1406       # KPI order mix (新客 / 复购)
assert sum(CHO)==2418
AOV=[RT[r]*1e4/RO[r] for r in range(6)];FC=[1.12,1.0,0.87]
w=[[REG_CH[r][c]*1e4/(AOV[r]*FC[c]) for c in range(3)] for r in range(6)]
w=ipf(w,RO,CHO)
RCO=controlled_round(w,RO,CHO)
# ---- channel × segment orders: rows = channel orders, columns = 新客 / 复购 ----
w=ipf([[402,643],[338,419],[272,344]],CHO,[FRESH,REPEAT])
CSO=controlled_round(w,CHO,[FRESH,REPEAT])
# ---- August 2026 daily (1st is Saturday) : 1–22 sums to 1184.5 / 2149 ; month 1656.4 / 3023 ----
aug_start=datetime.date(2026,8,1)
def base_series(n,start,scale):
    out=[]
    for i in range(n):
        wd=(start+datetime.timedelta(days=i)).weekday()
        f=0.75 if wd>=5 else 1.0
        out.append(scale*f*(1+0.06*math.sin(i*0.8+0.5)+0.03*math.cos(i*1.9)))
    return out
def fit(vals,target_tenths):
    s=sum(vals);x=[v*target_tenths/s for v in vals];R=[math.floor(v) for v in x];rem=target_tenths-sum(R)
    order=sorted(range(len(x)),key=lambda i:-(x[i]-R[i]))
    for i in order[:rem]: R[i]+=1
    return R
a=base_series(31,aug_start,55)
AUGR=fit(a[:22],11845)+fit(a[22:],16564-11845)
AUGO=fit([v*1.9 for v in a[:22]],2149)+fit([v*1.9 for v in a[22:]],3023-2149)
# ---- September 2025 daily (1st is Monday) : 1–22 sums to 1060.5 / 2044 ----
s25=base_series(22,datetime.date(2025,9,1),48)
LYR=fit(s25,10605);LYO=fit([v*1.93 for v in s25],2044)
# checks
assert [sum(r) for r in RD]==[round(v*10) for v in REV] and [sum(RD[d][r] for d in range(22)) for r in range(6)]==[round(v*10) for v in RT]
assert [sum(r) for r in ROD]==ORD and [sum(ROD[d][r] for d in range(22)) for r in range(6)]==RO
assert sum(AUGR[:22])==11845 and sum(AUGR)==16564 and sum(AUGO[:22])==2149 and sum(AUGO)==3023 and sum(LYR)==10605 and sum(LYO)==2044
js='  const FACT={\n'
js+='    regionDayRev:'+json.dumps(RD).replace(' ','')+', // 9/1–9/22 × 6 区域，单位 0.1 万元；行和 = 逐日营收，列和 = 区域本月\n'
js+='    regionDayOrd:'+json.dumps(ROD).replace(' ','')+', // 同上，订单数\n'
js+='    augRev:'+json.dumps(AUGR).replace(' ','')+', // 2026/8/1–8/31，0.1 万元；前 22 天 = 1,184.5，全月 = 1,656.4\n'
js+='    augOrd:'+json.dumps(AUGO).replace(' ','')+',\n'
js+='    lyRev:'+json.dumps(LYR).replace(' ','')+', // 2025/9/1–9/22，0.1 万元；合计 1,060.5\n'
js+='    lyOrd:'+json.dumps(LYO).replace(' ','')+',\n'
js+='    regionChOrd:'+json.dumps(RCO).replace(' ','')+', // 9/1–9/22 区域 × 渠道订单；行和 = 区域订单，列和 = 渠道订单\n'
js+='    chSegOrd:'+json.dumps(CSO).replace(' ','')+' // 渠道 × 客群订单；列和 = 新客 1,012 / 复购 1,406\n  };\n'
open('facts.js','w').write(js)
print(js[:600])
print('aug 1-22',sum(AUGR[:22])/10,'month',sum(AUGR)/10,'ly',sum(LYR)/10)
print('max region-day',max(max(r) for r in RD)/10,'min',min(min(r) for r in RD)/10)

print('region AOV',[round(RT[r]*1e4/RO[r]) for r in range(6)])
print('RCO',RCO,'cols',[sum(RCO[r][c] for r in range(6)) for c in range(3)])
print('channel AOV',[round(sum(REG_CH[r][c] for r in range(6))*1e4/CHO[c]) for c in range(3)])
print('cell AOV',[[round(REG_CH[r][c]*1e4/RCO[r][c]) for c in range(3)] for r in range(6)])
print('CSO',CSO,[[round(v) for v in row] for row in [[198.0e4/CSO[0][0],358.1e4/CSO[0][1]],[171.4e4/CSO[1][0],231.3e4/CSO[1][1]],[139.6e4/CSO[2][0],188.0e4/CSO[2][1]]]])
