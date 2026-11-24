#!/bin/bash
# 통과(파고듦) 잣대 pass-through/probe.mjs를 봉 1·3·4에(월드개발 11-24). bash pass.sh <이름> <코드 뿌리> [상자 수]  → /tmp/flyx2/pass-<이름>-<기계>.txt
cd "$(dirname "$0")"
for m in bridge-1 bridge-3 bridge-4; do bash run.sh /tmp/flyx2/pass-$1-$m.txt artifacts/claw-design/pass-through/probe.mjs "$2" ${3:-25} $m & done
wait
cat /tmp/flyx2/pass-$1-*.txt
