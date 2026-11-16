import zlib,struct,sys
def load(p):
    d=open(p,'rb').read();i=8;idat=b''
    while i<len(d):
        n=struct.unpack('>I',d[i:i+4])[0];t=d[i+4:i+8];c=d[i+8:i+8+n];i+=12+n
        if t==b'IHDR':w,h,bd,ct=struct.unpack('>IIBB',c[:10])
        elif t==b'IDAT':idat+=c
    raw=zlib.decompress(idat);bpp=4 if ct==6 else 3;st=w*bpp;rows=[];prev=bytearray(st);o=0
    for y in range(h):
        f=raw[o];o+=1;line=bytearray(raw[o:o+st]);o+=st
        for x in range(st):
            a=line[x-bpp] if x>=bpp else 0;b=prev[x];c=prev[x-bpp] if x>=bpp else 0
            if f==1:line[x]=(line[x]+a)&255
            elif f==2:line[x]=(line[x]+b)&255
            elif f==3:line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                pa=abs(b-c);pb=abs(a-c);pc=abs(a+b-2*c)
                line[x]=(line[x]+(a if pa<=pb and pa<=pc else b if pb<=pc else c))&255
        rows.append(line);prev=line
    return w,h,bpp,rows
w,h,bpp,rows=load(sys.argv[1])
for arg in sys.argv[2:]:
    x0,y0,x1,y1=map(int,arg.split(','));px=[]
    for y in range(y0,y1):
        for x in range(x0,x1):px.append(tuple(rows[y][x*bpp:x*bpp+3]))
    m=[sum(p[i] for p in px)/len(px) for i in range(3)]
    sd=(sum(sum((p[i]-m[i])**2 for i in range(3)) for p in px)/len(px)/3)**.5
    print(arg,'#%02x%02x%02x'%tuple(round(v) for v in m),'sd=%.1f'%sd)
