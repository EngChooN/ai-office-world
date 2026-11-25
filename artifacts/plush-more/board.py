# 새 인형 후보 시안 보드 만들기(월드아트 11-25): python3 artifacts/plush-more/board.py → docs/인형뽑기/인형추가-시안-v1.html (그림을 글 안에 넣음)
import base64,io,json,os
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__));IMG=D+'/img/'
def b64(name,w):
    im=Image.open(IMG+name);h=int(im.size[1]*w/im.size[0]);im=im.resize((w,h),Image.LANCZOS);buf=io.BytesIO();im.save(buf,'JPEG',quality=82)
    return 'data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()
R={'common':('흔함','#7cc56a',1),'uncommon':('보통','#56aef0',2),'rare':('희귀','#a978f0',3),'special':('특별','#f5c33b',4)}
K={'small':'작은 인형','big':'큰 인형(등에 업음)','box':'상자 피규어(손에 듦)'}
C=[('kkulbam','꿀밤이','small','common','온라인 등산','등산로 다람쥐가 줍던 도토리. 깍정이 모자에 꼭지가 달린 반들반들한 밤색 몸.'),
('nunsong','눈송이','small','common','온라인 크리스마스','크리스마스 마을 눈사람을 인형으로. 높은 모자·빨강 줄 목도리·당근 코.'),
('mongle','몽글이','small','common','온라인 흡연장(옥상 쉼터)','쉬는 시간의 따뜻한 커피 한 잔. 우유 거품 하트와 머리 위 김 세 방울.'),
('bueong','부엉','small','uncommon','온라인 등산(밤)','밤 등산 친구 부엉이. 이마에 노란 헤드랜턴을 찼어요.'),
('rudolph','루돌프','small','uncommon','온라인 크리스마스','하늘 썰매를 끄는 그 루돌프. 빨간 코와 금방울 목걸이.'),
('domdol','돔돌이','small','rare','온라인 등산(정상)·새 콘텐츠','정상 기상레이더 돔을 머리에 쓴 꼬마 로봇. 화면 얼굴과 바람개비 안테나.'),
('dongdong-camp','캠핑 동동이','small','rare','새 콘텐츠(캠핑장)','동동이 넷째 옷. 겨자색 털모자·올리브 플리스·허리에 작은 랜턴.'),
('star','반짝별','small','special','온라인 크리스마스·새 콘텐츠(별 보기)','트리 꼭대기에서 내려온 통통한 별. 볼에 홍조, 반짝이 두 개를 달고 다녀요.'),
('big-nunsong','큰 눈송이','big','common','온라인 크리스마스','눈송이를 크게(0.42m). 타이머 기계 경품으로 등에 업어요.'),
('big-rudolph','큰 루돌프','big','uncommon','온라인 크리스마스','루돌프를 크게(0.46m). 뿔이 어깨 위로 쏙 나와요.'),
('big-dongdong-santa','큰 산타 동동이','big','special','온라인 크리스마스','지금 있는 산타 동동이를 크게(0.54m). 아직 없는 「특별 큰 인형」 자리를 채워요.'),
('box-kongi','콩이 상자','box','uncommon','새 콘텐츠(탐험대)','우리 캐릭터 시안 「콩이」를 상자 피규어로. 레인저 모자·빨강 네커치프.'),
('box-bau','바우 상자','box','rare','온라인 등산','캐릭터 시안 「바우」(바위 돌돌이). 이끼 모자에 소나무 싹·진달래.'),
('box-haechi-gold','황금 해치 상자','box','special','공통(해치 특별판)','해치를 금빛으로 칠한 특별판. 이마에 흰 구름 무늬.')]
cards=''
for i,(id,name,kind,rar,link,line) in enumerate(C,1):
    r=R[rar];cards+=f'''<div class="card"><div class="hd"><b>{i}. {name}</b><span class="tag" style="background:{r[1]}">{r[0]} {'★'*r[2]}</span></div>
<div class="meta">{K[kind]} · {link}</div><p>{line}</p>
<div class="pics"><figure><img src="{b64('model-'+id+'.jpg',560)}"><figcaption>3D 모형 정면 · 측면</figcaption></figure>
<figure><img src="{b64('hand-'+id+'.jpg',360)}"><figcaption>{'등에 업은 모습(뒤에서)' if kind=='big' else '손에 든 모습'}</figcaption></figure></div></div>'''
html=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>인형 추가 시안 v1</title>
<style>body{{margin:0;font-family:-apple-system,"Apple SD Gothic Neo",sans-serif;background:#fbf1df;color:#3a2e26}}main{{max-width:1180px;margin:auto;padding:20px}}
h1{{font-size:24px;margin:.2em 0}}h2{{font-size:19px;margin:28px 0 8px;border-left:6px solid #e8689e;padding-left:8px}}.note{{background:#fff;border-radius:12px;padding:12px 16px;line-height:1.6}}
table{{border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;width:100%}}td,th{{border-bottom:1px solid #eee;padding:7px 10px;text-align:left;font-size:14px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(540px,1fr));gap:14px}}.card{{background:#fff;border-radius:14px;padding:12px 14px;box-shadow:0 2px 6px #0001}}
.hd{{display:flex;justify-content:space-between;align-items:center;font-size:18px}}.tag{{color:#fff;border-radius:20px;padding:2px 10px;font-size:13px;font-weight:700}}
.meta{{color:#8a7260;font-size:13px;margin-top:2px}}p{{margin:6px 0}}.pics{{display:flex;gap:8px}}figure{{margin:0}}figure img{{width:100%;border-radius:8px;display:block}}
.pics figure:first-child{{flex:1.6}}.pics figure:last-child{{flex:1}}figcaption{{font-size:12px;color:#8a7260;text-align:center}}.line img{{width:100%;border-radius:10px}}.warn{{color:#a1462e}}</style></head><body><main>
<h1>🧸 인형 추가 시안 v1.1 <small style="font-size:14px;color:#8a7260">월드아트 · 2026-11-25 · 게임 코드는 안 고침(시안만)</small></h1>
<h2>지금 있는 인형(코드·그림에서 확인)</h2>
<div class="note">
<table><tr><th>종류</th><th>흔함 ★ (0.20m)</th><th>보통 ★★ (0.24m)</th><th>희귀 ★★★ (0.28m)</th><th>특별 ★★★★ (0.32m)</th></tr>
<tr><td>작은 인형 8</td><td>다람쥐·산토끼·까치</td><td>산고양이·등산 동동이</td><td>회사원 동동이·해치</td><td>산타 동동이</td></tr>
<tr><td>큰 인형 3 (+0.22m)</td><td>큰 다람쥐 0.42</td><td>큰 등산 동동이 0.46</td><td>큰 해치 0.50</td><td class="warn">없음</td></tr>
<tr><td>상자 피규어 8</td><td colspan="4">작은 인형 8종이 저절로 하나씩 상자가 됨(따로 디자인한 상자는 없음)</td></tr></table>
<p><b>비어 있는 곳</b> ① 특별은 산타 동동이 하나뿐, 특별 큰 인형은 없음 ② 동물 4종은 모두 등산, 크리스마스는 산타 동동이·흡연장은 회사원 동동이 옷 하나씩뿐 ③ 이미 만들어 둔 캐릭터 시안(콩이·바우·돔돌이)과 크리스마스의 루돌프·눈사람이 인형으로 없음 ④ 사물·음식 인형이 없음.<br>
<b>확률</b>: 등급별 뽑힐 확률표는 따로 없습니다. 기계마다 넣는 인형(16대 경품표)과 무게(희귀할수록 무거워 덜 잡힘)로 정해집니다.</p></div>
<h2>새 후보 14개 (작은 8 · 큰 3 · 상자 3)</h2>
<div class="note">지킨 규칙: 동동이 화풍(큰 머리·짧은 팔다리·앉은 자세·외곽선·옆구리 등급 이름표), 크기 = 등급 크기(큰 인형은 +0.22m), 색은 기존 그림(크리스마스 팔레트·루돌프·캐릭터 시안)에서 가져옴. 실제 캐릭터·상표는 쓰지 않았습니다.<br>
등급별: 흔함 4 · 보통 4 · 희귀 3 · 특별 3. 손에 든 모습·업은 모습은 실제 게임 동동이와 지금 들기 코드로 찍었습니다.</div>
<div class="grid">{cards}</div>
<h2>크기 비교 (서 있는 동동이 1.0m 옆)</h2>
<div class="line"><p>지금 인형 8종</p><img src="{b64('lineup-old.jpg',1180)}"><p>새 작은 인형 8 + 상자 속 인형 3</p><img src="{b64('lineup-small.jpg',1180)}"><p>새 큰 인형 3</p><img src="{b64('lineup-big.jpg',1180)}"></div>
<h2>추천안(대표 미확인)</h2>
<div class="note">· 몇 개를 넣을지: 10개 안팎(작은 6 · 큰 2 · 상자 2)을 추천합니다. 정하는 것은 대표님입니다.<br>
· 확률: 지금처럼 기계 경품표와 무게로 조절하고, 특별 후보는 열쇠·봉 4처럼 어려운 기계에 넣는 안을 추천합니다(대표 미확인).<br>
· <b>상자 크기(11-25 대표 지적 반영)</b>: 상자를 깊이 10→15cm · 높이 22→24cm · 폭 16→19cm로 키우고, 인형을 아래 띠 높이의 받침 위에 세웠습니다. 후보 3종은 상자 밖으로 나오는 곳이 0mm입니다(잰 값).<br>
<span class="warn">· 지금 게임의 상자 8종도 인형이 상자 뒤·옆으로 나옵니다(잰 값: 까치 89mm · 다람쥐 71mm · 등산 동동이 30mm · 해치 29mm · 회사원 동동이 14mm · 고양이 9mm · 산토끼·산타 동동이 5mm). 이번엔 게임 코드를 안 고치는 일이라 그대로 두었습니다.</span><br>
· 상자 피규어: 지금 규칙은 작은 인형마다 상자가 저절로 생깁니다. 콩이·바우·황금 해치를 「상자 전용」으로 하려면 월드공통개발이 규칙을 바꿔야 합니다.<br>
<span class="warn">· 모형 제작 때 할 일: 후보 모형이 지금 인형(약 2천 삼각형)보다 1.4~2.8배 무겁습니다(2.8천~5.7천) — 확정되면 줄입니다. 반짝별 테두리선은 화면 외곽선만 써서 다른 인형보다 옅습니다.</span></div>
</main></body></html>'''
out=os.path.join(D,'../../docs/인형뽑기/인형추가-시안-v1.html');open(out,'w').write(html);print(out,len(html)//1024,'KB')
