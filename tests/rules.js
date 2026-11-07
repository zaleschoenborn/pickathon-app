// Regression rules: every bug Zale reports becomes one entry here so it can't come back.
// Each rule runs inside the page after the standard checks.
//   id:    short name used in site_issues.md
//   why:   the report it came from (date + plain words)
//   when:  optional filter on {size, mode, target} — return false to skip
//   run:   in-page function (no outside variables) returning [{m, s}] problems
module.exports = [
  {
    id: 'listen-covers',
    why: 'Nov 6: buttons should never sit where the Listen dock can run over them',
    run: () => {
      const dock = [...document.querySelectorAll('[aria-label^="Listen"]')].map((b) => { let p = b; while (p && p !== document.body && getComputedStyle(p).position !== 'fixed') p = p.parentElement; return p && p !== document.body ? p : null; }).find((p) => p && p.checkVisibility());
      if (!dock) return [];
      const d = dock.getBoundingClientRect(); const out = [];
      for (const b of document.querySelectorAll('button,a[href],[role=button]')) {
        if (dock.contains(b) || !b.checkVisibility({ checkOpacity: true })) continue;
        let fx = false; for (let p = b; p; p = p.parentElement) if (getComputedStyle(p).position === 'fixed') { fx = true; break; } if (fx) continue;
        const r = b.getBoundingClientRect(); const w = Math.min(r.right, d.right) - Math.max(r.left, d.left), h = Math.min(r.bottom, d.bottom) - Math.max(r.top, d.top);
        if (w > 6 && h > 6) { out.push({ m: 'Listen dock covers a button', s: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 30) }); if (out.length > 2) break; }
      }
      return out;
    },
  },
  {
    id: 'popup-close',
    why: 'Nov 5: every popup or sheet needs a visible X (not only the opening button)',
    when: (o) => o.target.kind === 'panel',
    run: () => {
      const m = [...document.querySelectorAll('[aria-modal=true],[role=dialog],nav[aria-label=More]')].find((e) => e.checkVisibility() && !e.closest('[aria-label="Cookie choices"]'));
      if (!m) return [];
      const x = [...m.querySelectorAll('button,[role=button]')].find((b) => b.checkVisibility() && /close|✕|×|done/i.test((b.getAttribute('aria-label') || '') + b.textContent));
      return x ? [] : [{ m: 'open panel has no visible close (X) button', s: (m.getAttribute('aria-label') || m.className || '').toString().slice(0, 30) }];
    },
  },
  {
    id: 'bar-covers',
    why: 'Nov 7 (rotation check): on a sideways phone the Home hero\'s "Why Pickathon" button sat half under the bottom tab bar; buttons must never sit partly under the fixed tab bar or header',
    when: (o) => o.touch,
    run: () => {
      if (scrollY > 10) return []; // only the first screen a visitor sees; mid-scroll overlap is normal
      const bars = [...document.querySelectorAll('nav, header, [role=tablist]')].map((b) => { let p = b; while (p && p !== document.body && getComputedStyle(p).position !== 'fixed' && getComputedStyle(p).position !== 'sticky') p = p.parentElement; return p && p !== document.body ? p : null; }).filter((p, i, a) => p && a.indexOf(p) === i && p.checkVisibility() && !p.closest('[aria-modal=true],nav[aria-label=More]'));
      const out = [];
      for (const b of document.querySelectorAll('button.pk-cta, a.pk-cta, .pk-bkb, .pk-sqb, button[class*="cta"]')) {
        if (!b.checkVisibility({ checkOpacity: true }) || bars.some((x) => x.contains(b))) continue;
        const r = b.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight) continue;
        for (const x of bars) { const d = x.getBoundingClientRect(); const h = Math.min(r.bottom, d.bottom) - Math.max(r.top, d.top); const w = Math.min(r.right, d.right) - Math.max(r.left, d.left);
          if (w > 10 && h > 6 && h < r.height - 2) { out.push({ m: 'button partly hidden under the ' + (d.top > innerHeight / 2 ? 'bottom tab bar' : 'header') + ' (' + Math.round(h) + 'px of ' + Math.round(r.height) + ')', s: (b.textContent || '').trim().slice(0, 30) }); break; } }
        if (out.length > 2) break;
      }
      return out;
    },
  },
];
