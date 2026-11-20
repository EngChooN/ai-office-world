#!/bin/zsh
# 6단계 관악산 기준선 28개 = 1군 8개(run.mjs) → 2군 7개(run2.mjs) 차례로 + 옛 13개(run.sh, 5420)는 함께
cd ~/gwanak-hiking; . ~/.nvm/nvm.sh >/dev/null; nvm use 24 >/dev/null
( ONLY=plaza-start,full-autowalk,auto-view,entrance-integration,start-choice,ui-frame,no-realistic,namsan-game node artifacts/merge-baseline/run.mjs step6 > artifacts/merge-baseline/step6/a.log 2>&1
  ONLY=arms-app,exhaustion,gadgets,mobile-fb-photo,mobile-gadgets,trail-dropin,trail-sound node artifacts/merge-baseline/run2.mjs step6 > artifacts/merge-baseline/step6/b.log 2>&1
  echo A-DONE >> artifacts/merge-baseline/step6/b.log ) &
sed 's#step3/final2#step6/old13#' artifacts/merge-baseline/step3/final2/run.sh > artifacts/merge-baseline/step6/run13.sh
zsh artifacts/merge-baseline/step6/run13.sh
wait; echo ALL-DONE > artifacts/merge-baseline/step6/done.txt
