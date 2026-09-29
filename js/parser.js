window.WAParser={
  parse(text){
    text=text.replace(/^\uFEFF/,'');
    const lines=text.split(/\r?\n/),out=[];
    const pat=/^\[?(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?\]?\s*[-–]?\s*([^:]+):\s*([\s\S]*)$/i;

    function parseDate(a,b,y,h,mi,s,ampm){
      a=Number(a); b=Number(b); y=Number(y); h=Number(h); mi=Number(mi); s=Number(s||0);
      if(y<100)y+=2000;
      if(ampm){
        if(/pm/i.test(ampm)&&h<12)h+=12;
        if(/am/i.test(ampm)&&h===12)h=0;
      }

      // WhatsApp exports are commonly MM/DD/YY in the source shown here.
      // If one side is >12, the format is unambiguous.
      let month,day;
      if(a>12 && b<=12){ day=a; month=b; }
      else if(b>12 && a<=12){ month=a; day=b; }
      else { month=a; day=b; } // ambiguous 1/2/26 -> use MM/DD

      const d=new Date(y,month-1,day,h,mi,s);
      // Reject impossible dates instead of silently rolling them into another month.
      if(d.getFullYear()!==y || d.getMonth()!==month-1 || d.getDate()!==day)return null;
      return d;
    }

    let cur=null;
    for(const line of lines){
      const m=line.match(pat);
      if(m){
        const [,a,b,y,h,mi,s,ampm,who,msg]=m;
        const d=parseDate(a,b,y,h,mi,s,ampm);
        if(d){
          cur={date:d,sender:who.trim(),text:msg};
          out.push(cur);
        } else if(cur) {
          cur.text+='\n'+line;
        }
      } else if(cur){
        cur.text+='\n'+line;
      }
    }
    return out.filter(x=>x.date&&!isNaN(x.date));
  }
};
