#!/bin/zsh
# 3단계 낡은 점검 13개를 한 서버(5420)에서 차례로. 결과 = final/<이름>.log, 요약 = final/summary.txt
cd ~/gwanak-hiking; . ~/.nvm/nvm.sh >/dev/null; nvm use 24 >/dev/null
F=artifacts/merge-baseline/step3/final; : > $F/summary.txt
npx vite --port 5420 --strictPort --host 127.0.0.1 > $F/vite.log 2>&1 &
V=$!; for i in {1..60}; do curl -s -o /dev/null http://127.0.0.1:5420/hiking/ && break; sleep 1; done
B=http://127.0.0.1:5420/hiking/
L=($@); (( $#L )) || L=(controls-camera facing hud-toggle mobile-buttons mobile-pages free-settings interaction hiking-interactions hiker-interactions rest-integration trail-buttons trail-dropin-route radio)
for s in $L; do
  O=$F/$s; mkdir -p $O; t=$SECONDS
  BASE_URL=$B PORT=5420 OUT=$O OUT_DIR=$O WAIT_MS=600000 perl -e "alarm shift; exec @ARGV" 1500 node scripts/verify-$s.mjs > $F/$s.log 2>&1
  echo "$s exit=$? $((SECONDS-t))s" >> $F/summary.txt
done
kill $V; pkill -f 'vite --port 5420'; echo DONE >> $F/summary.txt
