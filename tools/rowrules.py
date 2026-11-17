# Which class-table Music rows are real acts on a year page (Nov 16, Classification v34): skip duplicate_of rows; skip a merged_into row
# only when it was merged into another act on the SAME year's bill (Tom Rozum into Laurie Lewis); a rename into another year's name
# (Caleb Klauder Band 2001 -> Caleb Klauder) is the same act and stays. Display names go through name_aliases.
import csv, re
from name_aliases import disp
fold = lambda s: re.sub(r'[^a-z0-9]', '', str(s).lower())
def music_rows(path):
    R = [x for x in csv.DictReader(open(path, encoding='utf-8-sig')) if x['lineup'] == 'Music']
    yr = {}
    for x in R: yr.setdefault(x['year'], set()).add(fold(x['act']))
    out = []
    for x in R:
        if (x.get('duplicate_of') or '').strip(): continue
        mi = (x.get('merged_into') or '').strip()
        if mi and fold(mi) in yr[x['year']] and fold(mi) != fold(x['act']): continue
        x = dict(x); x['act'] = disp(x['year'], x['act']); out.append(x)
    return out
