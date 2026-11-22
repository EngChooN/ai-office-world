# 정상 '잔잔한 소리' 후보 들어보기 HTML(2026-11-22, 월드디자인). AI Office 앱은 <audio>가 막혀 WebAudio로 튼다.
# 먼저 make-summit-calm-preview.py를 돌린 뒤 실행: python3 scripts/build-summit-calm-html.py
# 소리는 opus(ogg)로 HTML 안에 넣고, 반복 길이(loopEnd)는 원래 샘플 길이로 정해서 압축 여백 때문에 이음이 튀지 않게 한다.
import base64, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'design/sounds/summit-calm/preview/')
OUT = os.path.join(ROOT, 'docs/소리/정상-잔잔한소리-후보-v1.html')
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# 반복 소리는 압축(opus) 앞뒤 끝이 흐려져 이음이 튀므로, 앞에 끝 0.5초·뒤에 처음 0.5초를 덧대어 넣고 HTML에서는 덧댄 곳을 빼고 반복한다
import subprocess, numpy as np
FF, PAD = '/opt/homebrew/bin/ffmpeg', 0.5
AMB = os.path.join(ROOT, 'public/sounds/ambient/')
SOUNDS = {
    'murmur': P + 'calm-murmur-loop.flac', 'flag': P + 'calm-flag-loop.flac', 'chime': P + 'calm-chime-loop.flac',
    'crowd': AMB + 'summit-crowd-loop.flac', 'ridge': AMB + 'wind-ridge-loop.flac', 'city': AMB + 'city-far-loop.flac',
}
def padded(path):
    raw = subprocess.run([FF, '-v', 'error', '-i', path, '-ac', '1', '-ar', '32000', '-f', 'f32le', '-'], check=True, capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32); k = int(PAD * 32000)
    y = np.concatenate([x[-k:], x, x[:k]])
    ogg = subprocess.run([FF, '-v', 'error', '-f', 'f32le', '-ar', '32000', '-ac', '1', '-i', '-', '-c:a', 'libopus', '-b:a', '40k', '-f', 'ogg', '-'],
                         input=y.tobytes(), check=True, capture_output=True).stdout
    return base64.b64encode(ogg).decode(), len(x) / 32000
data = {}
for k, path in SOUNDS.items():
    enc, n = padded(path)
    data[k] = {'b64': enc, 'len': round(n, 6), 'pad': PAD}

HTML = r'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>정상 잔잔한 소리 후보 v1</title><style>
:root{--paper:#f6efe0;--ink:#3a3128;--line:#d8cbb0;--red:#d9483b;--teal:#2f8f8a;--sub:#7a6c5a}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 -apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:22px 18px 40px}h1{font-size:22px;margin:0 0 4px}.lead{color:var(--sub);margin:0 0 14px}
.bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;background:#fffaf0;border:1.5px solid var(--line);border-radius:12px;padding:10px 14px;margin-bottom:16px}
.bar label{display:flex;gap:8px;align-items:center}.bar .now{margin-left:auto;color:var(--sub)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.card{background:#fffaf0;border:1.5px solid var(--line);border-radius:14px;padding:14px;position:relative}
.card.rec{border:2.5px solid var(--red)}.badge{position:absolute;top:-11px;right:12px;background:var(--red);color:#fff;font-size:12px;font-weight:700;padding:2px 10px;border-radius:99px}
.card.ref{opacity:.82;border-style:dashed}.card h2{font-size:17px;margin:0 0 2px}.card .one{margin:0 0 8px}.card .src{font-size:12px;color:var(--sub);margin:6px 0 0}
canvas{width:100%;height:54px;display:block;background:#f1e7d2;border-radius:8px;margin:6px 0 8px}
.btns{display:flex;flex-wrap:wrap;gap:6px}button{font:inherit;font-size:14px;border:1.5px solid var(--ink);background:#fff;border-radius:9px;padding:7px 10px;min-height:40px;cursor:pointer}
button.on{background:var(--teal);color:#fff;border-color:var(--teal)}button.stop{background:var(--ink);color:#fff}
.note{margin-top:18px;background:#fffaf0;border:1.5px solid var(--line);border-radius:12px;padding:12px 16px;font-size:14px}.note h3{margin:0 0 6px;font-size:15px}.note ul{margin:4px 0;padding-left:20px}
</style></head><body><div class="wrap">
<h1>정상 '잔잔한 소리' 후보 3개</h1>
<p class="lead">꺼 둔 환호 소리 자리에 넣을 후보입니다. 각 소리는 28초를 계속 반복합니다(이음매를 일부러 들어 보는 단추도 있습니다). 「관악산 정상」·「남산 정상」은 지금 게임의 정상 바람·도시 소리 크기에 후보를 얹은 것입니다.</p>
<div class="bar"><button class="stop" id="stop">■ 모두 멈춤</button>
<label>전체 크기 <input id="vol" type="range" min="0" max="2" step="0.05" value="1"></label>
<label>후보 크기 <input id="cand" type="range" min="-54" max="-34" step="1" value="-44"><span id="candv">-44dB</span></label>
<span class="now" id="now">멈춤</span></div>
<div class="grid" id="grid"></div>
<div class="note"><h3>섞는 크기(지금 게임 값)</h3><ul>
<li>관악산 정상: 능선 바람 -33dB (도시 소리는 관악산 정상에서 꺼져 있음)</li>
<li>남산 정상: 트인 바람 -46dB · 도시 -48dB</li>
<li>후보: -44dB = 꺼 둔 환호 소리가 쓰던 크기. 위 「후보 크기」로 바꿔 들을 수 있습니다(바꾼 값은 아직 게임에 안 들어감).</li></ul>
<h3>출처 (모두 CC0, 2026-11-22 받음·확인)</h3><ul>
<li>먼 웅성임: BigSoundBank «Outside Talks #2» s2969, Joseph SARDIN</li>
<li>깃발 펄럭임: BigSoundBank «Flag in the wind #1» s1632, Joseph SARDIN</li>
<li>풍경(바람종): BigSoundBank «Cluster Chimes» s2687, Pierre SIBANARCO</li></ul></div>
</div><script>
const D=__DATA__;
const CARDS=[
 {k:'murmur',t:'① 먼 웅성임',one:'멀리서 사람들이 조용히 이야기하는 소리. 높은 소리를 깎아 말은 안 들리고 "사람이 있구나"만 남김. 환호·박수·고함 없음.',src:'Outside Talks #2 (s2969) 26~54초 · 700Hz 위 깎음',rec:true},
 {k:'flag',t:'② 깃발 펄럭임',one:'바람에 천이 펄럭이는 소리. 사람 소리 없이 탁 트인 정상 느낌. 가끔 "펄럭"이 조금 크게 튐.',src:'Flag in the wind #1 (s1632) 40~68초'},
 {k:'chime',t:'③ 풍경(바람종)',one:'바람에 흔들리는 작은 종 소리. 가장 잔잔하고 쉬는 느낌. 한국 절의 풍경보다 맑은 서양식 종 묶음이라 조금 "명상 음악" 같을 수 있음.',src:'Cluster Chimes (s2687) 140~168초 · 큰 "쨍" 눌러 둠'},
 {k:'crowd',t:'(참고) 꺼 둔 환호 소리',one:'지금 꺼 둔 원래 소리. 비교용입니다.',src:'summit-crowd-loop.flac',ref:true},
];
let ctx,master,bufs={},playing=null;
const $=s=>document.querySelector(s),grid=$('#grid');
const db=x=>10**(x/20);
function ac(){if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.connect(ctx.destination);master.gain.value=+$('#vol').value;}if(ctx.state==='suspended')ctx.resume();return ctx;}
async function buf(k){if(bufs[k])return bufs[k];const b=Uint8Array.from(atob(D[k].b64),c=>c.charCodeAt(0)).buffer;bufs[k]=await ac().decodeAudioData(b);return bufs[k];}
function loop(b,len,gain,offset=0,pad=.5){const s=ctx.createBufferSource(),g=ctx.createGain(),o=offset%len;s.buffer=b;s.loop=true;s.loopStart=pad;s.loopEnd=pad+len;g.gain.value=gain;s.connect(g).connect(master);s.start(0,pad+o);return {s,g,len,t0:ctx.currentTime-o};}
function stop(){if(!playing)return;const t=ctx.currentTime;for(const n of playing.nodes){n.g.gain.setTargetAtTime(0,t,.05);n.s.stop(t+.3);}document.querySelectorAll('button.on').forEach(b=>b.classList.remove('on'));playing=null;$('#now').textContent='멈춤';}
// mode: solo | gwanak | namsan | seam(끝 4초 전부터)
async function play(k,mode,btn){ac();if(playing&&playing.btn===btn){stop();return;}stop();
 const cand=+$('#cand').value,kb=await buf(k),nodes=[];const fileDb=k==='chime'?-36:-34;
 const solo=mode==='solo'||mode==='seam';
 // 소리만 = 파일 크기 그대로(후보 크기 -44 기준으로 같이 움직임), 섞기 = 게임 목표 크기(후보 크기 dB)
 const main=loop(kb,D[k].len,solo?db(cand+44):db(cand-fileDb),mode==='seam'?D[k].len-4:0);nodes.push(main);
 if(mode==='gwanak')nodes.push(loop(await buf('ridge'),D.ridge.len,db(-33+24)));
 if(mode==='namsan'){nodes.push(loop(await buf('ridge'),D.ridge.len,db(-46+24)));nodes.push(loop(await buf('city'),D.city.len,db(-48+36)));}
 playing={k,mode,btn,nodes,main};btn.classList.add('on');
 $('#now').textContent=CARDS.find(c=>c.k===k).t+' · '+({solo:'소리만',gwanak:'관악산 정상',namsan:'남산 정상',seam:'이음매 듣기'})[mode];}
$('#stop').onclick=stop;$('#vol').oninput=e=>{if(master)master.gain.value=+e.target.value;};
$('#cand').oninput=e=>{$('#candv').textContent=e.target.value+'dB';if(playing){const p=playing;stop();p.btn.click();}};
for(const c of CARDS){const el=document.createElement('div');el.className='card'+(c.rec?' rec':'')+(c.ref?' ref':'');
 el.innerHTML=(c.rec?'<span class="badge">추천</span>':'')+`<h2>${c.t}</h2><p class="one">${c.one}</p><canvas></canvas><div class="btns">
 <button data-m="solo">▶ 소리만</button><button data-m="gwanak">⛰ 관악산 정상</button><button data-m="namsan">🗼 남산 정상</button>${c.ref?'':'<button data-m="seam">🔁 이음매 듣기</button>'}</div><p class="src">${c.src}</p>`;
 grid.appendChild(el);el.querySelectorAll('button').forEach(b=>b.onclick=()=>play(c.k,b.dataset.m,b));c.cv=el.querySelector('canvas');}
// 소리 모양(파형)과 지금 재생 위치. 빨간 세로줄 = 이음매(끝→처음)
async function drawAll(){const off=new OfflineAudioContext(1,1,32000);for(const c of CARDS){const b=Uint8Array.from(atob(D[c.k].b64),x=>x.charCodeAt(0)).buffer;
 try{c.buf=await off.decodeAudioData(b);}catch(e){continue;}const sr=c.buf.sampleRate,d=c.buf.getChannelData(0).subarray(Math.round(D[c.k].pad*sr)),n=Math.min(d.length,Math.round(D[c.k].len*sr)),W=300,pk=new Float32Array(W);
 for(let i=0;i<W;i++){let m=0;for(let j=Math.floor(i*n/W);j<Math.floor((i+1)*n/W);j+=4)m=Math.max(m,Math.abs(d[j]));pk[i]=m;}const mx=Math.max(...pk)||1;c.pk=pk.map(v=>v/mx);}tick();}
function tick(){for(const c of CARDS){if(!c.pk)continue;const cv=c.cv,r=devicePixelRatio||1,w=cv.clientWidth*r,h=cv.clientHeight*r;if(cv.width!==w){cv.width=w;cv.height=h;}const g=cv.getContext('2d');g.clearRect(0,0,w,h);
 g.fillStyle=c.ref?'#b9ab92':'#2f8f8a';const bw=w/c.pk.length;c.pk.forEach((v,i)=>{const y=v*h*.45;g.fillRect(i*bw,h/2-y,Math.max(1,bw-.5),y*2||1);});
 g.fillStyle='#d9483b';g.fillRect(w-2*r,0,2*r,h);g.fillRect(0,0,2*r,h);
 if(playing&&playing.k===c.k){const m=playing.main,p=((ctx.currentTime-m.t0)%m.len)/m.len;g.fillStyle='#3a3128';g.fillRect(p*w-r,0,2*r,h);}}
 requestAnimationFrame(tick);}
drawAll();
</script></body></html>'''
open(OUT, 'w').write(HTML.replace('__DATA__', json.dumps(data)))
print(OUT, os.path.getsize(OUT))
