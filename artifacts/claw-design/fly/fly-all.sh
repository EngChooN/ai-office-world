#!/bin/bash
# 날아감 반복 시험 한꺼번에(월드개발 11-24): 게임처럼 옮겨 겨누기(walk)·멈칫 프레임(hitch)·순간 이동 겨누기(tele) × 지금 코드·고치기 전 코드
# bash fly-all.sh <고치기 전 코드 뿌리(git archive로 푼 곳)> [상자 수] [판/상자]  → /tmp/flyx2/fly-<이름>.txt
cd "$(dirname "$0")"
OLD=$1;NB=${2:-15};NP=${3:-12};NEW=$(cd ../../.. && pwd)
TOP=10 bash run.sh /tmp/flyx2/fly-new-walk.txt artifacts/claw-design/fly/probe-fly.mjs "$NEW" $NB $NP &
TOP=10 bash run.sh /tmp/flyx2/fly-new-hitch.txt artifacts/claw-design/fly/probe-fly.mjs "$NEW" $NB $NP hitch &
TOP=10 AIM=tele bash run.sh /tmp/flyx2/fly-new-tele.txt artifacts/claw-design/fly/probe-fly.mjs "$NEW" $NB $NP &
TOP=10 NOTUNE=1 bash run.sh /tmp/flyx2/fly-old-walk.txt artifacts/claw-design/fly/probe-fly.mjs "$OLD" $NB $NP &
TOP=10 NOTUNE=1 bash run.sh /tmp/flyx2/fly-old-hitch.txt artifacts/claw-design/fly/probe-fly.mjs "$OLD" $NB $NP hitch &
TOP=10 NOTUNE=1 AIM=tele bash run.sh /tmp/flyx2/fly-old-tele.txt artifacts/claw-design/fly/probe-fly.mjs "$OLD" $NB $NP &
wait
