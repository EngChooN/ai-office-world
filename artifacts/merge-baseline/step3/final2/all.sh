#!/bin/zsh
# 3단계 마무리(11-20): 최종 코드로 ① 앞서 통과한 낡은 점검 8개 다시 ② 1군 기본 점검(run.mjs, 낡은 6개 빼고 8개) → step3/summary.json
cd ~/gwanak-hiking; . ~/.nvm/nvm.sh >/dev/null; nvm use 24 >/dev/null
zsh artifacts/merge-baseline/step3/final2/run.sh controls-camera facing hud-toggle mobile-buttons mobile-pages hiking-interactions hiker-interactions rest-integration
ONLY=plaza-start,full-autowalk,auto-view,entrance-integration,start-choice,ui-frame,no-realistic,namsan-game node artifacts/merge-baseline/run.mjs step3
echo ALLDONE >> artifacts/merge-baseline/step3/final2/summary.txt
