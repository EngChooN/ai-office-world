// 온라인 크리스마스 캐럴 배경음 목록(월드개발, 2026-11-16). 기획서 완료 기준 7 '캐럴 분위기'.
// 곡: docs/크리스마스/소리-출처-v1.md §2-4-1의 1순위 미 공군 군악대 녹음 8곡(위키미디어 공용, Public domain — PD-USGov-Military). 2순위·저작권이 남은 곡은 쓰지 않는다.
// 파일은 공용에서 받은 원본 그대로(다시 인코딩·자르기 없음, 이름만 짧게) public/sounds/christmas/carol/. 출처는 data/자료-출처-이용조건-기록표.md §16과 게임 안 「소리 출처」(hud.js).
//  - end: 곡이 끝나고 무음이 이어지는 곳(ffmpeg silencedetect −50dB). 재생기는 여기서 다음 곡으로 넘어간다(파일 뒤 무음 3~17초를 건너뜀). start: 앞 무음.
//  - gain: 곡마다 소리 크기(ebur128 통합 음량 LUFS)를 −17.3 LUFS(가장 작은 O Christmas Tree)에 맞추는 배율. 원본 파일은 건드리지 않는다.
//  - vocals: 노래(가사) 여부. 음성 인식(whisper.cpp small, 영어)으로 전곡을 돌려 가사가 한 줄도 잡히지 않음(11-16). 사람 귀 확인은 아직.
export const CAROL_DIR='sounds/christmas/carol/';
const PD='Public domain (PD-USGov-Military)';
const MA='United States Air Force Band of Mid-America — Starlifter and Roots in Blue',MA_ARR='SSgt Tim Davis, SrA David Duneman';
const AON='United States Air Force Band — Airmen of Note';
const page=f=>`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g,'_')).replace(/%2C/g,',').replace(/%28/g,'(').replace(/%29/g,')')}`;
const MA_FILE=t=>`${t} (2020) - Starlifter and Roots in Blue - United States Air Force Band of Mid-America.mp3`;
const t=(id,title,composer,arranger,performer,original,file,duration,end,start,lufs,note='')=>Object.freeze({id,title,composer,arranger,performer,original,page:page(original),file,duration,end,start,gain:+Math.min(1,10**((-17.3-lufs)/20)).toFixed(3),lufs,license:PD,vocals:false,note});
// 순서: 빠른 곡과 잔잔한 곡을 번갈아(광장 하나에서 계속 돈다)
export const CAROLS=Object.freeze([
 t('jingle','Jingle Bells','James Lord Pierpont',MA_ARR,MA,MA_FILE('Jingle Bells'),'jingle-bells-2020.mp3',132.816,119.3,0,-12.3),
 t('noel','The First Noel','전통(traditional)',MA_ARR,MA,MA_FILE('The First Noel'),'the-first-noel-2020.mp3',217.32,212.5,2.3,-13.9),
 t('wish','We Wish You a Merry Christmas','전통(traditional)',MA_ARR,MA,MA_FILE('We Wish You a Merry Christmas'),'we-wish-you-a-merry-christmas-2020.mp3',134.928,117.9,0,-11.8),
 t('tree','O Christmas Tree','전통(traditional)','MSgt Rich Sigler',AON,'O Christmas Tree - Airmen of Note - United States Air Force Band.mp3','o-christmas-tree-airmen-of-note.mp3',347.376,344.7,0,-17.3),
 t('joy','Joy to the World','George Frideric Handel(선율)',MA_ARR,MA,MA_FILE('Joy to the World'),'joy-to-the-world-2020.mp3',131.928,124.5,0,-14.2),
 t('silent','Silent Night','Franz Gruber',MA_ARR,MA,MA_FILE('Silent Night'),'silent-night-2020.mp3',282.6,271.6,0,-13.3),
 t('wenceslas','Good King Wenceslas and His Merry Band','전통(traditional)','SMSgt Mike Crotty',AON,'Good King Wenceslas and His Merry Band - Airmen of Note - United States Air Force Band.mp3','good-king-wenceslas-airmen-of-note.mp3',245.316,241.3,3.1,-15.0),
 t('gentlemen','God Rest Ye Merry Gentlemen','전통(traditional)',MA_ARR,MA,MA_FILE('God Rest Ye Merry Gentlemen'),'god-rest-ye-merry-gentlemen-2020.mp3',252.238,244.3,0,-9.4,'시작에 새소리, 2:56쯤 짧은 외침("Go!") 한 번(음성 인식)'),
]);
// 모든 사람이 같은 시계로 같은 곡을 듣는다(관악산 FM과 같은 방식): 곡 길이(end) 합으로 돈다
export function carolAt(tracks=CAROLS,tSec=0){
 const total=tracks.reduce((s,x)=>s+x.end,0);if(!(total>0))return {index:0,offset:0};
 let x=((tSec%total)+total)%total;
 for(let i=0;i<tracks.length;i++){if(x<tracks[i].end)return {index:i,offset:x};x-=tracks[i].end;}
 return {index:0,offset:0};
}
// 「소리 출처」 한 줄
export const carolCredit=c=>`"${c.title}" — 연주: ${c.performer} · 편곡: ${c.arranger} · 작곡: ${c.composer} · ${c.license}`;
