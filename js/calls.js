window.WACalls={
 parse(text){
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean); if(lines.length<2)return [];
  const split=line=>{let out=[],cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}else if(c===','&&!q){out.push(cur);cur=''}else cur+=c}out.push(cur);return out};
  const h=split(lines[0]).map(x=>x.trim());
  return lines.slice(1).map(line=>{
    const v=split(line),o={};h.forEach((k,i)=>o[k]=v[i]??'');
    const sec=Number(o.duration_seconds||0);
    let d=null;

    // The CSV's date + time represent the local call time. Use them first so
    // browser timezone conversion cannot move a call to another day/hour.
    if(o.date){
      const dateMatch=String(o.date).trim().match(/^(\d{4})[-\/]([01]?\d)[-\/]([0-3]?\d)$/);
      const timeMatch=String(o.time||'00:00:00').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if(dateMatch){
        const year=Number(dateMatch[1]),month=Number(dateMatch[2]),day=Number(dateMatch[3]);
        const hour=timeMatch?Number(timeMatch[1]):0,minute=timeMatch?Number(timeMatch[2]):0,second=timeMatch&&timeMatch[3]?Number(timeMatch[3]):0;
        d=new Date(year,month-1,day,hour,minute,second);
      }
    }
    if(!d && o.timestamp_ms && Number(o.timestamp_ms)>0)d=new Date(Number(o.timestamp_ms));
    return{contact:o.contact||'',date:d,seconds:Number.isFinite(sec)?Math.max(0,sec):0,direction:o.direction||'',type:o.type||'',result:o.call_result||''}
  }).filter(x=>x.date&&!isNaN(x.date));
 },
 run(calls){
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const valid=calls.filter(c=>c.seconds>0), days={},months={},hours=Array(24).fill(0),week=Array(7).fill(0); let total=0,audio=0,video=0,incoming=0,outgoing=0,night=0;
  for(const c of calls){
    const k=key(c.date);
    const hasDuration=c.seconds>0;
    if(hasDuration){
      days[k]=(days[k]||0)+c.seconds;
      const mk=k.slice(0,7);months[mk]=(months[mk]||0)+c.seconds;
      hours[c.date.getHours()]+=c.seconds;
      week[c.date.getDay()]+=c.seconds;
      total+=c.seconds;
      if(/video/i.test(c.type))video+=c.seconds;else audio+=c.seconds;
      if(c.date.getHours()>=23||c.date.getHours()<5)night+=c.seconds;
    }
    if(/out/i.test(c.direction))outgoing++;else if(/in/i.test(c.direction))incoming++;
  }
  const longest=valid.reduce((a,b)=>b.seconds>a.seconds?b:a,{seconds:0,date:null});
  const busy=Object.entries(days).reduce((a,b)=>b[1]>a[1]?b:a,['',0]);
  return{count:calls.length,completed:valid.length,total,average:valid.length?Math.round(total/valid.length):0,longest,busy,days,months,hours,week,audio,video,incoming,outgoing,night,first:calls[0]?.date,last:calls.at(-1)?.date};
 }
};
