#!/bin/bash
# 잣대 하나를 조절값과 함께 돌림(월드개발 11-24). bash run.sh <결과 파일> <잣대 스크립트> [인자…]  — 환경 변수(SLACK·BOTTOM·PUSH·PRESS·VMAX·SLIP)는 tune-env.mjs가 읽음
# 코드 뿌리(첫 인자)가 /tmp/claw-orig처럼 이 저장소가 아니면 tune-env 없이 그대로 돌림
cd "$(dirname "$0")/../../.."
NODE=/Users/pc-2311001/.nvm/versions/node/v24.19.0/bin/node
out=$1; shift
if [ -n "$NOTUNE" ]; then "$NODE" "$@" > "$out" 2>&1; else "$NODE" --import ./artifacts/claw-design/fly/tune-env.mjs "$@" > "$out" 2>&1; fi
