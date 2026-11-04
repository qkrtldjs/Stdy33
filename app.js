'use strict';
const $=id=>document.getElementById(id);
const key='daylist-life-v1';
const db=JSON.parse(localStorage.getItem(key)||'{"tasks":[],"goals":[],"checks":{}}');
const stamp=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const shift=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return stamp(d)};
const today=()=>stamp(new Date());
const format=(s,opts)=>new Date(s+'T12:00').toLocaleDateString('ko-KR',opts);
let selected=today(), tab='today', week=selected;
function tasksOn(s){return db.tasks.filter(t=>t.date===s||(t.date<s&&(t.repeat==='daily'||(t.repeat==='weekly'&&new Date(t.date+'T12:00').getDay()===new Date(s+'T12:00').getDay()))))}
function completed(t,s){return !!db.checks[t.id+'@'+s]}
function save(){localStorage.setItem(key,JSON.stringify(db));render()}
function node(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n}
function button(txt,fn,cls){const b=node('button',cls,txt);b.type='button';b.onclick=fn;return b}
function openDay(s){selected=s;tab='today';render()}
function daily(){
 const tasks=tasksOn(selected),done=tasks.filter(t=>completed(t,selected)).length;
 $('heading').textContent=selected===today()?'오늘 할 일':'이날의 할 일';
 $('dateLabel').textContent=format(selected,{year:'numeric',month:'long',day:'numeric',weekday:'long'});
 $('date').value=selected;$('score').textContent=done+' / '+tasks.length;
 document.querySelector('.ring').style.setProperty('--done',(tasks.length?100*done/tasks.length:0)+'%');
 const list=$('list');list.replaceChildren();
 if(!tasks.length)list.append(node('p','empty','아래에 첫 할 일을 적어보세요.'));
 for(const t of tasks){
  const row=node('div','row'),label=node('label'),box=node('input'),content=node('span','',t.title);
  box.type='checkbox';box.checked=completed(t,selected);box.onchange=()=>{const k=t.id+'@'+selected;if(box.checked)db.checks[k]=true;else delete db.checks[k];save()};
  const g=db.goals.find(g=>g.id===t.goal);
  content.append(node('small','meta',[t.category,{daily:'매일',weekly:'매주'}[t.repeat],g?.title].filter(Boolean).join(' · ')));
  label.append(box,content);row.append(label,button('삭제',()=>{
   if(!confirm(t.repeat==='once'?'이 할 일을 삭제할까요?':'이 반복 습관과 모든 날짜의 체크 기록을 삭제할까요?'))return;
   db.tasks=db.tasks.filter(x=>x.id!==t.id);for(const k of Object.keys(db.checks))if(k.startsWith(t.id+'@'))delete db.checks[k];save()
  },'del'));list.append(row)
 }
 const old=$('goal').value;$('goal').replaceChildren(new Option('목표 연결 안 함',''));for(const g of db.goals)$('goal').add(new Option(g.title,g.id));if(db.goals.some(g=>g.id===old))$('goal').value=old;
}
function weekly(){
 const monday=shift(week,-((new Date(week+'T12:00').getDay()+6)%7));$('weekLabel').textContent=monday+' ~ '+shift(monday,6).slice(5);
 const list=$('weekRows');list.replaceChildren();for(let i=0;i<7;i++){
  const s=shift(monday,i),ts=tasksOn(s),b=button('',()=>openDay(s),'weekrow');
  b.append(node('b','',format(s,{month:'numeric',day:'numeric',weekday:'short'})),node('span','',ts.map(t=>t.title).join(' · ')||'할 일 추가하기'),node('em','',ts.filter(t=>completed(t,s)).length+'/'+ts.length));list.append(b)
 }
}
function goals(){
 const list=$('goalRows');list.replaceChildren();if(!db.goals.length)list.append(node('p','empty','목표를 만든 뒤 오늘의 할 일과 연결해 보세요.'));
 for(const g of db.goals){
  const linked=db.tasks.filter(t=>t.goal===g.id),count=Object.keys(db.checks).filter(k=>linked.some(t=>k.startsWith(t.id+'@'))).length;
  const row=node('div','row'),text=node('div','grow',g.title);text.append(node('span','meta','연결한 할 일 '+linked.length+'개 · 누적 실천 '+count+'회'));
  row.append(text,button('삭제',()=>{if(!confirm('목표를 삭제할까요? 연결된 할 일은 남습니다.'))return;for(const t of linked)t.goal='';db.goals=db.goals.filter(x=>x.id!==g.id);save()},'del'));list.append(row)
 }
}
function render(){for(const id of ['today','week','goals'])$(id).hidden=id!==tab;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));({today:daily,week:weekly,goals})[tab]()}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;if(tab==='week')week=selected;render()});
$('prev').onclick=()=>openDay(shift(selected,-1));$('next').onclick=()=>openDay(shift(selected,1));$('now').onclick=()=>openDay(today());$('date').onchange=e=>{if(e.target.value)openDay(e.target.value)};
$('backWeek').onclick=()=>{week=shift(week,-7);render()};$('nextWeek').onclick=()=>{week=shift(week,7);render()};
$('add').onsubmit=e=>{e.preventDefault();const title=$('title').value.trim();if(!title)return;db.tasks.push({id:crypto.randomUUID(),date:selected,title,category:$('category').value,repeat:$('repeat').value,goal:$('goal').value});$('title').value='';save()};
$('newGoal').onsubmit=e=>{e.preventDefault();const title=$('goalTitle').value.trim();if(!title)return;db.goals.push({id:crypto.randomUUID(),title});$('goalTitle').value='';save()};
render();
