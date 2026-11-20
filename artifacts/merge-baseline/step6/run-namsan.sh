#!/bin/zsh
cd ~/gwanak-hiking; . ~/.nvm/nvm.sh >/dev/null; nvm use 24 >/dev/null
N=artifacts/merge-baseline/step6/namsan
for s in namsan-small-fixes namsan-content; do t=$SECONDS
  perl -e "alarm shift; exec @ARGV" 1800 node scripts/verify-$s.mjs > $N/$s.log 2>&1; echo "$s exit=$? $((SECONDS-t))s" >> $N/summary.txt; done
echo DONE >> $N/summary.txt
