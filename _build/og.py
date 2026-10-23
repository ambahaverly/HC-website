# -*- coding: utf-8 -*-
"""Renders 1200x630 share images (used by LinkedIn, X, Teams, Slack previews).

Called automatically by build.py. Needs Playwright with Chromium:
    pip install playwright && python -m playwright install chromium
If Playwright isn't available, existing images are kept and any missing ones
fall back to a copy of assets/og/home.jpg.
"""
import html
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "og")
FONTS = os.path.join(HERE, "fonts")

TEMPLATE = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Archivo;src:url("file://%(fonts)s/archivo.ttf");font-weight:100 900;font-stretch:62%% 125%%}
@font-face{font-family:Plex;src:url("file://%(fonts)s/plex.ttf");font-weight:100 700}
@font-face{font-family:PlexMono;src:url("file://%(fonts)s/plexmono.ttf")}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{background:#0B2C34;color:#E8EFF1;font-family:Plex,sans-serif;position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(#24505A 1px,transparent 1px),linear-gradient(90deg,#24505A 1px,transparent 1px);
 background-size:56px 28px;opacity:.45;-webkit-mask-image:linear-gradient(100deg,transparent 40%%,#000 90%%)}
.wrap{position:absolute;inset:0;padding:56px 72px 0;display:flex;flex-direction:column}
.logo{background:#fff;border-radius:4px;padding:10px 14px;align-self:flex-start;display:flex}
.logo svg{height:64px;width:auto}
.eyebrow{font-family:PlexMono,monospace;font-size:22px;letter-spacing:.12em;text-transform:uppercase;color:#E1A548;margin-top:44px}
h1{font-family:Archivo,sans-serif;font-weight:800;font-stretch:82%%;line-height:1.04;letter-spacing:-.01em;margin-top:16px;max-width:1020px}
.by{font-size:26px;color:#A3B8BE;margin-top:20px;max-width:980px;line-height:1.35}
.foot{position:absolute;left:0;right:0;bottom:0;height:64px;background:#103842;display:flex;align-items:center;justify-content:space-between;padding:0 72px;
 font-family:PlexMono,monospace;font-size:20px;letter-spacing:.06em;color:#A3B8BE;border-top:4px solid #E1A548}
.foot b{color:#E8EFF1;font-weight:400}
</style></head><body><div class="grid"></div><div class="wrap">
<div class="logo">%(logo)s</div>
<p class="eyebrow">%(eyebrow)s</p>
<h1 id="t">%(title)s</h1>
%(byline)s
</div>
<div class="foot"><b>haverlyconsulting.co.uk</b><span>Housing finance for local government</span></div>
<script>
const t=document.getElementById('t');let size=78;t.style.fontSize=size+'px';
const by=document.querySelector('.by');const limit=by?250:330;
while(t.scrollHeight>limit&&size>40){size-=2;t.style.fontSize=size+'px';}
</script></body></html>"""


def render_cards(cards):
    os.makedirs(OUT, exist_ok=True)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        _fallback(cards)
        return 0
    with open(os.path.join(ROOT, "assets", "img", "logo-wordmark.svg"), encoding="utf-8") as f:
        logo = f.read()
    tmp = os.path.join(HERE, ".og-tmp.html")
    n = 0
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1200, "height": 630})
            for name, eyebrow, title, byline in cards:
                doc = TEMPLATE % {
                    "fonts": FONTS, "logo": logo, "eyebrow": html.escape(eyebrow),
                    "title": html.escape(title),
                    "byline": f'<p class="by">{html.escape(byline)}</p>' if byline else "",
                }
                with open(tmp, "w", encoding="utf-8") as f:
                    f.write(doc)
                page.goto("file://" + tmp)
                page.evaluate("document.fonts.ready")
                page.screenshot(path=os.path.join(OUT, name + ".jpg"), type="jpeg", quality=86)
                n += 1
            browser.close()
    except Exception as exc:  # e.g. Chromium not installed
        print("Share images not rendered:", exc)
        _fallback(cards)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    return n


def _fallback(cards):
    default = os.path.join(OUT, "home.jpg")
    for name, *_ in cards:
        target = os.path.join(OUT, name + ".jpg")
        if not os.path.exists(target) and os.path.exists(default):
            shutil.copy(default, target)
