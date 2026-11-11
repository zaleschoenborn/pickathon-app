# Class table Nov 11 import: what changed

Branch class-nov11. Input /tmp/claude-0/class_table_nov11.csv (2,242 rows; 1,280 carry today_as_of 2026-11-10, the rest are unclassified or non-music). Compared the site before and after the run (yearBill, music only).

## 1. Class changes by year (music, site old -> new)

20 music rows changed class across 1 years. Years not listed had no change.

| Year | Changes |
|---|---|
| 2024 | Deep cut -> Discovery x8; Neither -> Discovery x7; Neither -> Deep cut x5 |

Only 2024 changed: the site's 2024 bill had no Discoveries before, so the 2024 Discoveries are now filled in from the table. Every other year matched the Nov 10 classes (the changes in the table beyond 2024 are in return-year or path fields, not first-class).

## 2. The 25 most notable (Discoveries and Legends gained or lost)

- 2024 Geese: Deep cut -> Discovery
- 2024 LA LOM: Neither -> Discovery
- 2024 Searows: Deep cut -> Discovery
- 2024 Ratboys: Deep cut -> Discovery
- 2024 Dean Johnson: Neither -> Discovery
- 2024 This Is Lorelei: Neither -> Discovery
- 2024 Bella White: Deep cut -> Discovery
- 2024 Fust: Deep cut -> Discovery
- 2024 Water From Your Eyes: Deep cut -> Discovery
- 2024 Ellis Bullard: Deep cut -> Discovery
- 2024 New Constellations: Neither -> Discovery
- 2024 Vincent Neil Emerson: Neither -> Discovery
- 2024 Florry: Deep cut -> Discovery
- 2024 Greg Freeman: Neither -> Discovery
- 2024 Rhododendron: Neither -> Discovery
- 2024 The Macks: Neither -> Deep cut
- 2024 Will Paquin: Neither -> Deep cut
- 2024 Logan Halstead: Neither -> Deep cut
- 2024 Color Green: Neither -> Deep cut
- 2024 Johnny Franco: Neither -> Deep cut

Totals: Discoveries gained 15.

## 3. Home, climb posters, 2024 counts

**Home Before they were big pool.** The archive/Home pool reads archCT (first-year class). build_arch.py was NOT run (see section 6), so archCT is unchanged: 136 Discoveries. A dry run of it against the new table gave the same 723 acts with zero first-year class or year changes, and the table has 136 first-year Discoveries, so the pool is the same size and membership as before. Only data change for the pool: 14 Discovery cards now carry lgNow:1 (data only, no UI): The Avett Brothers, Anaïs Mitchell, Sturgill Simpson, Angel Olsen, Courtney Barnett, Billy Strings, Kamasi Washington, The Weather Station, Thundercat, Alvvays, Margo Price, Charley Crockett, Sierra Hull, Tyler Childers.

**Climb posters.** Run through the page's own pkClimbLive on old vs new data:

- years with climber after: 2001,2002,2004,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2022,2023,2024,2025,2026
- before: 1999,2000,2001,2002,2003,2004,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2022,2023,2024,2025,2026
- 1999: ["HOLY MODAL ROUNDERS",11,0] -> [null,0,0]
- 2000: ["CASEY NEILL TRIO",9,3] -> [null,0,0]
- 2001: ["KEVIN BURKE & CASEY NEILL",10,0] -> ["CLUMSY LOVERS",11,7]
- 2002: ["KEVIN BURKE",6,0] -> ["CASEY NEILL AND LITTLE SUE",5,2]
- 2003: ["DANNY BARNES & TYE NORTH",15,0] -> [null,0,0]
- 2004: ["DANNY BARNES COLLECTIVE",4,0] -> ["THE TALLBOYS",14,4]

The early-year climber changes (1999 to 2004) come from class or magnitude changes on old acts in the table, not from a poster or order change. Worth a look by Artist Classification, since 1999, 2000 and 2003 lose their climber.

**2024 year page counts string** (yearBill music rows): before Legend 5, Discovery 0, Deep cut 34, Neither 15; after Legend 5, Discovery 15, Deep cut 31, Neither 3.

## 4. Rows the site has that the table lacks, and the reverse (music only)

Site rows with no table row: 51 - 2001 Darol Anger & Scott Nygaard; 2001 Laurie Lewis & Tom Rozum; 2001 Little Sue & Lynn Conover; 2002 Baby Gramps; 2002 Circus Contraption; 2002 Danny Barnes; 2002 Danny Barnes and Dirk Powell ("Delilah"); 2002 Foghorn Stringband; 2002 Kevin Burke & Casey Neill; 2002 Spigot; 2002 Tony Furtado; 2003 Casey MacGill's Blue 4; 2004 Danny Barnes; 2004 Jo Miller & The Burly Roughnecks; 2006 Danny Barnes Collective; 2007 Hunger Mt. Boys; 2008 Bad Livers (reunion); 2008 Wayne Hancock; 2009 John Doe & the Sadies; 2010 Blind Boy Paxton; 2010 Bonnie “Prince” Billy & The Cairo Gang; 2010 Seth and May; 2011 Sunday Valley (Sturgill Simpson); 2011 Ted Jones and The Tarheel Boys; 2011 Thao; 2012 Bruce Molsky Band; 2013 Brad Folk & The Bluegrass Playboys; 2013 Caroline Oakley Family Dance Band; 2013 Kurt Vile & The Violators; 2013 Leo Randeau; 2013 Wayne Hancock; 2014 Brownout / Brown Sabbath; 2014 Cahalen Morrison and Country Hammer; 2014 Destroyer (solo); 2014 Ural Thomas and the Pain; 2015 Billy Strings & Don Julin; 2015 The Quebe Sisters Band; 2015 Whitey Morgan; 2016 Ty Segall & The Muggers; 2017 Caroline Oakley & Squaredance Band.
Table music rows with no site row: 36 (by class: Legend 12, (blank) 9, Neither 9, Discovery 3, Deep cut 1, (not classified) 1, not classified 1).
Of those, with a real class: 25 - 2001 Darol Anger / Scott Nygaard / and Tye North (Legend); 2001 Laurie Lewis (Legend); 2002 Casey Neill (Deep cut); 2002 Kevin Burke (Legend); 2002 Laurie Lewis (Legend); 2003 Casey MacGill's Blue 4 Trio (Neither); 2003 dylan thomas vance (Neither); 2004 Danny Barnes Collective (Legend); 2004 Jo Miller (Neither); 2006 C.J. Chenier (Legend); 2006 juanita family (Neither); 2009 John Doe (Legend); 2010 Bonnie "Prince" Billy (Legend); 2012 Bruce Molsky (Legend); 2013 Kurt Vile (Legend); 2014 Cahalen Morrison (Neither); 2014 Destroyer (Legend); 2014 Leroy Thomas (Neither); 2015 Billy Strings (Discovery); 2015 The Quebe Sisters (Legend); 2015 Whitey Morgan & the 78’s (Discovery); 2016 Myke Bogan and Blossom (Neither); 2016 Rapper-Not Rapper feat. Golden Rules (Neither); 2016 Ty Segall (Discovery); 2017 Rapper-Not Rapper with Xenia Rubinos (Neither).
Most of these are name variants (site "Billy Strings & Don Julin" vs table "Billy Strings"; "Kevin Burke & Casey Neill" vs "Kevin Burke"; "Bonnie Prince Billy & The Cairo Gang" vs "Bonnie Prince Billy"), not truly missing acts. They keep their old class on the site because sync_class cannot match them.

Unclassified table rows missing from the site, by year: 2001 2, 2003 1, 2016 1, 2017 2, 2019 1, 2022 2, 2023 1, 2024 1.

## 5. Return-year rows still saying Discovery

62 rows. The guide says this cannot happen.
- 2007 The Avett Brothers (first year 2006), today Discovery
- 2007 The Wood Brothers (first year 2006), today Discovery
- 2008 Langhorne Slim (first year 2007), today Legend
- 2008 Trampled by Turtles (first year 2007), today Discovery
- 2009 Alela Diane (first year 2007), today Discovery
- 2009 Justin Townes Earle (first year 2008), today Discovery
- 2009 Samantha Crain (first year 2008), today Discovery
- 2010 Dr. Dog (first year 2009), today Legend
- 2010 Langhorne Slim (first year 2007), today Legend
- 2011 Alela Diane (first year 2007), today Discovery
- 2011 Pokey LaFarge (first year 2008), today Discovery
- 2012 Alela Diane (first year 2007), today Discovery
- 2012 Blitzen Trapper (first year 2009), today Discovery
- 2012 Langhorne Slim (first year 2007), today Legend
- 2012 The Wood Brothers (first year 2006), today Discovery
- 2012 Typhoon (first year 2010), today Discovery
- 2012 Whitey Morgan & the 78’s (first year 2011), today Discovery
- 2013 Lake Street Dive (first year 2012), today Discovery
- 2013 Sturgill Simpson (first year 2011), today Discovery
- 2013 The Cactus Blossoms (first year 2012), today Discovery
- 2014 Parquet Courts (first year 2013), today Discovery
- 2014 Shakey Graves (first year 2013), today Legend
- 2014 The Barr Brothers (first year 2012), today Discovery
- 2014 The War on Drugs (first year 2012), today Discovery
- 2015 Hiss Golden Messenger (first year 2014), today Discovery
- 2015 JD McPherson (first year 2013), today Discovery
- 2015 Jessica Pratt (first year 2013), today Discovery
- 2015 Mandolin Orange (first year 2014), today Legend
- 2015 Ty Segall (first year 2013), today Discovery
- 2015 Whitey Morgan & the 78’s (first year 2011), today Discovery
- 2016 Cass Mccombs (first year 2012), today Discovery
- 2016 Joseph (first year 2015), today Discovery
- 2016 Kevin Morby (first year 2015), today Discovery
- 2016 Mac DeMarco (first year 2014), today Discovery
- 2016 Thee Oh Sees (first year 2012), today Discovery
- 2016 Ty Segall (first year 2013), today Discovery
- 2017 Billy Strings (first year 2015), today Discovery
- 2017 Hiss Golden Messenger (first year 2014), today Discovery
- 2017 Mandolin Orange (first year 2014), today Legend
- 2017 Ty Segall (first year 2013), today Discovery
- 2018 Alela Diane (first year 2007), today Discovery
- 2018 Ezra Furman (first year 2016), today Discovery
- 2018 Phosphorescent (first year 2012), today Discovery
- 2018 Shakey Graves (first year 2013), today Legend
- 2018 Shovels & Rope (first year 2012), today Discovery
- 2018 The Weather Station (first year 2015), today Discovery
- 2019 Courtney Marie Andrews (first year 2017), today Discovery
- 2019 Julia Jacklin (first year 2017), today Discovery
- 2019 Mandolin Orange (first year 2014), today Legend
- 2022 Hurray for the Riff Raff (first year 2016), today Discovery
- 2022 Mike and the moonpies (first year 2019), today Discovery
- 2022 Valerie June (first year 2014), today Discovery
- 2023 Courtney Marie Andrews (first year 2017), today Discovery
- 2023 Haley Heynderickx (first year 2018), today Discovery
- 2024 Bella White (first year 2022), today Discovery
- 2025 Ellis Bullard (first year 2024), today Discovery
- 2025 Haley Heynderickx (first year 2018), today Discovery
- 2025 Ocie Elliott (first year 2023), today Discovery
- 2025 The Cactus Blossoms (first year 2012), today Discovery
- 2026 Alela Diane (first year 2007), today Discovery
- 2026 Florry (first year 2024), today Discovery
- 2026 The Brothers Comatose (first year 2015), today Discovery

These are carried onto the site as Discovery by sync_class (not changed by me); they need an Artist Classification fix.

## 6. Script warnings and errors

- build_years.py, build_ratings.py, build_src.py, sync_class.py: all exited 0, no warnings or errors printed. build_ratings reported 221 acts that changed class.
- build_ratings.py hard-codes TODAY = '2026-11-10'. Every dated row in the new table also says today_as_of 2026-11-10, so left as is.
- build_ratings.py header and a few comments still name class_table_nov10.csv; comments only, not changed.
- build_arch.py NOT run. Its first argument is a pipe-separated class_rows.txt (year|act|L/D/C|conf|mag), not the CSV, and its genre and story-hook fields come from a lineup_research.json that is not on this machine. A dry run on a copy using an empty rows file plus the CSV gave identical classes and years but wiped genre (716 to 1) and story hooks (114 to 0). Held back rather than guessed.
- build_nonmusic.py needs a WordPress pull JSON and a year; not run.
- lgNow: 14 of 14 Discovery acts with legend_now = yes were tagged in archCT and in past.deep. 21 past.deep entries have no matching table row (older hand-made cards); none were tagged. If build_arch is rerun later, archCT loses lgNow unless that script is taught the field.
