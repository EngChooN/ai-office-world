#!/bin/bash
# 봉 4대 평균 판 수(pass-through/sim2.mjs, 새 규칙, 상자 N개)를 한꺼번에(월드개발 11-24). bash plays.sh <이름> <코드 뿌리> [N]  → /tmp/flyx/plays-<이름>-<기계>.txt
# 조절값 환경 변수는 run.sh·tune-env.mjs 그대로(코드 뿌리가 이 저장소가 아니면 NOTUNE=1)
cd "$(dirname "$0")"
for m in bridge-1 bridge-2 bridge-3 bridge-4; do bash run.sh /tmp/flyx/plays-$1-$m.txt artifacts/claw-design/pass-through/sim2.mjs "$2" $m new ${3:-60} & done
wait
cat /tmp/flyx/plays-$1-*.txt
