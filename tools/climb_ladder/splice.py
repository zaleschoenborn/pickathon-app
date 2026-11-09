# Splice tools/climb_ladder/pk-climb.{css,js} into index.html (replaces the pk-cl-css body and the pk-cl-js script).
import json,re,sys
import os; root=os.getcwd()+'/'
s=open(root+'index.html').read()
css=open(root+'tools/climb_ladder/pk-climb.css').read()
a=s.index('<style id="pk-cl-css">')+len('<style id="pk-cl-css">'); b=s.index('</style>',a)
s=s[:a]+'\n'+css+s[b:]
kit=json.load(open(root+'tools/climb_ladder/kit.json')); yc=json.load(open(root+'tools/climb_ladder/yc.json'))
js=open(root+'tools/climb_ladder/pk-climb.js').read().replace('__KIT__',json.dumps(kit,separators=(',',':'))).replace('__YC__',json.dumps(yc,separators=(',',':')))
c=s.index('<script id="pk-cl-js">'); d=s.index('</script>',c)+len('</script>')
s=s[:c]+'<script id="pk-cl-js">'+js+'</script>'+s[d:]
open(root+'index.html','w').write(s); print('spliced')
