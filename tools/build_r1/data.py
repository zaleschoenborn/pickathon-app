#!/usr/bin/env python3
"""Build with Pickathon, round 1 (Nov 13 2026): the page's words live in data.json `buildPage`.
   Also adds a short `nx` (where it went) to each private build, taken from its own `d` line (no new facts).
   Safe to run again: it replaces buildPage and only sets nx where it is missing.
   Run: python3 tools/build_r1/data.py"""
import json, os
D = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(os.path.dirname(os.path.dirname(D)), 'data.json')
d = json.loads(open(P, encoding='utf-8').read())

d['buildPage'] = {
  "_edit": "Build with Pickathon page (route build). Every word on the page is here; the deadline lines come from buildCopy, the builds from hoods (nx, by, pb, hr) and privateBuilds. {firms} is filled from the 2026 architecture credits; {year} from buildCopy.year.",
  "hero": {"t": "What do you want Pickathon to build for you?", "x": "Leading architects design it. Thousands see it at Pickathon. Then it goes to work at your place, for years.", "im": "i/p9004.jpg", "tour": "Tour the builds", "cta": "Start a project"},
  "went": {"k": "Where the builds went", "t": "Built for one weekend, then sent to work", "chips": [["hood", "Neighborhoods"], ["priv", "Private builds"]], "now": "Now", "skip": "stays on the farm|no downstream|no physical build|^$"},
  "get": {"k": "What you get", "t": "Commission a build, get three things", "items": [
    ["Designed by leading architects", "Firms like {firms} design it for your site."],
    ["Seen by thousands first", "It debuts at Pickathon as a working stage, bar or gathering place, with your name on it."],
    ["Delivered to your site for less", "Then it moves to its permanent home. We aim to come in at least 10% under the open-market price."]]},
  "who": {"k": "Who hires us", "t": "Who we build for", "items": [
    ["Businesses and private owners", "A patio, a stage, a gathering place you already need. You bring the budget."],
    ["Nonprofits and community groups with a budget", "It works the same way: a place your people will use for years."],
    ["Not sure who pays yet", "Tell us anyway. We can help line up a sponsor or community partner."]]},
  "due": {"t": "Proposals for {year} are due Dec 15", "cta": "Start a project", "link": "How Creative Neighborhoods works", "page": "community"},
  "form": {
    "steps": [
      {"id": "kind", "q": "Who are you?", "o": [["biz", "A business or private owner"], ["np", "A nonprofit or community group"], ["pub", "A school or public agency"]]},
      {"id": "builds", "q": "What do you need built?", "o": [["stage", "A stage or performance space"], ["gather", "A gathering place: patio, pavilion, shade"], ["class", "A classroom or learning space"], ["play", "A play or kids’ space"], ["art", "An art piece"], ["other", "Something else"]]},
      {"id": "when", "q": "When do you need it?", "o": [["{year}", "After the {year} festival"], ["{year2}", "After the {year2} festival"]]},
      {"id": "cost", "q": "What’s the budget?", "h": "Your best guess at what it would cost to design and build on the open market.", "o": [["u25", "Under $25k"], ["25-75", "$25k–75k"], ["75-150", "$75k–150k"], ["150p", "$150k+"], ["unsure", "Not sure yet"]]},
      {"id": "fund", "q": "Who is paying for the build?", "o": [["own", "Our organization"], ["sponsor", "A business sponsor"], ["partner", "A community partner or grant"], ["help", "Not sure yet, we'd like help"]]},
      {"id": "about", "q": "Tell us about it"}],
    "f": {"name": "Your name", "org": "Organization", "email": "Email", "what": "What do you picture?", "whatH": "What it is, who will use it, and where it will live after the festival.", "phone": "Phone (optional)", "heard": "How did you hear about this? (optional)"},
    "heard": [["email", "Pickathon email"], ["ig", "Instagram"], ["web", "The website"], ["friend", "A friend"], ["other", "Other"]],
    "of": "of", "next": "Next", "send": "Send", "need": "Still needed: ", "badEmail": "Please check your email address.",
    "done": "Got it. We reply to every one.", "doneX": "We’ll write to {email}.", "doneB": "See the builds",
    "test": "Test version: this form doesn’t send yet."}
}

NX = {"Starburst (on The Bluff)": "Its materials were donated for reuse",
      "Wild Horse": "Its lumber went back to Sabin-Schellenberg construction classes and to PSU’s Oak Savanna outdoor classroom",
      "HQ": "All of its lumber went to construction classes at Sabin-Schellenberg Technical Professional Center"}
for p in d.get('privateBuilds') or []:
    if not p.get('nx') and p.get('n') in NX: p['nx'] = NX[p['n']]

open(P, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
print('data.json buildPage written')
