#!/bin/bash
# 통과 잣대(probe-detail.mjs)를 판 시작 SKIP초 빼고 봉 1·3·4에(월드개발 11-24). bash pass-skip.sh <이름> <코드 뿌리> [상자 수] [SKIP]
cd "$(dirname "$0")"
for m in bridge-1 bridge-3 bridge-4; do SKIP=${4:-0.1} bash run.sh /tmp/flyx2/pskip-$1-$m.txt artifacts/claw-design/fly/probe-detail.mjs "$2" ${3:-25} $m & done
wait
tail -q -n 1 /tmp/flyx2/pskip-$1-*.txt
