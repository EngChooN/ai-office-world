# 정상 '잔잔한 소리' 후보 미리듣기 만들기(2026-11-22, 월드디자인). 게임 코드에는 아직 연결하지 않는다.
# 실행: python3 scripts/make-summit-calm-preview.py   (ffmpeg: /opt/homebrew/bin/ffmpeg, numpy 필요)
# 원본(CC0, BigSoundBank): design/sounds/summit-calm/raw/  → 결과: design/sounds/summit-calm/preview/
# 다듬는 순서: 구간 자르기 → 필터 → 모노 32kHz(지금 ambient/ 파일과 같음) → 이음매 2초 크로스페이드(같은 힘) → RMS 맞춤 → 피크 -3dB 확인.
# 섞은 미리듣기는 지금 정상 레벨(관악산: 능선 바람 -33dB / 남산: 바람 -46·도시 -48dB)에 후보를 -44dB(꺼 둔 환호 소리 자리)로 얹는다.
import json, os, subprocess, sys
import numpy as np

FF = '/opt/homebrew/bin/ffmpeg'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'design/sounds/summit-calm/raw/')
OUT = os.path.join(ROOT, 'design/sounds/summit-calm/preview/')
AMB = os.path.join(ROOT, 'public/sounds/ambient/')
SR, XF, MIX_S = 32000, 2.0, 30.0
os.makedirs(OUT, exist_ok=True)

# ss: 원본 시작(초), t: 반복 길이(초), af: ffmpeg 필터, rms: 맞출 음량(dB, 지금 ambient 파일 기준과 같은 자리)
ITEMS = [
    {'name': 'calm-murmur-loop', 'file': '2969.flac', 'ss': 26, 't': 28, 'rms': -34,
     # 사람 100명 바깥 대화. 높은 쪽을 크게 깎아 '멀리서 웅성' 정도로, 말은 알아들을 수 없게. 튀는 소리는 눌러 둔다
     'af': 'highpass=f=180,lowpass=f=700,lowpass=f=900,acompressor=threshold=0.05:ratio=4:attack=20:release=400'},
    {'name': 'calm-flag-loop', 'file': '1632.flac', 'ss': 40, 't': 28, 'rms': -34,
     # 바람에 펄럭이는 천. 낮은 웅웅거림과 날카로운 끝을 덜어 낸다
     'af': 'highpass=f=150,lowpass=f=6500,acompressor=threshold=0.08:ratio=3:attack=5:release=200'},
    {'name': 'calm-chime-loop', 'file': '2687.flac', 'ss': 140, 't': 28, 'rms': -36,
     # 바람에 흔들리는 종 묶음. 비교적 성긴 구간. 큰 '쨍'을 눌러 은은하게
     'af': 'highpass=f=450,acompressor=threshold=0.06:ratio=4:attack=3:release=300'},
]


def decode(path, ss=0.0, t=None, af=None):
    cmd = [FF, '-v', 'error', '-ss', str(ss)] + (['-t', str(t)] if t else []) + ['-i', path]
    cmd += (['-af', af] if af else []) + ['-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, check=True, capture_output=True).stdout, dtype=np.float32).astype(np.float64)


def encode(x, path, extra=()):
    subprocess.run([FF, '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', *extra, path],
                   input=x.astype(np.float64).tobytes(), check=True)


db = lambda x: 20 * np.log10(max(np.sqrt(np.mean(x ** 2)), 1e-12))
peak = lambda x: 20 * np.log10(max(np.max(np.abs(x)), 1e-12))


def make_loop(seg, n):
    """seg 길이 n+xf. 끝의 xf를 앞쪽 xf에 겹쳐서 마지막 샘플 다음에 처음이 자연스럽게 이어지게."""
    xf = len(seg) - n
    k = np.linspace(0, 1, xf, endpoint=False)
    out = seg[:n].copy()
    out[:xf] = seg[:xf] * np.sin(k * np.pi / 2) + seg[n:n + xf] * np.cos(k * np.pi / 2)
    return out


def tile(x, n):
    return np.tile(x, int(np.ceil(n / len(x))))[:n]


stats = {}
loops = {}
for it in ITEMS:
    n = int(it['t'] * SR)
    seg = decode(RAW + it['file'], it['ss'], it['t'] + XF, it['af'])[:n + int(XF * SR)]
    y = make_loop(seg, n)
    y *= 10 ** ((it['rms'] - db(y)) / 20)
    if peak(y) > -3:
        y *= 10 ** ((-3 - peak(y)) / 20)
    # 이음매 확인: 끝 50ms와 처음 50ms의 음량 차, 이음 지점 샘플 차
    w = int(.05 * SR)
    seam = {'jump': float(abs(y[-1] - y[0])), 'edgeDbDiff': round(db(y[-w:]) - db(y[:w]), 1)}
    encode(y, OUT + it['name'] + '.flac')
    encode(y, OUT + it['name'] + '.ogg', ['-c:a', 'libopus', '-b:a', '40k'])
    loops[it['name']] = y
    stats[it['name']] = {'src': it['file'], 'ss': it['ss'], 'seconds': it['t'], 'rmsDb': round(db(y), 1),
                         'peakDb': round(peak(y), 1), 'seam': seam}

ridge, city = decode(AMB + 'wind-ridge-loop.flac'), decode(AMB + 'city-far-loop.flac')
stats['_bed'] = {'ridgeRmsDb': round(db(ridge), 1), 'cityRmsDb': round(db(city), 1)}
for name, x in (('bed-ridge-loop', ridge), ('bed-city-loop', city)):
    encode(x, OUT + name + '.ogg', ['-c:a', 'libopus', '-b:a', '40k'])

# 지금 게임의 정상 목표 음량(dB). 파일 기준 음량은 FILE_RMS_DB(ridge -24, city -36)
SCENES = {'gwanak': {'ridge': -33}, 'namsan': {'ridge': -46, 'city': -48}}
CAND_DB, N = -44, int(MIX_S * SR)
for scene, lv in SCENES.items():
    bed = np.zeros(N)
    if 'ridge' in lv: bed += tile(ridge, N) * 10 ** ((lv['ridge'] + 24) / 20)
    if 'city' in lv: bed += tile(city, N) * 10 ** ((lv['city'] + 36) / 20)
    for it in ITEMS:
        mix = bed + tile(loops[it['name']], N) * 10 ** ((CAND_DB - it['rms']) / 20)
        f = np.ones(N); r = int(.5 * SR); f[:r] = np.linspace(0, 1, r); f[-r:] = np.linspace(1, 0, r)
        encode(mix * f, OUT + f"mix-{scene}-{it['name'].replace('-loop', '')}.flac")
        stats[f"mix-{scene}-{it['name']}"] = {'rmsDb': round(db(mix), 1), 'peakDb': round(peak(mix), 1)}

json.dump(stats, open(OUT + 'stats.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(stats, ensure_ascii=False, indent=1))
