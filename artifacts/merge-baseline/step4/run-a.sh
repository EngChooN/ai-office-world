#!/bin/zsh
# 4단계: 기본 화면 8개(run.mjs) → 기능 7개(run2.mjs). 4173(preview)용으로 먼저 빌드
cd ~/gwanak-hiking; . ~/.nvm/nvm.sh >/dev/null; nvm use 24 >/dev/null
D=artifacts/merge-baseline/step4
npm run build > $D/build.log 2>&1; echo "build exit=$?" > $D/a.txt
ONLY=plaza-start,full-autowalk,auto-view,entrance-integration,start-choice,ui-frame,no-realistic,namsan-game node artifacts/merge-baseline/run.mjs step4 >> $D/a.txt 2>&1
ONLY=gadgets,mobile-gadgets,mobile-fb-photo,trail-dropin,trail-sound,exhaustion,arms-app node artifacts/merge-baseline/run2.mjs step4 >> $D/a.txt 2>&1
echo ALLDONE >> $D/a.txt
