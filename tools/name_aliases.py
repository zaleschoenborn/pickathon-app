# Display spelling for acts whose class-table name differs from Lineup's printed name (Nov 16: Lineup draft 113).
# The class table keeps its own keys; the site shows Lineup's spelling. year -> {class act (lowercase): display}
ALIAS = {
 '2001': {'darol anger / scott nygaard / and tye north': 'Darol Anger & Scott Nygaard'},
 '2002': {'laurie lewis': 'Laurie Lewis, Tom Rozum, and Tom Sauber'},   # Lineup has not said which Laurie Lewis 2002 row is the real one; the unmarked row carries the score
 '2003': {'danny barnes and the piano throwers': 'Danny Barnes and the Piano Throwers', 'dylan thomas vance': 'Dylan Thomas Vance'},
}
def disp(year, act):
    return ALIAS.get(str(year), {}).get(str(act).strip().lower(), act)
