# Applies the Artwork chat's poster read (photo-catalog/poster_order_by_year_1999_2026.md, Nov 10) to the FESTIVAL side of the climb posters.
# Named acts take the front places in poster order (tiers listed in order); every act the read does not name keeps its old relative order behind them.
# Touches only the festival rank (climb[y].names[i][1][0] and climbSrc[y].r[i][4]); class and magnitude (TODAY) are untouched.
import json, re, os
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
norm = lambda s: ' '.join(re.sub(r'[^a-z0-9 ]', '', str(s).lower().replace('&', ' and ').replace('+', ' and ')).split())
ORDER = {
 '2016': ['Jeff Tweedy', 'Yo La Tengo', 'Beach House'],   # press only: the three headliners named first and together; the tail is not distinguishable
 '2017': ['Charles Bradley & His Extraordinaires', 'Dinosaur Jr.', 'Drive-By Truckers', 'Deer Tick', 'Ty Segall', 'Mandolin Orange', 'A-WA', 'J. Mascis', 'Dungen',
          'Jonathan Richman', 'Hiss Golden Messenger', 'Robyn Hitchcock', 'Xenia Rubinos', 'Pinegrove', 'Big Thief', 'Billy Strings', 'Julia Jacklin'],
 '2018': ['Broken Social Scene', 'Shakey Graves', 'Phosphorescent', 'Built To Spill', 'Shovels & Rope', 'The Blind Boys of Alabama',
          'Rising Appalachia', "I'm With Her", 'Tinariwen', 'Daniel Norgren', 'Sheer Mag',
          'Colter Wall', 'DakhaBrakha', 'Sunflower Bean', 'Jamila Woods', 'Ezra Furman', 'Orkesta Mendoza', 'Kikagaku Moyo', 'Hailu Mergia', 'Jen Cloher', 'Phil Cook',
          'The War and Treaty', 'Wild Child', 'Sam Amidon', 'Haley Heynderickx', 'Haram', 'Sera Cahoone', 'Glorietta', 'Bedouine', 'Low Cut Connie', 'Alela Diane',
          'Karl Blau', 'Wand', 'Shinyribs', 'Lonnie Holley', 'The Weather Station', 'Charley Crockett', 'Sierra Hull', 'Joshua Hedley', 'Michael Nau',
          'Lost Bayou Ramblers', 'Revel in Dimes', 'John Craigie', 'The Dead Tongues', 'Milo', 'Mapache', 'Danny Barnes Trio', 'Paul Cauthen', 'Black Pumas',
          'Frazey Ford', "Zephaniah O'Hora", 'Rasheed Jamal', 'Overcoats', 'Caleb Klauder & Reeb Willms', 'Cut Worms', 'Circuit des Yeux', 'Bee Bee Sea',
          'Marisa Anderson', 'House and Land', 'Andrew Alli', 'Valley Queen'],
 '2019': ['Nathaniel Rateliff & The Night Sweats', 'Phil Lesh & The Terrapin Family Band', 'Khruangbin', 'Mandolin Orange', 'Tyler Childers', 'Lucius', 'Preservation Hall Jazz Band', 'Fruit Bats', 'Mountain Man', 'Caamp', 'YOB', 'Damien Jurado', 'Lambchop'],
 '2022': ['Valerie June', 'Goth Babe', 'Sons of Kemet', 'Faye Webster', 'Built To Spill', 'Nate Smith + Kinfolk', 'Hurray for the Riff Raff', 'Sampa the Great', 'GZA',
          'Nubya Garcia', 'Chapo Trap House', 'Quantic', 'Armand Hammer', 'Lomelda', 'Cedric Burnside', 'Mike and the Moonpies', 'Inner Wave', "L'Rain",
          'Pearl Charles', 'Cassandra Jenkins', 'Yasmin Williams', 'TV Priest', 'Thee Sacred Souls', 'Feufollet', 'Emma-Jean Thackray', 'Guerilla Toss',
          'Operator Music Band', 'Rachel Baiman', 'Off Book', 'Tobacco City', 'Kassi Valazza', 'The Onlies'],   # the 7+5+6 middle rows are not named in the read; the bottom row is
 '2025': ['Portugal. The Man', 'Forty Feet Tall', 'Rose Gerber', 'Taj Mahal', 'Fruit Bats', 'Greensky Bluegrass', 'Haley Heynderickx', 'Ocie Elliott', 'Reyna Tropical', 'Surprise Chef',
          'Being Dead', 'Cory Hanson', 'Derya Yıldırım & Grup Şimşek', 'Rosali', 'SML', 'The Cactus Blossoms', 'The Rumble'],
 '2026': ['Steve Earle', 'Thee Sinseers', 'Built To Spill', 'The Womack Sisters', 'Mexican Institute of Sound', 'Marcos Valle', 'The Brothers Comatose', 'Meridian Brothers', 'The Altons', 'Shakey Graves'],
}
ALIAS = {'deryayildirimandgrupsimsek': 'deryayildirim', 'calebklauderandreebwillms': 'calebandreeb'}
d = json.load(open(os.path.join(SITE, 'data.json')))
nn = lambda s: norm(s).replace('yildirim', 'yildirim')
def key(s):
    k = norm(str(s).lower().replace('ı', 'i').replace('ş', 's')).replace(' ', ''); return ALIAS.get(k, k)
for y, names in ORDER.items():
    D = d['climb'][y]; two = len(D.get('labels') or []) > 1; i0 = 0 if two else -1
    cur = {key(n): rk[i0] for n, rk in D['names']}
    disp = {key(n): n for n, rk in D['names']}
    want = []; miss = []
    for n in names:
        k = key(n)
        if k in cur and k not in want: want.append(k)
        else: miss.append(n)
    rest = sorted([k for k in cur if k not in want], key=lambda k: cur[k])
    new = {k: i for i, k in enumerate(want + rest)}
    for it in D['names']:
        it[1][i0] = new[key(it[0])]
    for r in (d.get('climbSrc', {}).get(y, {}).get('r') or []):
        k = key(r[0])
        if k in new: r[4] = new[k]
    print(y, 'placed', len(want), 'unmatched in data:', miss, '| unlisted left behind:', [disp[k] for k in rest[:6]])
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
