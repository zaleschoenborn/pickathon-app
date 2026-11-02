import pikepdf,re,subprocess,sys,numpy as np,cv2,time
src='/mnt/user-data/uploads/Pickathon_2026_AudienceMap_36x48_Labels_and_Icons_Off_2.pdf'
cs=open('/tmp/vp/cs.txt','rb').read()
base=re.sub(rb'BT.*?ET',b'',cs,flags=re.S)
base=re.sub(rb'\n(?:f\*?|S|s|B\*?|b\*?|sh)\n',b'\nn\n',base)
base=re.sub(rb'/(?!Fm)[A-Za-z]+\d* Do',b'',base)
pdf=pikepdf.open(src);page=pdf.pages[0]
ks=[int(a) for a in sys.argv[1].split(',')]
for k in ks:
    t=time.time()
    c=re.sub(rb'/Fm(\d+) Do',lambda m:m.group(0) if int(m.group(1))==k else b'',base)
    pre=b'q 1 0 1 rg 0 0 2592 3456 re f Q\n'
    page.Contents=pdf.make_stream(pre+c);pdf.save(f'/tmp/bk/vf/k{k}.pdf')
    subprocess.run(['pdftoppm','-r','200','-png','-singlefile','-x','254','-y','281','-W','4898','-H','9144','-aaoff' if False else '-r','200',f'/tmp/bk/vf/k{k}.pdf',f'/tmp/bk/vf/k{k}'],check=True,timeout=600)
    im=cv2.imread(f'/tmp/bk/vf/k{k}.png')
    m=~((im[...,0]>240)&(im[...,1]<20)&(im[...,2]>240))
    np.save(f'/tmp/bk/vf/m{k}.npy',np.packbits(m,axis=1)); print(k,m.sum(),time.time()-t,flush=True)
