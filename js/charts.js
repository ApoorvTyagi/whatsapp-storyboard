window.WACharts={
 timeline(canvas,days,options={}){
  const ctx=canvas.getContext('2d'),entries=Object.entries(days).sort((a,b)=>a[0].localeCompare(b[0]));
  const vals=entries.map(x=>x[1]),dpr=devicePixelRatio||1,w=canvas.clientWidth||600,h=260;
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  if(!vals.length)return;
  const max=Math.max(...vals,1),pad=18;
  ctx.strokeStyle='#1d1d1b';ctx.lineWidth=2;ctx.beginPath();
  vals.forEach((v,i)=>{const x=pad+i*(w-pad*2)/Math.max(1,vals.length-1),y=h-pad-v/max*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
  ctx.stroke();ctx.lineTo(w-pad,h-pad);ctx.lineTo(pad,h-pad);ctx.closePath();ctx.globalAlpha=.08;ctx.fill();ctx.globalAlpha=1;

  const tip=options.tooltip;
  if(!tip||!entries.length)return;
  const nearest=()=>{
    const r=canvas.getBoundingClientRect();
    const x=Math.max(0,Math.min(w,(window.event?.clientX||0)-r.left));
    return Math.max(0,Math.min(entries.length-1,Math.round((x-pad)/((w-pad*2)/Math.max(1,entries.length-1)))));
  };
  const move=e=>{
    const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    if(x<0||x>w||y<0||y>h){tip.hide();return}
    const idx=Math.max(0,Math.min(entries.length-1,Math.round((x-pad)/((w-pad*2)/Math.max(1,entries.length-1)))));
    const [date,value]=entries[idx];
    const d=new Date(`${date}T00:00:00`);
    tip.show(e,`${d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'})}<br><strong>${options.format?options.format(value):value}</strong>`);
  };
  canvas.addEventListener('mousemove',move);canvas.addEventListener('mouseleave',()=>tip.hide());
 },
 heatmap(container,days,tooltip){
  container.innerHTML='';
  const entries=Object.entries(days).sort((a,b)=>a[0].localeCompare(b[0]));
  if(!entries.length)return;
  const end=new Date(`${entries.at(-1)[0]}T00:00:00`);
  const start=new Date(end);start.setDate(end.getDate()-364);
  start.setDate(start.getDate()-start.getDay());
  const max=Math.max(...Object.values(days),1);
  const fragment=document.createDocumentFragment();
  for(let d=new Date(start);d<=end||d.getDay()!==0;d.setDate(d.getDate()+1)){
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const count=days[key]||0;
    // Capture the date value, not the mutable Date object used by the loop.
    // Otherwise every hover handler ends up showing the final calendar date.
    const hoverDate=new Date(`${key}T00:00:00`);
    const cell=document.createElement('i');cell.dataset.date=key;cell.dataset.count=count;cell.style.opacity=count?String(.12+.88*count/max):'.06';
    cell.addEventListener('mouseenter',e=>tooltip.show(e,`${hoverDate.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'})}<br><strong>${count?`${count} message${count===1?'':'s'}`:'No messages'}</strong>`));
    cell.addEventListener('mousemove',e=>tooltip.move(e));cell.addEventListener('mouseleave',()=>tooltip.hide());
    fragment.appendChild(cell);
  }
  container.appendChild(fragment);
 }
};
