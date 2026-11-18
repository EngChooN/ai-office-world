import base64, json, re
R='/Users/pc-2311001/gwanak-hiking/'
D=R+'artifacts/greet-popup/'
img=lambda n:'data:image/jpeg;base64,'+base64.b64encode(open(D+'jpg/'+n+'.jpg','rb').read()).decode()
svg=lambda p:re.sub(r'width="24" height="24"','width="100%" height="100%"',open(R+'public/icons/'+p).read())
WAVE=svg('common/c-wave.svg');PAIR=svg('hiking/h-pair.svg');CLOSE=svg('common/c-close.svg')
M={k:json.load(open(D+f'measure-{k}.json'))[k] for k in ['pc','mobile','land']}
C={k:json.load(open(D+f'clean-{k}.json'))[k] for k in ['pc','mobile','land']}
def pct(r,W,H):return r['w']*r['h']/(W*H)*100
# 후 크기(논리 px)
CHIP={'pc':(56,32),'mobile':(40,36),'land':(40,36)}
CARD={'pc':(240,92),'mobile':(236,96),'land':(236,96)}
def chip_box(k):
  t=C[k]['tag'];w,h=CHIP[k];x=t['x']+t['w']+4
  if x+w>C[k]['W']-6:x=t['x']-w-4  # 오른쪽이 모자라면 이름표 왼쪽
  return {'x':x,'y':t['y']+t['h']/2-h/2,'w':w,'h':h}
def card_box(k):
  t=C[k]['tag'];W,H=C[k]['W'],C[k]['H'];w,h=CARD[k];cx=t['x']+t['w']/2
  if k=='land':return {'x':t['x']+t['w']+8,'y':t['y']-6,'w':w,'h':h,'side':1}
  x=max(8,min(W-w-8,cx-w/2));return {'x':x,'y':t['y']-h-10,'w':w,'h':h,'side':0,'tail':cx-x}
def chip_html(k,dim=False):
  b=chip_box(k);kb='<kbd>F</kbd>' if k=='pc' else ''
  return f'<div class="chip{" dim" if dim else ""}" style="left:{b["x"]}px;top:{b["y"]}px;width:{b["w"]}px;height:{b["h"]}px"><i>{WAVE}</i>{kb}</div>'
def card_html(k):
  b=card_box(k);pc=k=='pc'
  tail=f'<b class="tail{" side" if b["side"] else ""}" style="{"left:-7px;top:16px" if b["side"] else "left:"+str(b["tail"]-7)+"px;bottom:-7px"}"></b>'
  return f'''<div class="card" style="left:{b["x"]}px;top:{b["y"]}px;width:{b["w"]}px;height:{b["h"]}px">{tail}
   <div class="ch"><span>바다 <small>· 3m</small></span><button class="x"><i>{CLOSE}</i></button></div>
   <div class="cb"><button class="main"><i>{WAVE}</i>인사{"<kbd>F</kbd>" if pc else ""}</button><button><i>{PAIR}</i>같이 등산하기</button></div>
   <div class="bar"><i></i></div></div>'''
SC={'pc':.4,'mobile':.72,'land':.62}
def panel(k,im,title,sub,over='',hl=None,tag=''):
  W,H=C[k]['W'],C[k]['H'];s=SC[k]
  hb=''
  if hl:hb=f'<div class="hl" style="left:{hl["x"]}px;top:{hl["y"]}px;width:{hl["w"]}px;height:{hl["h"]}px"></div>'
  return f'''<figure class="p {tag}"><figcaption><b>{title}</b><span>{sub}</span></figcaption>
  <div class="frame" style="width:{W*s}px;height:{H*s}px"><div class="vp" style="width:{W}px;height:{H}px;transform:scale({s})"><div class="bg im-{im}" style="width:{W}px;height:{H}px"></div>{hb}{over}</div></div></figure>'''
def nums(k):
  m=M[k];W,H=m['near']['W'],m['near']['H'];c=m['near']['ctx'];cb=chip_box(k);kb=card_box(k)
  return dict(W=W,H=H,before=pct(c,W,H),bw=c['w']/W*100,chip=pct(cb,W,H),card=pct(kb,W,H),c=c)
N={k:nums(k) for k in M}
for k,v in N.items():print(k,{a:(round(b,2) if isinstance(b,float) else b) for a,b in v.items()})
def row(k,label):
  n=N[k]
  before=panel(k,k+'-near','전 · 지금',f'상대가 4m 안·앞쪽에 들어오면 바로 뜸 · 아래 카드 {n["c"]["w"]}×{n["c"]["h"]}px = 화면의 <em>{n["before"]:.1f}%</em>'+(' · 아래 단추 3개와 겹침' if k=='land' else ''),hl=n['c'],tag='before')
  a1=panel(k,k+'-clean','후 ① 근처(4m 안)',f'이름표 옆 작은 칩만 · {CHIP[k][0]}×{CHIP[k][1]}px = <em>{n["chip"]:.2f}%</em> · 큰 도장은 걷기 그대로',over=chip_html(k),tag='after')
  a2=panel(k,k+'-clean','후 ② 펼침(누르거나 2m 안에서 멈춤)',f'머리 위 작은 카드 = <em>{n["card"]:.1f}%</em> · 5초 뒤 저절로 접힘',over=card_html(k),tag='after')
  extra=''
  if k!='land':
    extra=panel(k,k+'-clean','후 ③ 걷는 중·동행 중',f'칩을 흐리게만, 펼치지 않음 · 동행 상대는 칩 없음',over=chip_html(k,True),tag='after')
  return f'<section><h2>{label}</h2><div class="row">{before}{a1}{a2}{extra}</div></section>'
pairnote=f'''<section><h2>지금 문제 한눈에 (실제 게임을 두 명 접속으로 돌려 잼)</h2><div class="facts">
<div><h3>언제 뜨나</h3><p>상대가 <b>4m 안 + 내 앞쪽 좌우 70° 안</b>이면 바로 뜸(3.8m 뜸 · 4.5m 안 뜸). 물건 안내와 달리 사람은 <b>멀어질 때 여유가 없어</b> 4m 경계에서 깜빡일 수 있음.</p></div>
<div><h3>무엇이 바뀌나</h3><p>① 아래 수첩 카드 「인사하기 · 바다 / 자동 걷기 R」가 새로 뜸 ② <b>큰 빨간 도장이 「걷기」→「인사」로 바뀜</b>. 휴대폰에서는 걷기 단추가 사라진 것처럼 보임.</p></div>
<div><h3>얼마나 가리나</h3><p>휴대폰 세로 <b>{N["mobile"]["before"]:.1f}%</b>(폭 {N["mobile"]["bw"]:.0f}%를 가로지름, 상대 몸 아래쪽을 덮음) · 휴대폰 가로 <b>{N["land"]["before"]:.1f}%</b>(방·채팅·사람 단추 3개를 덮음) · PC 1440×900 <b>{N["pc"]["before"]:.1f}%</b>.</p></div>
<div><h3>걷는 중에도</h3><p>자동 걷기 중에도 그대로 뜸. <b>같이 등산하기(동행)로 나란히 걸으면 상대가 늘 1~2m 옆이라 계속 떠 있음</b>(1.5초 간격 6번 확인 6번 모두 뜸).</p></div>
</div>
<div class="row">{panel('mobile','mobile-pair','동행하며 자동 걷기 중 (휴대폰)','동행 칩 + 아래 카드 + 「인사」 도장이 계속 떠 있음',hl=M['mobile']['pair']['ctx'],tag='before')}
{panel('pc','pc-pair','동행하며 자동 걷기 중 (PC)','오른쪽 아래 카드·도장 계속 「인사」',hl=M['pc']['pair']['ctx'],tag='before')}</div></section>'''
rules='''<section><h2>바꾸는 표시 규칙 (인사·같이 등산하기 기능과 서버 규칙은 그대로)</h2>
<table><tr><th>상태</th><th>지금</th><th>후</th></tr>
<tr><td>근처 (4m 안 · 앞쪽 70°)</td><td>아래 수첩 카드 + 도장이 「인사」로</td><td>상대 이름표 오른쪽에 <b>👋 칩</b>(PC는 <kbd>F</kbd> 같이 표시). 큰 도장·아래 카드는 그대로 <b>걷기</b>. 칩 누르기·F = 인사(지금과 같은 동작)</td></tr>
<tr><td>사라지는 거리</td><td>4m 넘으면 바로</td><td><b>5.5m</b> 넘으면 숨김(경계 깜빡임 막기)</td></tr>
<tr><td>펼침</td><td>—</td><td>칩·이름표를 누르거나, <b>2m 안에서 1초 이상 멈춰 서 있으면</b> 머리 위 작은 카드: 「👋 인사 · 🤝 같이 등산하기 · ✕」. 같이 등산하기는 지금 이름표 카드와 같은 제안을 보냄</td></tr>
<tr><td>접힘</td><td>—</td><td><b>5초</b> 동안 아무것도 안 누르면, 3m 밖으로 멀어지면, 걷기 시작하면, ✕ → 다시 칩으로</td></tr>
<tr><td>걷는 중 (직접·자동)</td><td>계속 카드 + 「인사」 도장</td><td>칩만 흐리게(투명 50%), 저절로 펼치지 않음. 펼쳐져 있었으면 바로 접음</td></tr>
<tr><td>동행 상대</td><td>늘 떠 있음</td><td>칩 안 띄움(이름표에 이미 동행 표시). 둘 다 멈춰 2초 지나면 칩 보임</td></tr>
<tr><td>여러 명</td><td>가장 가까운 1명</td><td>같음(칩은 가장 가까운 1명에게만)</td></tr>
<tr><td>이름표 오른쪽이 화면 끝</td><td>—</td><td>칩을 이름표 왼쪽에</td></tr>
<tr><td>머리가 화면 밖</td><td>—</td><td>큰 도장 위쪽에 작은 칩 「👋 바다」로 대신</td></tr>
<tr><td>휴대폰 가로</td><td>카드가 아래 단추 3개를 덮음</td><td>펼침 카드는 위 공간이 모자라면 이름표 <b>옆</b>에(위 HUD·아래 단추와 안 겹침)</td></tr>
<tr><td>물건(안내판·스탬프·샘물 등)과 같이 있을 때</td><td>사람·물건이 한 카드에 섞임</td><td>물건은 지금처럼 도장·카드, 사람은 칩으로 따로</td></tr>
</table>
<p class="note">칩 누르는 칸은 휴대폰에서 44×44px 이상(보이는 크기보다 넓게). 색·종이 톤은 지금 이름표·수첩과 같게, 아이콘은 기존 c-wave·h-pair·c-close.</p></section>'''
cmp=f'''<section><h2>가린 비율 전·후</h2><table class="cmp"><tr><th>화면</th><th>전 (근처면 늘)</th><th>후 ① 근처 (늘)</th><th>후 ② 펼쳤을 때만 (5초)</th></tr>
<tr><td>휴대폰 세로 390×844</td><td>{N["mobile"]["before"]:.1f}%</td><td>{N["mobile"]["chip"]:.2f}%</td><td>{N["mobile"]["card"]:.1f}%</td></tr>
<tr><td>휴대폰 가로 844×390</td><td>{N["land"]["before"]:.1f}% + 단추 3개 덮음</td><td>{N["land"]["chip"]:.2f}%</td><td>{N["land"]["card"]:.1f}% (겹침 없음)</td></tr>
<tr><td>PC 1440×900</td><td>{N["pc"]["before"]:.1f}%</td><td>{N["pc"]["chip"]:.2f}%</td><td>{N["pc"]["card"]:.1f}%</td></tr></table>
<p class="note">넓이 비율 = 새로 뜬 상자 넓이 ÷ 화면 넓이. 큰 도장은 크기가 같아 넓이에 넣지 않았지만, 지금은 글자가 「인사」로 바뀌는 것도 문제입니다. 「후」 화면은 같은 장면 캡처 위에 그린 시안입니다(게임 코드는 안 바꿈).</p></section>'''
css='''body{margin:0;background:#2a2622;color:#f4ead6;font:14px/1.5 -apple-system,"Apple SD Gothic Neo",sans-serif;padding:24px}
h1{font-size:24px;margin:0 0 4px}h1+p{margin:0 0 20px;color:#cbbd9f}h2{font-size:18px;margin:28px 0 10px;border-left:4px solid #c9533a;padding-left:8px}h3{margin:0 0 4px;font-size:15px;color:#ffd99a}
.row{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}.p{margin:0}.p figcaption{max-width:360px;margin-bottom:6px}.p figcaption b{display:block;font-size:15px}.p figcaption span{font-size:12.5px;color:#d8cbb0}.p figcaption em{font-style:normal;color:#ffb36b;font-weight:800}
.p.before figcaption b{color:#ff9d86}.p.after figcaption b{color:#9fe0a6}
.frame{overflow:hidden;border-radius:10px;box-shadow:0 4px 16px #0008;position:relative}.vp{transform-origin:0 0;position:absolute;left:0;top:0}.vp img{display:block}
.hl{position:absolute;outline:4px solid #ff5a3c;outline-offset:2px;border-radius:8px;background:#ff5a3c22}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}.facts>div{background:#3a332c;border-radius:10px;padding:12px}.facts p{margin:0;font-size:13px}
table{border-collapse:collapse;width:100%;max-width:1200px;background:#3a332c;border-radius:10px;overflow:hidden}td,th{padding:8px 10px;border-bottom:1px solid #514639;text-align:left;vertical-align:top;font-size:13px}th{background:#4a4036;color:#ffd99a}
.cmp td:nth-child(2){color:#ff9d86;font-weight:700}.cmp td:nth-child(3),.cmp td:nth-child(4){color:#9fe0a6;font-weight:700}
.note{color:#bfb197;font-size:12.5px}kbd{font:700 11px ui-monospace,monospace;background:#e9dcc0;color:#4a3618;border-radius:4px;padding:0 4px;border:1px solid #b9a37c}
/* 시안 칩·카드: 수첩 종이 톤 */
.chip{position:absolute;display:flex;align-items:center;justify-content:center;gap:4px;background:#fbf3e2;border-radius:16px;box-shadow:0 2px 0 #c9b48e,0 4px 10px #0004;color:#4a3618;animation:pop .25s ease-out}
.chip i{width:20px;height:20px;display:block}.chip kbd{font-size:10px;padding:0 3px}
.chip::after{content:"";position:absolute;inset:-6px;border-radius:22px}
.chip.dim{opacity:.5;transform:scale(.85)}
.card{position:absolute;background:#fbf3e2;border-radius:12px;box-shadow:0 3px 0 #c9b48e,0 8px 20px #0005;color:#4a3618;padding:8px 10px 10px;box-sizing:border-box}
.card .tail{position:absolute;width:14px;height:14px;background:#fbf3e2;transform:rotate(45deg)}
.card .ch{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:14px;margin-bottom:6px}.card .ch small{font-weight:600;color:#8a7553;font-size:12px}
.card .x{width:26px;height:26px;border:0;border-radius:50%;background:#efe2c6;padding:5px;color:#4a3618}.card .x i{display:block;width:100%;height:100%}
.card .cb{display:flex;gap:6px}.card .cb button{flex:1;height:38px;border:0;border-radius:10px;background:#efe2c6;color:#4a3618;font:800 13px inherit;display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;box-shadow:0 2px 0 #c9b48e}
.card .cb button.main{background:#c9533a;color:#fff;box-shadow:0 2px 0 #8e3322}.card .cb button.main i{--ic-point:#fff;color:#fff}.card .cb i{width:17px;height:17px;display:block}.card .cb kbd{font-size:10px;margin-left:2px}
.card .bar{position:absolute;left:10px;right:10px;bottom:4px;height:2px;background:#e3d3b2;border-radius:2px}.card .bar i{display:block;height:100%;width:60%;background:#c9533a;border-radius:2px}
@keyframes pop{from{transform:scale(.6);opacity:0}}'''
html=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><title>온라인 등산 · 인사 창 전·후 시안 v1</title><style>{css}{''.join('.im-'+n+'{background:url('+img(n)+') 0 0/100% 100%}' for n in ['pc-near','pc-clean','pc-pair','mobile-near','mobile-clean','mobile-pair','land-near','land-clean'])}</style>
<h1>온라인 등산 — 다른 사람 가까이 갔을 때 「인사하기」 창 전·후 시안 v1</h1>
<p>2026-11-18 월드디자인 · 「전」은 실제 게임을 두 명 접속으로 돌린 캡처, 「후」는 같은 장면 위에 그린 시안 · 기능·서버 규칙은 그대로, 표시 방식만 · 추천안(대표 미확인)</p>
{pairnote}{cmp}{row('mobile','휴대폰 세로 390×844')}{row('land','휴대폰 가로 844×390')}{row('pc','PC 1440×900')}{rules}</html>'''
open(R+'docs/인사창/인사창-전후-시안-v1.html','w').write(html)
json.dump(N,open(D+'numbers.json','w'),indent=1,default=str)
