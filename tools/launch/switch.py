#!/usr/bin/env python3
"""The launch switch: one command flips the page head between TEST and LIVE.

  python3 tools/launch/switch.py status   # say which state index.html is in
  python3 tools/launch/switch.py on       # LIVE: real title, search engines allowed, link-preview tags, test bar hidden
  python3 tools/launch/switch.py off      # TEST (the default): "(test)" title, noindex, no link-preview tags, test bar shown

It rewrites only the block between <!--pk-launch:...--> and <!--/pk-launch--> in index.html.
The LIVE values (address, title, description, preview image) are in tools/launch/launch.json.
See docs/launch-switch.md.
"""
import html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
INDEX = os.path.join(ROOT, 'index.html')
RX = re.compile(r'<!--pk-launch:(on|off)-->.*?<!--/pk-launch-->', re.S)


def block(state, c):
    e = lambda s: html.escape(str(s), quote=True)
    if state == 'off':
        inner = ('<title>' + e(c['title']) + ' (test)</title>'
                 '<meta name="description" content="' + e(c['description']) + '">'
                 '<meta name="robots" content="noindex">')
    else:
        base = c['siteUrl'].rstrip('/') + '/'
        img = base + c['image'].lstrip('/')
        tags = [
            '<title>' + e(c['title']) + '</title>',
            '<meta name="description" content="' + e(c['description']) + '">',
            '<link rel="canonical" href="' + e(base) + '">',
            '<meta property="og:type" content="website">',
            '<meta property="og:site_name" content="Pickathon">',
            '<meta property="og:title" content="' + e(c['title']) + '">',
            '<meta property="og:description" content="' + e(c['description']) + '">',
            '<meta property="og:url" content="' + e(base) + '">',
            '<meta property="og:image" content="' + e(img) + '">',
            '<meta property="og:image:width" content="' + e(c['imageWidth']) + '">',
            '<meta property="og:image:height" content="' + e(c['imageHeight']) + '">',
            '<meta property="og:image:alt" content="' + e(c['imageAlt']) + '">',
            '<meta name="twitter:card" content="summary_large_image">',
            '<meta name="twitter:title" content="' + e(c['title']) + '">',
            '<meta name="twitter:description" content="' + e(c['description']) + '">',
            '<meta name="twitter:image" content="' + e(img) + '">',
            '<meta name="twitter:image:alt" content="' + e(c['imageAlt']) + '">',
        ]
        if c.get('hideTestBar', True):
            tags.append('<script>window.PK_LIVE=true</script>')
        inner = ''.join(tags)
    return '<!--pk-launch:' + state + '-->' + inner + '<!--/pk-launch-->'


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
    if cmd not in ('on', 'off', 'status'):
        sys.exit(__doc__)
    s = open(INDEX, encoding='utf-8').read()
    found = RX.findall(s)
    if len(found) != 1:
        sys.exit('index.html must hold exactly one pk-launch block; found %d' % len(found))
    if cmd == 'status':
        print('index.html is ' + ('LIVE (on)' if found[0] == 'on' else 'TEST (off)'))
        return
    c = json.load(open(os.path.join(HERE, 'launch.json'), encoding='utf-8'))
    if cmd == 'on' and not os.path.exists(os.path.join(ROOT, c['image'])):
        sys.exit('preview image not found: ' + c['image'])
    new = RX.sub(lambda m: block(cmd, c), s)
    open(INDEX, 'w', encoding='utf-8').write(new)
    print('index.html is now ' + ('LIVE (on)' if cmd == 'on' else 'TEST (off)') + ('' if new != s else ' (no change)'))


if __name__ == '__main__':
    main()
