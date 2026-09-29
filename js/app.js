const $=s=>document.querySelector(s),fmt=n=>new Intl.NumberFormat().format(n),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dur=s=>{s=Math.round(Number(s)||0);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${fmt(h)}h ${m}m`:`${m}m`}; const day=d=>d?d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'—';
let chatText='',callText=''; function ready(){ $('#build').disabled=!(chatText&&callText) }
async function takeFile(f,kind){if(!f)return; const name=f.name.toLowerCase(); if(kind==='chat'&&!name.endsWith('.txt')){status('Please choose a .txt WhatsApp chat export.');return} if(kind==='call'&&!name.endsWith('.csv')){status('Please choose a .csv call export.');return} const txt=await f.text(); if(kind==='chat'){chatText=txt;$('#chatName').textContent=f.name}else{callText=txt;$('#callName').textContent=f.name} status('');ready()}
function setupPicker(boxSel,inputSel,kind){const box=$(boxSel),input=$(inputSel); box.onclick=e=>{if(e.target!==input)input.click()}; box.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click()}}; input.onchange=e=>takeFile(e.target.files[0],kind); ['dragenter','dragover'].forEach(ev=>box.addEventListener(ev,e=>{e.preventDefault();box.classList.add('dragging')})); ['dragleave','drop'].forEach(ev=>box.addEventListener(ev,e=>{e.preventDefault();box.classList.remove('dragging')})); box.addEventListener('drop',e=>takeFile(e.dataTransfer.files[0],kind));}
setupPicker('#chatDrop','#chatFile','chat');setupPicker('#callDrop','#callFile','call');
$('#build').onclick=()=>render(chatText,callText);
$('#loadDefault').onclick=async()=>{
  status('Looking for data/chat.txt and data/whatsapp_calls.csv…');
  try{
    // Support both normal hosting (/) and Cloudflare Tunnel published apps mounted
    // under a path such as /shalvi. Try the mounted path first, then the root path.
    const appBase=location.pathname.endsWith('/')?location.pathname:location.pathname+'/';
    const bases=[appBase,'/'].filter((v,i,a)=>a.indexOf(v)===i);
    let loaded=null;
    for(const base of bases){
      try{
        const [a,b]=await Promise.all([
          fetch(base+'data/chat.txt',{cache:'no-store'}),
          fetch(base+'data/whatsapp_calls.csv',{cache:'no-store'})
        ]);
        if(a.ok&&b.ok){
          loaded={a,b,base};
          break;
        }
      }catch(e){
        console.warn('Data path failed:',base,e);
      }
    }
    if(!loaded)throw new Error('Bundled data files were not found');
    chatText=await loaded.a.text();
    callText=await loaded.b.text();
    $('#chatName').textContent=loaded.base+'data/chat.txt';
    $('#callName').textContent=loaded.base+'data/whatsapp_calls.csv';
    render(chatText,callText);
  }catch(e){
    console.error('Failed to load bundled data:',e);
    status('Could not load files from data/. Choose both files above, or make sure data/chat.txt and data/whatsapp_calls.csv are available to the published app.');
  }
};
function status(x){$('#status').textContent=x}
function render(ct,cl){const msgs=WAParser.parse(ct),calls=WACalls.parse(cl);if(!msgs.length){status('No chat messages recognized.');return}if(!calls.length){status('No call rows recognized in the CSV.');return}const a=WAAnalytics.run(msgs),c=WACalls.run(calls);$('#upload').classList.add('hidden');$('#dash').classList.remove('hidden');const first=new Date(Math.min(a.first,c.first)),last=new Date(Math.max(a.last,c.last));$('#range').textContent=`${first.getFullYear()} — ${last.getFullYear()}`;
$('#callTime').textContent=dur(c.total);$('#callSub').textContent=`${fmt(c.completed)} calls with duration`;$('#calls').textContent=fmt(c.count);$('#avgCall').textContent=`${dur(c.average)} average`;$('#longestCall').textContent=dur(c.longest.seconds);$('#longestDate').textContent=day(c.longest.date);$('#messages').textContent=fmt(a.count);$('#msgSub').textContent=`≈ ${fmt(Math.round(a.count/Object.keys(a.days).length))} per active day`;$('#media').textContent=fmt(a.media);
bars('#callWeek',c.week,v=>dur(v));hours('#callHours',c.hours,v=>dur(v),dashboardTooltip);const av=c.audio+c.video||1;const audioPct=c.audio/av*100;const videoPct=c.video/av*100;$('#callMix').innerHTML=`<div class="call-mix-donut" style="--audio-p:${audioPct}%;" tabindex="0" data-tooltip="Audio ${audioPct.toFixed(1)}% · Video ${videoPct.toFixed(1)}%"><div><b>Audio : Video</b><small>audio : video</small></div></div><div class="mixtext"><p><b>${dur(c.audio)}</b><span class="mix-key"><i></i>Audio <em class="mix-percent">${audioPct.toFixed(1)}%</em></span></p><p><b>${dur(c.video)}</b><span class="mix-key"><i class="video"></i>Video <em class="mix-percent">${videoPct.toFixed(1)}%</em></span></p><p><b>${fmt(c.outgoing)}</b><span>Outgoing calls</span></p><p><b>${fmt(c.incoming)}</b><span>Incoming calls</span></p></div>`;
$('#callRecords').innerHTML=[['Busiest call day',dur(c.busy[1]),c.busy[0]||'—'],['Late-night calls',dur(c.night),'started 11 PM–5 AM'],['Average call',dur(c.average),`${fmt(c.completed)} completed calls`],['Longest call',dur(c.longest.seconds),day(c.longest.date)],['Audio time',dur(c.audio),'voice calls'],['Video time',dur(c.video),'video calls']].map(card).join('');
WACharts.timeline($('#timeline'),a.days,{tooltip:dashboardTooltip,format:v=>`${fmt(v)} messages`});$('#peak').textContent=`Peak: ${fmt(a.busy[1])} msgs`;bars('#week',a.week,v=>fmt(v));hours('#hours',a.hours,v=>`${fmt(v)} messages`,dashboardTooltip);const total=a.count;$('#people').innerHTML=Object.entries(a.people).sort((x,y)=>y[1]-x[1]).map(([n,v])=>`<div class="person"><div><b>${esc(n)}</b><span>${(v/total*100).toFixed(1)}%</span></div><i><b style="width:${v/total*100}%"></b></i><small>${fmt(v)} messages</small></div>`).join('');const peakHour=a.hours.indexOf(Math.max(...a.hours));$('#records').innerHTML=[['Most-used emoji',a.topEmoji[0],`${fmt(a.topEmoji[1])} times`],['Peak message hour',`${String(peakHour).padStart(2,'0')}:00`,`${fmt(a.hours[peakHour])} messages`],['Links shared',fmt(a.links),'across the chat'],['Words written',fmt(a.words),'rough estimate'],['Longest message',`${fmt(a.longest.n)} words`,a.longest.sender||'—'],['Longest active streak',`${a.maxStreak} days`,'consecutive messaging days']].map(card).join('');WACharts.heatmap($('#heatmap'),a.days,dashboardTooltip);window.scrollTo(0,0)}
function card(x){return `<article><span>${esc(x[0])}</span><b>${esc(String(x[1]))}</b><small>${esc(String(x[2]))}</small></article>`}
function bars(sel,vals,label){const names=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],mx=Math.max(...vals,1);$(sel).innerHTML=vals.map((v,i)=>`<div><span>${names[i]}</span><i><b style="width:${v/mx*100}%"></b></i><strong>${label(v)}</strong></div>`).join('')}
function hours(sel,vals,label,tooltip){const mx=Math.max(...vals,1);$(sel).innerHTML=vals.map((v,i)=>`<div data-hour="${i}"><i style="height:${Math.max(3,v/mx*100)}%"></i><span>${i%3===0?i:''}</span></div>`).join('');if(tooltip)$(sel).querySelectorAll('[data-hour]').forEach(el=>{const i=Number(el.dataset.hour);el.addEventListener('mouseenter',e=>tooltip.show(e,`${String(i).padStart(2,'0')}:00<br><strong>${esc(label(vals[i]))}</strong>`));el.addEventListener('mousemove',e=>tooltip.move(e));el.addEventListener('mouseleave',()=>tooltip.hide())})}
const dashboardTooltip=(()=>{let el=document.getElementById('dashboardTooltip');if(!el){el=document.createElement('div');el.id='dashboardTooltip';el.className='dashboard-tooltip';document.body.appendChild(el)}return{show(e,html){el.innerHTML=html;el.classList.add('show');this.move(e)},move(e){el.style.left=`${e.clientX+14}px`;el.style.top=`${e.clientY+14}px`},hide(){el.classList.remove('show')}}})();
$('#newFile').onclick=()=>{$('#dash').classList.add('hidden');$('#upload').classList.remove('hidden')};
