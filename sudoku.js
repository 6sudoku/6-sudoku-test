/* 6 Sudoku v0.12: deterministic 6x6 generator + uniqueness validator. No dependencies. */
(() => {
 'use strict';
 const N=6;
 function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 function rng(seed){let x=hash(seed)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
 function shuffle(arr,rand){arr=[...arr];for(let i=arr.length-1;i>0;i--){let j=Math.floor(rand()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
 function peers(index){const r=Math.floor(index/N),c=index%N;const peers=[];for(let i=0;i<36;i++){if(i===index)continue;const rr=Math.floor(i/N),cc=i%N;if(rr===r||cc===c||(Math.floor(rr/2)===Math.floor(r/2)&&Math.floor(cc/3)===Math.floor(c/3)))peers.push(i)}return peers}
 const PEERS=Array.from({length:36},(_,i)=>peers(i));
 function candidates(board,i){if(board[i])return [];const used=new Set(PEERS[i].map(k=>board[k]));return [1,2,3,4,5,6].filter(v=>!used.has(v))}
 function countSolutions(board,limit=2){const values=[...board];let solutions=0;function dfs(){if(solutions>=limit)return;let best=-1,options=[];for(let i=0;i<36;i++){if(values[i])continue;const cs=candidates(values,i);if(!cs.length)return;if(best<0||cs.length<options.length){best=i;options=cs;if(cs.length===1)break}}if(best<0){solutions++;return}for(const value of options){values[best]=value;dfs();values[best]=0;if(solutions>=limit)return}}dfs();return solutions}
 function fullGrid(rand){const bands=shuffle([0,1,2],rand),stacks=shuffle([0,1],rand);const rows=bands.flatMap(b=>shuffle([0,1],rand).map(r=>b*2+r));const cols=stacks.flatMap(s=>shuffle([0,1,2],rand).map(c=>s*3+c));const nums=shuffle([1,2,3,4,5,6],rand);return rows.flatMap(r=>cols.map(c=>nums[(Math.floor(r/2)+3*(r%2)+c)%6]))}
 function groups(){let out=[];for(let r=0;r<6;r++)out.push(Array.from({length:6},(_,c)=>r*6+c));for(let c=0;c<6;c++)out.push(Array.from({length:6},(_,r)=>r*6+c));for(let br=0;br<6;br+=2)for(let bc=0;bc<6;bc+=3)out.push(Array.from({length:6},(_,k)=>(br+Math.floor(k/3))*6+bc+k%3));return out}
 const GROUPS=groups();
 function logicalDifficulty(board){let work=[...board],steps=0,hidden=0;while(work.some(v=>!v)){let changed=false;for(let i=0;i<36;i++)if(!work[i]){let cs=candidates(work,i);if(cs.length===1){work[i]=cs[0];steps++;changed=true;break}}if(changed)continue;for(const group of GROUPS){for(let n=1;n<=6;n++){if(group.some(i=>work[i]===n))continue;const spots=group.filter(i=>!work[i]&&candidates(work,i).includes(n));if(spots.length===1){work[spots[0]]=n;steps++;hidden++;changed=true;break}}if(changed)break}if(!changed)break}return {solved:work.every(Boolean),steps,hidden,remaining:work.filter(v=>!v).length}}
 const target={beginner:24,intermediate:19,advanced:14,hero:10};
 function create(seed,level='beginner'){
  if(!Object.hasOwn(target,level))level='beginner';
  const rand=rng('6-sudoku-v012|'+seed+'|'+level),solution=fullGrid(rand);let best=null,bestScore=-1;
  // Different fixed attempts; all grids must retain a single valid solution.
  for(let attempt=0;attempt<(level==='hero'?28:7);attempt++){
   let board=[...solution];let order=shuffle(Array.from({length:36},(_,i)=>i),rand);
   for(let i of order){if(board.filter(Boolean).length<=target[level])break;const old=board[i];board[i]=0;if(countSolutions(board,2)!==1)board[i]=old}
   const logic=logicalDifficulty(board),missing=36-board.filter(Boolean).length;
   const score=missing+(level==='advanced'&&!logic.solved?5:0)+(level==='intermediate'&&logic.hidden>0?2:0)+(level==='hero'&&!logic.solved?3:0);
   if(score>bestScore){best={board,logic};bestScore=score}
   if(missing>=36-target[level]&&(level!=='advanced'||!logic.solved))break;
  }
  return {puzzle:best.board,solution,level,seed:String(seed),logic:best.logic};
 }
 function valid(board){if(!Array.isArray(board)||board.length!==36)return false;return GROUPS.every(g=>{const vals=g.map(i=>board[i]).filter(Boolean);return vals.every(v=>Number.isInteger(v)&&v>=1&&v<=6)&&new Set(vals).size===vals.length})}
 function dateUTC(now=new Date()){return now.toISOString().slice(0,10)}
 window.SudokuEngine={create,countSolutions,candidates,logicalDifficulty,valid,dateUTC};
})();
