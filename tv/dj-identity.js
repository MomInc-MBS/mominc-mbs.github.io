/* One identity follows the player from the Music Desk to the Gala. */
(()=>{'use strict';
 const KEY='mbs-dj-identity-v1';
 const moniker=value=>String(value||'').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);
 function valid(value){return !!(value&&value.version===1&&typeof value.base==='string'&&value.base.length>0&&value.base.length<=48&&/^[A-Z0-9]{3}$/.test(value.moniker)&&Array.isArray(value.parts)&&value.parts.length===3&&value.parts.every(p=>typeof p==='string'&&p.length<24)&&Number.isSafeInteger(value.chosenAt)&&value.chosenAt>0&&(value.completedAt===null||Number.isSafeInteger(value.completedAt)&&value.completedAt>=value.chosenAt));}
 function read(){try{const value=JSON.parse(localStorage.getItem(KEY));return valid(value)?value:null;}catch{return null;}}
 function write(value){localStorage.setItem(KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent('mbs:dj-identity',{detail:value}));return value;}
 function choose(base,tag,parts){tag=moniker(tag);if(tag.length!==3)throw Error('Add three letters or numbers for your moniker.');base=String(base||'').trim().slice(0,48);if(!base||!Array.isArray(parts)||parts.length!==3||parts.some(p=>!p))throw Error('Choose all three parts of your DJ name.');const old=read();if(old?.completedAt&&(old.base!==base||old.moniker!==tag))throw Error('Your prisoner name is locked to this run.');return write({version:1,base,moniker:tag,parts,chosenAt:old?.chosenAt||Date.now(),completedAt:old?.completedAt||null});}
 function complete(){const current=read();if(!current)throw Error('Choose your DJ name first.');if(current.completedAt)return current;return write({...current,completedAt:Date.now()});}
 function name(value=read()){return value?`${value.base} · ${value.moniker}`:'Anonymous guest';}
 function display(value=read()){return value?.completedAt?`PRISONER ${name(value)}`:'Anonymous guest';}
 function retag(tag){const old=read();tag=moniker(tag);if(!old||tag.length!==3)throw Error('Use three letters or numbers.');return write({...old,moniker:tag});}
 window.MBS_DJ={KEY,moniker,valid,read,choose,complete,name,display,retag};
})();
