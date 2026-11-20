#!/bin/zsh
cd ~/gwanak-hiking; . ~/.nvm/nvm.sh >/dev/null; nvm use 24 >/dev/null
S=artifacts/merge-baseline/step6
( ONLY=plaza-start,full-autowalk,auto-view,entrance-integration,start-choice,ui-frame,no-realistic,namsan-game node artifacts/merge-baseline/run.mjs step6 > $S/a.log 2>&1
  echo "A exit=$?" >> $S/a.log
  ONLY=arms-app,exhaustion,gadgets,mobile-fb-photo,mobile-gadgets,trail-dropin,trail-sound node artifacts/merge-baseline/run2.mjs step6 > $S/b.log 2>&1
  echo "B exit=$?" >> $S/b.log ) &
zsh $S/run13.sh mobile-pages free-settings interaction hiking-interactions hiker-interactions rest-integration trail-buttons trail-dropin-route radio
wait; echo ALL-DONE > $S/done2.txt
