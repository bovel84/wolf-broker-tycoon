#!/usr/bin/env python3
"""Ricostruisce wolf-broker-tycoon.html pulito, senza template literals, senza <script> nei commenti."""
import re, os, shutil

BASE = os.path.dirname(os.path.abspath(__file__))

def read_file(name):
    with open(os.path.join(BASE, name), 'r') as f:
        return f.read()

def clean_script_tags(js):
    """Rimuove riferimenti a <script> nei commenti JS per non rompere l'HTML."""
    js = re.sub(r'<script[^>]*>', 'SCRIPT_TAG', js)
    js = js.replace('</script>', 'SCRIPT_CLOSE')
    return js

def convert_template_literals(js_code):
    """Converte i template literals `...` in concatenazione di stringhe con apici singoli."""
    result = []
    i = 0
    n = len(js_code)
    while i < n:
        if js_code[i] == '`':
            i += 1
            template_parts = []
            current_text = ''
            while i < n:
                if js_code[i] == '\\' and i + 1 < n:
                    current_text += js_code[i:i+2]
                    i += 2
                elif js_code[i] == '`':
                    if current_text:
                        template_parts.append(('text', current_text))
                    i += 1
                    break
                elif js_code[i] == '$' and i + 1 < n and js_code[i+1] == '{':
                    if current_text:
                        template_parts.append(('text', current_text))
                        current_text = ''
                    i += 2
                    depth = 1
                    expr = ''
                    while i < n and depth > 0:
                        if js_code[i] == '{':
                            depth += 1
                        elif js_code[i] == '}':
                            depth -= 1
                            if depth == 0:
                                break
                        expr += js_code[i]
                        i += 1
                    i += 1
                    template_parts.append(('expr', expr))
                else:
                    current_text += js_code[i]
                    i += 1
            # Converti in concatenazione
            if len(template_parts) == 0:
                result.append("''")
            elif len(template_parts) == 1 and template_parts[0][0] == 'text':
                text = template_parts[0][1]
                text = text.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\t", "\\t")
                result.append("'" + text + "'")
            else:
                concat_parts = []
                for ptype, pval in template_parts:
                    if ptype == 'text':
                        text = pval.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\t", "\\t")
                        if text:
                            concat_parts.append("'" + text + "'")
                    else:
                        concat_parts.append("(" + pval + ")")
                if concat_parts:
                    result.append(" + ".join(concat_parts))
                else:
                    result.append("''")
        else:
            result.append(js_code[i])
            i += 1
    return ''.join(result)

# 1. Leggi index.html originale
html_orig = read_file('index.html')

# Estrai CSS
css_match = re.search(r'<style>(.*?)</style>', html_orig, re.DOTALL)
orig_css = css_match.group(1) if css_match else ''

# Estrai body senza script
body_match = re.search(r'<body>(.*)</body>', html_orig, re.DOTALL)
orig_body = body_match.group(1) if body_match else ''
orig_body_no_js = re.sub(r'<script[^>]*>.*?</script>', '', orig_body, flags=re.DOTALL)

# Estrai JS del gioco originale
script_matches = re.findall(r'<script[^>]*>(.*?)</script>', orig_body, re.DOTALL)
game_orig_js = '\n'.join(s for s in script_matches if len(s) > 100)

# 2. Processa tutti i moduli JS
module_files = [
    'market-engine.js',
    'game-engine.js',
    'ui-engine.js',
    'story-engine.js',
    'llm-news-engine.js',
    'llm-game-master.js',
    'competitor-engine.js',
    'world-engine.js',
    'corporate-lifecycle.js',
    'broker-story.js',
    'player-life.js',
    'brokerage-career.js',
]

modules = []
for fname in module_files:
    js = read_file(fname)
    js = clean_script_tags(js)
    if '`' in js:
        js = convert_template_literals(js)
        remaining = js.count('`')
        print(f"  {fname}: converted template literals, {remaining} backticks remaining")
    else:
        print(f"  {fname}: no template literals")
    modules.append(js)

# 3. CSS aggiuntivi
mobile_css = """@media (max-width:1024px){.grid-2{grid-template-columns:1fr!important}.grid-3{grid-template-columns:1fr 1fr!important}.kpi-row{grid-template-columns:repeat(3,1fr)!important}.main{padding:10px}.news-feed{max-height:300px}}@media (max-width:640px){*{touch-action:manipulation;-webkit-tap-highlight-color:transparent}body{font-size:13px;padding-bottom:60px;padding-top:env(safe-area-inset-top)}.topbar{flex-wrap:wrap;height:auto!important;padding:6px 10px;gap:6px}.topbar .logo{font-size:15px}.cash-display{gap:8px;flex-wrap:wrap;margin-left:0;width:100%}.stat-mini .val{font-size:12px}.stat-mini .label{font-size:9px}.week-display{padding:4px 8px}.week-display .wk{font-size:14px}.btn-advance{padding:6px 14px;font-size:12px}.lvl-badge{font-size:10px;padding:3px 8px}.nav{display:none!important}.main{padding:8px}.kpi-row{grid-template-columns:1fr 1fr!important;gap:6px}.kpi{padding:8px}.kpi .val{font-size:15px}.kpi .label{font-size:9px}.grid-2,.grid-3{grid-template-columns:1fr!important}.card{padding:10px;margin-bottom:8px}.card h3{font-size:11px}table{font-size:12px;display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap}th,td{padding:6px 8px}.section-filter button{padding:3px 8px;font-size:10px}.search-box{width:100%;margin-bottom:6px}.chart-container canvas{max-height:180px!important}.chart-container{padding:8px}.modal{max-width:100%!important;width:100%!important;max-height:100vh!important;border-radius:0!important}.modal-overlay{padding:0!important}.modal-body{padding:12px!important}.modal-header{padding:10px 12px!important}.trade-row input,.trade-row select{min-height:44px;font-size:15px}.trade-actions button{min-height:44px}.btn{min-height:40px;padding:8px 14px}.btn-sm{min-height:36px}.news-feed{max-height:250px}.news-item{padding:6px 8px}.career-track{flex-wrap:wrap;gap:4px}.career-step{flex:1 1 30%;font-size:10px;padding:6px 2px}.career-step .cs-name{font-size:10px}.career-stats{grid-template-columns:1fr}.ticker-bar{height:22px}.ticker-content{animation-duration:90s;font-size:11px}.ticker-item{font-size:11px}.assembly-card{padding:10px}.proposal-item{padding:8px}.save-slot{padding:8px;flex-direction:column;gap:6px;align-items:flex-start}#wolfTitleScreen{padding:20px}.wolf-title{font-size:28px!important}.wolf-subtitle{font-size:13px!important;margin-bottom:24px}.wolf-btn{width:100%;padding:12px;font-size:16px}.bottom-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:var(--bg2);border-top:1px solid var(--border);height:56px;z-index:50;padding-bottom:env(safe-area-inset-bottom)}.bottom-nav button{flex:1;background:none;border:none;color:var(--text2);font-size:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px}.bottom-nav button.active{color:var(--blue)}.bottom-nav button .bn-label{font-size:9px}}.bottom-nav{display:none}@media (prefers-reduced-motion:reduce){.ticker-content{animation:none!important}*{transition:none!important;animation:none!important}}"""

title_css = "#wolfTitleScreen{position:fixed;inset:0;background:radial-gradient(ellipse at center,#1a1a2e 0%,#0a0a0a 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity .6s}#wolfTitleScreen.hide{opacity:0;pointer-events:none}.wolf-title{font-size:clamp(28px,6vw,64px);font-weight:900;color:#d4af37;text-align:center;letter-spacing:2px;text-shadow:0 0 30px rgba(212,175,55,.4);margin-bottom:8px}.wolf-subtitle{font-size:clamp(14px,2.5vw,20px);color:#8a96b0;text-align:center;margin-bottom:40px;letter-spacing:3px}.wolf-btn{padding:14px 48px;font-size:18px;font-weight:700;border:none;border-radius:8px;cursor:pointer;margin:6px;transition:transform .15s,box-shadow .2s}.wolf-btn-new{background:linear-gradient(135deg,#d4af37,#b5832a);color:#000;box-shadow:0 4px 20px rgba(212,175,55,.3)}.wolf-btn-new:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(212,175,55,.5)}.wolf-btn-load{background:linear-gradient(135deg,#1e2740,#161d2e);color:#d4af37;border:1px solid #d4af33}.wolf-btn-load:hover{transform:translateY(-2px)}.wolf-btn-load:disabled{opacity:.3;cursor:not-allowed;transform:none}.wolf-credits{position:absolute;bottom:20px;font-size:11px;color:#555}#mobileMoreMenu{display:none;position:fixed;bottom:56px;left:0;right:0;background:var(--bg2);border-top:1px solid var(--border);padding:10px;z-index:49}"

# 4. HTML per titolo e bottom nav
title_html = '<div id="wolfTitleScreen"><div class="wolf-title">\U0001f43a WOLF OF WALL STREET</div><div class="wolf-subtitle">B R O K E R &nbsp; T Y C O O N</div><button class="wolf-btn wolf-btn-new" onclick="wolfStartGame()">NUOVA PARTITA</button><button class="wolf-btn wolf-btn-load" id="wolfLoadBtn" onclick="wolfLoadGame()" disabled>CARICA</button><div class="wolf-credits">Un gioco di trading, potere e redenzione \u00b7 2026</div></div>'

bottom_nav = """<nav class="bottom-nav" id="bottomNav"><button onclick="wolfSwitchView('dashboard')" class="active">\U0001f4ca<span class="bn-label">Dashboard</span></button><button onclick="wolfSwitchView('market')">\U0001f4c8<span class="bn-label">Mercato</span></button><button onclick="wolfSwitchView('portfolio')">\U0001f4bc<span class="bn-label">Portafoglio</span></button><button onclick="wolfSwitchView('brokerage')">\U0001f3e6<span class="bn-label">Società</span></button><button onclick="toggleMobileMoreMenu()">\u22ee<span class="bn-label">Altro</span></button></nav><div id="mobileMoreMenu"><button class="btn" style="display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px" onclick="wolfSwitchView('assembly');toggleMobileMoreMenu()">\U0001f3db\ufe0f Assemblee</button><button class="btn" style="display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px" onclick="wolfSwitchView('news');toggleMobileMoreMenu()">\U0001f4f0 Notizie</button><button class="btn" style="display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px" onclick="wolfSwitchView('transactions');toggleMobileMoreMenu()">\U0001f4cb Transazioni</button><button class="btn" style="display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px" onclick="wolfSwitchView('career');toggleMobileMoreMenu()">\U0001f3af Carriera</button><button class="btn" style="display:block;width:100%;text-align:left;min-height:44px" onclick="wolfSwitchView('save');toggleMobileMoreMenu()">\U0001f4be Salvataggio</button><button class="btn" style="display:block;width:100%;text-align:left;min-height:44px" onclick="wolfSwitchView('settings');toggleMobileMoreMenu()">\u2699\ufe0f Impostazioni</button></div>"""

# 5. JS di integrazione
integration_js = """
function wolfStartGame(){document.getElementById('wolfTitleScreen').classList.add('hide');setTimeout(function(){document.getElementById('wolfTitleScreen').style.display='none'},600);if(typeof newGame==='function')newGame()}
function wolfLoadGame(){if(typeof loadAuto==='function'&&loadAuto()){document.getElementById('wolfTitleScreen').classList.add('hide');setTimeout(function(){document.getElementById('wolfTitleScreen').style.display='none'},600);if(typeof renderAll==='function')renderAll()}}
function wolfSwitchView(v){if(typeof switchView==='function'){switchView(v);return}document.querySelectorAll('.view').forEach(function(el){el.classList.remove('active')});var el=document.getElementById('view-'+v);if(el)el.classList.add('active')}
function toggleMobileMoreMenu(){var m=document.getElementById('mobileMoreMenu');if(m)m.style.display=(m.style.display==='block')?'none':'block'}
try{var hasSave=false;for(var i=1;i<=5;i++){if(localStorage.getItem('sbt_save_'+i)){hasSave=true;break}}if(localStorage.getItem('sbt_autosave'))hasSave=true;if(hasSave)document.getElementById('wolfLoadBtn').disabled=false}catch(e){}
if(typeof LLMNewsEngine!=='undefined'&&LLMNewsEngine.configure){LLMNewsEngine.configure({model:'glm-5.2',enabled:false})}
if(typeof LLMGameMaster!=='undefined'&&LLMGameMaster.configure){LLMGameMaster.configure({model:'glm-5.2',enabled:false})}
if(typeof CompetitorEngine!=='undefined'){try{window._competitorEngine=new CompetitorEngine();var _md={stocks:(typeof G!=='undefined'&&G&&G.companies)?G.companies.map(function(c){return{symbol:c.ticker,price:c.price,sector:c.sector,volume:c.vol||0,avgVolume:1000000,change:c.change||0}}):[],currentWeek:(typeof G!=='undefined'&&G)?G.week:1};window._competitorEngine.init(_md)}catch(e){}}
var _origAdvance=(typeof advanceTurn==='function')?advanceTurn:function(){};
if(typeof advanceTurn!=='undefined'){window.advanceTurn=function(){_origAdvance();if(window._competitorEngine){try{window._competitorEngine.setMarketData({stocks:(typeof G!=='undefined'&&G&&G.companies)?G.companies.map(function(c){return{symbol:c.ticker,price:c.price,sector:c.sector,volume:c.vol||0,avgVolume:1000000,change:c.change||0}}):[],currentWeek:G?G.week:1});window._competitorEngine.setPlayerData((typeof positions!=='undefined')?Object.keys(positions).map(function(k){return{symbol:k,shares:positions[k].shares}}):[],(typeof cash!=='undefined')?cash:10000,(typeof G!=='undefined'&&G)?G.rep||50:50,(typeof G!=='undefined'&&G)?G.xp||0:0)}catch(e){}}if(typeof LLMNewsEngine!=='undefined'&&LLMNewsEngine.processNewsTurn){var gs={week:(typeof G!=='undefined'&&G)?G.week:1,cash:(typeof cash!=='undefined')?cash:10000,level:(typeof G!=='undefined'&&G)?G.level||1:1,portfolio:(typeof positions!=='undefined')?positions:{},companies:(typeof G!=='undefined'&&G&&G.companies)?G.companies:[]};LLMNewsEngine.processNewsTurn(gs).then(function(r){if(r&&r.length>0&&typeof addNews==='function'){r.forEach(function(n){addNews(n.title,n.impact,n.content)})}}).catch(function(){})}}}
"""

# 6. Assembla tutto
all_js_parts = modules + [game_orig_js, integration_js]
all_js = '\n'.join(all_js_parts)

# Verifica
backticks = all_js.count('`')
braces_o = all_js.count('{')
braces_c = all_js.count('}')
parens_o = all_js.count('(')
parens_c = all_js.count(')')
print(f"\nJS validation:")
print(f"  Backticks: {backticks}")
print(f"  Braces: {braces_o} open, {braces_c} close, diff={braces_o-braces_c}")
print(f"  Parens: {parens_o} open, {parens_c} close, diff={parens_o-parens_c}")

# 7. Assembla HTML
cdn_script = '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>'
style_block = '<style>\n' + orig_css + '\n' + mobile_css + '\n' + title_css + '\n</style>'

final = []
final.append('<!DOCTYPE html>')
final.append('<html lang="it">')
final.append('<head>')
final.append('<meta charset="UTF-8">')
final.append('<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">')
final.append('<title>\U0001f43a Wolf of Wall Street \u2014 Broker Tycoon</title>')
final.append(cdn_script)
final.append(style_block)
final.append('</head>')
final.append('<body>')
final.append(title_html)
final.append(bottom_nav)
final.append(orig_body_no_js)
final.append('<script>')
final.append(all_js)
final.append('</script>')
final.append('</body>')
final.append('</html>')

html_final = '\n'.join(final)

# Verifica finale
script_opens = re.findall(r'<script[^>]*>', html_final)
script_closes = re.findall(r'</script>', html_final)
print(f"\nHTML validation:")
print(f"  Script tags: {len(script_opens)} open, {len(script_closes)} close")

# Verifica no code leak
parts = html_final.split('<script>')
outside = parts[0]
for p in parts[1:]:
    sub = p.split('</script>')
    if len(sub) > 1:
        outside += sub[1]
leak = any(x in outside for x in ['LLM NEWS', 'COMPETITOR', 'window.MarketEngine', 'window.LLMNewsEngine', 'window.CompetitorEngine', 'function(', 'var ', 'const '])
print(f"  Code leak: {'YES' if leak else 'NO'}")

# Scrivi file
out_path = os.path.join(BASE, 'wolf-broker-tycoon.html')
with open(out_path, 'w') as f:
    f.write(html_final)

# Copia opzionale per sviluppo locale
dropbox_dir = os.path.expanduser('~/Dropbox')
dropbox_path = os.path.join(dropbox_dir, 'wolf-broker-tycoon.html')
if os.path.isdir(dropbox_dir):
    shutil.copy2(out_path, dropbox_path)

size = os.path.getsize(out_path)
lines = html_final.count('\n')
print(f"\nDONE: {size} bytes ({size//1024}KB), {lines} lines")
print(f"Local copy: {dropbox_path}" if os.path.isdir(dropbox_dir) else "Local Dropbox copy skipped")
