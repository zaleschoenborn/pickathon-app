# Applies the Artwork chat's poster read (photo-catalog/poster_order_by_year_1999_2026.md, Nov 10) to the FESTIVAL side of the climb posters.
# Named acts take the front places in poster order (tiers listed in order); every act the read does not name keeps its old relative order behind them.
# Touches only the festival rank (climb[y].names[i][1][0] and climbSrc[y].r[i][4]); class and magnitude (TODAY) are untouched.
import json, re, os, unicodedata
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
norm = lambda s: ' '.join(re.sub(r'[^a-z0-9 ]', '', str(s).lower().replace('&', ' and ').replace('+', ' and ')).split())
ORDER = {

 # Nov 11: 1999-2006 from Zale's eight photos of the framed posters (poster_billing_1999_2006_from_framed_posters_draft1.md). Poster spellings; YALIAS maps them to the site's spellings.
 '1999': ['Bingo', 'Séamus Egan', 'Harebrained', 'Little Sue & Lynn Conover', 'Knott Bros.', 'Dickle Bros.', 'Cul an Ti', 'Bob Shoemaker', 'Bossanba', "Fiddlin' Dave's Cajun Band", 'Freak Mountain Ramblers', 'Surefire', 'The Chuck & Dave Show'],
 '2000': ['Kelly Joe Phelps', 'Countrypolitans', 'Séamus Egan', 'Harebrained', 'Little Sue & Lynn Conover', 'Freak Mountain Ramblers', 'Kung Pow Chickens', 'Too Loose Cajun Band', 'TOE', 'Wildcat Wrasslers', 'Casey Neill Trio', '78RPM'],
 '2001': ['Laurie Lewis & Tom Rozum', 'Caleb Klauder', 'Darol Anger & Scott Nygaard', 'Terry Robb', 'Jack Straw', 'Shorty & The Mustangs', 'Harebrained', 'Dickel Brothers', 'Pig Iron', 'Susannah Weaver & Lynn Conover', 'Sam Hill'],
 '2002': ['Laurie Lewis, Tom Rozum & Tom Sauber', 'Tony Furtado', 'The Danny Barnes Band', 'Dirk Powell, Courtney Granger & the Cajun Crew', 'Terry Robb', 'Baby Gramps', 'Sam Hill', 'Harebrained', 'Casey Neill & Friends', 'Spigot', 'Foghorn Leghorn', 'Circus Contraption'],
 '2003': ['Otis Taylor', 'Danny Barnes and the Piano Throwers', 'Jackstraw', 'Foghorn String Band', 'The Roy Kay Trio', 'Crooked Jades', 'El Son del Pueblo', "Casey MacGill's Blue 4", 'Johnny B Connolly', 'Retta and the Smart Fellas', 'Little Sue and Lynn Conover', 'Dylan Thomas Vance', 'Kitchen Syncopators', 'Little Joe', 'Trashcan Joe'],
 '2004': ['Po Girl', 'Jo Miller and the Burly Roughnecks', 'Mark Lemhouse', 'Cascade Colonels', 'Danny Barnes', 'Johnny B Connolly + Friends', 'Cross-Eyed Rosie', 'Leah Larson Band', 'Freak Mountain Ramblers', 'Tallboys', 'The Shiftless Rounders', 'Hillstomp', 'Kenton County Regulators', 'Spigot'],
 '2005': ['Be Good Tanyas', 'Jolie Holland', 'Freakwater', 'Foghorn Stringband', 'Hacienda Brothers', 'Tracy Grammer', 'Danny Barnes Collective', 'Dirty Martini', 'Mary Flower', 'The Shiftless Rounders', 'Crooked Jades', 'The Earl Brothers', 'Jackstraw', 'Dickel Brothers', 'Hunger Mountain Boys', 'Jug Free America'],
 '2006': ['Iris Dement', 'Kelly Joe Phelps', 'Greg Brown', 'CJ Chenier', 'Wood Brothers', 'Wailin Jennys', 'The Avett Brothers', 'The Wilders', 'Darol Anger', 'Danny Barnes', 'Martha Scanlan', 'The Earl Brothers', 'Everybodyfields', 'Kris Delmhorst', 'Stairwell Sisters', 'Little Sue', 'Trashcan Joe', 'Packway Handle', 'Juanita Family'],
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

# Poster spelling -> site spelling, per year (keys and values are normalized with key(), spaces removed).
YALIAS = {
 '1999': {'samusegan': 'seamuseagan', 'dicklebros': 'dickelbrothers', 'bobshoemaker': 'bobschumaker', 'fiddlindavescajunband': 'fiddlindavescajunband', 'thechuckanddaveshow': 'chuckanddaveshow'},
 '2000': {'samusegan': 'seamuseagan'},
 '2001': {'darolangerandscottnygaard': 'darolangerscottnygaardandtyenorth', 'jackstraw': 'jackstraw', 'shortyandthemustangs': 'themustangs', 'susannahweaverandlynnconover': 'lynnconover', 'calebklauder': 'calebklauderband'},
 '2002': {'laurielewistomrozumandtomsauber': 'laurielewisandtomrozum', 'dirkpowellcourtneygrangerandthecajuncrew': 'dirkpowellcourtneygrangerandfriends', 'caseyneillandfriends': 'caseyneillandlittlesue'},
 '2003': {'crookedjades': 'thecrookedjades', 'caseymacgillsblue4': 'caseymacgillsblue4trio', 'dylanthomasvance': 'dylanthomasvanceanddavidlipkind', 'theroykaytrio': 'roykaytrio', 'johnnybconnolly': 'johnnybconnolly'},
 '2004': {'jomillerandtheburlyroughnecks': 'jomillerandherburlyroughnecks', 'dannybarnes': 'dannybarnescollective', 'johnnybconnollyandfriends': 'johnnybconnolly', 'tallboys': 'thetallboys', 'theshiftlessrounders': 'theshiftlessrounders', 'kentoncountyregulators': 'thekentoncountyregulators'},
 '2005': {'begoodtanyas': 'thebegoodtanyas', 'crookedjades': 'thecrookedjades', 'theearlbrothers': 'theearlbrothers', 'hungermountainboys': 'thehungermountainboys', 'theshiftlessrounders': 'theshiftlessrounders'},
 '2006': {'cjchenier': 'cjchenierandtheredhotlouisianaband', 'woodbrothers': 'thewoodbrothers', 'wailinjennys': 'thewailinjennys', 'theavettbrothers': 'theavettbrothers', 'thewilders': 'thewilders', 'theearlbrothers': 'theearlbrothers', 'everybodyfields': 'theeverybodyfields', 'stairwellsisters': 'thestairwellsisters', 'packwayhandle': 'thepackwayhandleband', 'juanitafamily': 'juanitafamilyband'},
}
d = json.load(open(os.path.join(SITE, 'data.json')))
# Nov 10: Broken Social Scene is not in 2019 (draft 120: DID NOT PLAY; played 2018 only).
nn = lambda s: norm(s).replace('yildirim', 'yildirim')
def key(s):
    k = norm(unicodedata.normalize('NFKD', str(s).lower().replace('ı', 'i').replace('ş', 's')).encode('ascii', 'ignore').decode()).replace(' ', ''); return ALIAS.get(k, k)
for y, names in ORDER.items():
    D = d['climb'][y]; two = len(D.get('labels') or []) > 1; i0 = 0 if two else -1
    SR = (d.get('climbSrc', {}).get(y, {}).get('r') or [])
    ya = YALIAS.get(y, {})
    key2 = lambda s: ya.get(key(s), key(s))
    # One-label years (1999-2004): climb names hold only the TODAY rank, so they are left alone; the festival rank lives in climbSrc r[4] only.
    if two: cur = {key(n): rk[i0] for n, rk in D['names']}; disp = {key(n): n for n, rk in D['names']}
    else: cur = {key(r[0]): r[4] for r in SR}; disp = {key(r[0]): r[0] for r in SR}
    want = []; miss = []
    for n in names:
        k = key2(n)
        if k in cur and k not in want: want.append(k)
        else: miss.append(n)
    rest = sorted([k for k in cur if k not in want], key=lambda k: cur[k])
    new = {k: i for i, k in enumerate(want + rest)}
    if two:
        for it in D['names']:
            it[1][i0] = new[key(it[0])]
    for r in SR:
        k = key(r[0])
        if k in new: r[4] = new[k]
    print(y, 'placed', len(want), 'unmatched in data:', miss, '| unlisted left behind:', [disp[k] for k in rest[:6]])
# Nov 10 (Zale: use the six-month data for proper animated posters): every year whose festival ranks now come from the printed poster order is real billing, so it animates (2005 and earlier stay still posters).
for y in ORDER:
    if y in d.get('climb', {}) and int(y) >= 2006: d['climb'][y]['src'] = 'real billing'
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
