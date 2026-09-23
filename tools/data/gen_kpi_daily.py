import random, json, math
random.seed(7)
REV=[55.7,54.7,60.1,55.3,43.5,42.8,57.1,62.2,58.1,62.8,59.7,43.6,46.6,69.7,62.9,64.6,69.7,73.9,50.8,49.8,76.4,66.4]
S=round(sum(REV),1); print('rev sum',S)
# daily orders: target sum 2418, AOV ~ 5320 +- 4%
def gen_orders():
    for attempt in range(2000):
        aov=[5320*(1+random.uniform(-.045,.045)) for _ in REV]
        o=[round(r*1e4/a) for r,a in zip(REV,aov)]
        d=2418-sum(o)
        # distribute the difference on the largest days
        idx=sorted(range(22),key=lambda i:-REV[i])
        k=0
        while d!=0:
            i=idx[k%22]; s=1 if d>0 else -1; o[i]+=s; d-=s; k+=1
        a=[r*1e4/x for r,x in zip(REV,o)]
        if 5060<=min(a) and max(a)<=5600: return o
ORD=gen_orders(); print('orders',ORD,sum(ORD)); print('aov range',min(r*1e4/o for r,o in zip(REV,ORD)),max(r*1e4/o for r,o in zip(REV,ORD)))
# refunds: sum 44, mostly 1-3
REF=[2,1,3,2,1,2,2,3,2,2,1,1,2,3,2,2,3,2,1,2,3,2]
print('ref sum',sum(REF))
# hourly revenue 9/22, sums to 66.4
shape=[.6,.35,.2,.15,.15,.3,.9,1.8,3.2,4.4,4.9,4.6,3.8,4.2,4.8,5.0,4.6,4.1,3.6,4.0,4.6,4.2,3.0,1.6]
tot=sum(shape); H=[round(x/tot*66.4,1) for x in shape]
d=round(66.4-sum(H),1); H[15]=round(H[15]+d,1); print('hourly',H,round(sum(H),1))
