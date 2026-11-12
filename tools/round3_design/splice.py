# Splice tools/round3_design/pk-r3d.html into index.html right after the pk-yg-js script (replaces an existing pk-r3d block). Run from the site root.
import re
s = open('index.html').read(); blk = open('tools/round3_design/pk-r3d.html').read().strip()
s = re.sub(r'<style id="pk-r3d-css">.*?</script>\n', '', s, flags=re.S)
a = s.index('<script id="pk-yg-js">'); b = s.index('</script>', a) + len('</script>')
s = s[:b] + '\n' + blk + s[b:]
open('index.html', 'w').write(s); print('spliced pk-r3d')
