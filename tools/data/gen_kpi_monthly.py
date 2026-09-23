REV_M=[1186.4,1003.7,1178.9,1204.6,1248.3,1297.1,None,1656.4,1286.4]
ytd=11466.0
REV_M[6]=round(ytd-sum(x for x in REV_M if x is not None),1)
print('monthly rev',REV_M,round(sum(REV_M),1))
AOV=[5040,4980,5090,5130,5180,5240,5330,5480,None]
ORD_M=[round(r*1e4/a) for r,a in zip(REV_M[:8],AOV[:8])]+[2418]
print('orders',ORD_M,sum(ORD_M))
RR=[.024,.025,.023,.022,.021,.022,.021,.022]
REF_M=[round(o*r) for o,r in zip(ORD_M[:8],RR)]+[44]
print('refunds',REF_M,sum(REF_M), [round(a/b*100,2) for a,b in zip(REF_M,ORD_M)])
MG=[.366,.359,.371,.374,.378,.376,.380,.373,.384]
OT=[.978,.969,.976,.979,.982,.984,.976,.948,.9644]
ymargin=sum(r*m for r,m in zip(REV_M,MG))/sum(REV_M); yot=sum(o*t for o,t in zip(ORD_M,OT))/sum(ORD_M)
q=slice(6,9); qrev=sum(REV_M[q]); qord=sum(ORD_M[q]); qref=sum(REF_M[q])
qmargin=sum(r*m for r,m in zip(REV_M[q],MG[q]))/qrev; qot=sum(o*t for o,t in zip(ORD_M[q],OT[q]))/qord
print('year margin',ymargin,'year ontime',yot,'year aov',ytd*1e4/sum(ORD_M),'year refund',sum(REF_M)/sum(ORD_M))
print('Q rev',qrev,'Q ord',qord,'Q aov',qrev*1e4/qord,'Q margin',qmargin,'Q ontime',qot,'Q refund',qref/qord)
print('Q rate vs 4750',qrev/4750,'time',84/92)
print('Y rate',ytd/15600,'time',265/365)
print('M rate',1286.4/1800,'time',22/30)
