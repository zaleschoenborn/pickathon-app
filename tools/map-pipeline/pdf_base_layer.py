import pikepdf,re,subprocess,sys
src='/mnt/user-data/uploads/Pickathon_2026_AudienceMap_36x48_Labels_and_Icons_Off_2.pdf'
cs=open('/tmp/vp/cs.txt','rb').read()
keep=set(list(range(0,39))+[44,45,47,48])
c=re.sub(rb'BT.*?ET',b'',cs,flags=re.S)
c=re.sub(rb'\n(?:f\*?|S|s|B\*?|b\*?|sh)\n',b'\nn\n',c)
c=re.sub(rb'/(?!Fm)[A-Za-z]+\d* Do',b'',c)
c=re.sub(rb'/Fm(\d+) Do',lambda m:m.group(0) if int(m.group(1)) in keep else b'',c)
pre=b'q 0.059 0.086 0.071 rg 0 0 2592 3456 re f Q\n'
pdf=pikepdf.open(src);page=pdf.pages[0];page.Contents=pdf.make_stream(pre+c);pdf.save('/tmp/bk/baseB.pdf')
subprocess.run(['pdftoppm','-r','200','-png','-singlefile','-x','254','-y','281','-W','4898','-H','9144','/tmp/bk/baseB.pdf','/tmp/bk/baseB'],check=True,timeout=600)
