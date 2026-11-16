// 크리스마스 마을 동동이 = 흡연장·등산과 같은 동동이 몸(src/lounge/avatar.js createAvatar) + 크리스마스 차림(outfits.js).
// 이동·걷기·말풍선 자리 계산은 createAvatar 그대로다. 바뀌는 것은 옷·모자·목도리뿐이다.
import {createAvatar} from '../lounge/avatar.js';
import {applyXmasLook,DEFAULT_XMAS_OUTFIT} from './outfits.js';

// look = {outfit:'santa'|'sweater'|'elf', hat:null|'santa'|'antlers'|'beanie'|'elf'|'none', scarf:null|'stripe'}
export async function createXmasAvatar({rigUrl,toon,look={outfit:DEFAULT_XMAS_OUTFIT},name='동동이',id='me'}){
 const a=await createAvatar({rigUrl,toon,name,id});
 const wear=l=>{a.look=applyXmasLook(a.hiker,l);toon.toonify(a.hiker.scene,{kind:'character'});
  a.hiker.scene.traverse(o=>{if(o.isMesh&&o.name.startsWith('Xmas_')&&!o.userData.outline){o.castShadow=true;o.receiveShadow=!o.userData.noReceiveShadow;}});return a.look;};
 wear(look);
 a.setLook=l=>wear({...a.look,...l});
 // 흡연장 옷 바꾸기(setOutfit)는 크리스마스에서 쓰지 않는다.
 a.setOutfit=k=>wear({...a.look,outfit:k});
 return a;
}
