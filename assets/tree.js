
(function(){
var el=document.getElementById('app'); if(!el) return;
var cfg=JSON.parse(document.getElementById('cfg').textContent);
fetch(cfg.data).then(function(r){return r.json();}).then(function(D){ build(D, cfg); })
 .catch(function(){ document.getElementById('tree').innerHTML='<li>Datus neizdevās ielādēt.</li>'; });

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var COLORS=[['Tumši bēra','--c-darkbay'],['Dūkanbēra','--c-dun'],['Bēra','--c-bay'],
  ['Tumši ruda','--c-chestnut'],['Ruds gaišskaris','--c-chestnut'],['Ruda','--c-chestnut'],
  ['Tumši sirma','--c-grey'],['Sirma','--c-grey'],['Dūkana','--c-dun'],['Melna','--c-black']];
function colorVar(c){for(var i=0;i<COLORS.length;i++){if(c&&c.indexOf(COLORS[i][0])===0)return COLORS[i][1];}
  return '--c-unknown';}

function build(D,cfg){
  var rows=D.horses, ped=D.pedigree, subject=cfg.subject;
  var byId={}; rows.forEach(function(r){byId[r.id]=r;});
  var self=rows.filter(function(r){return r.id===subject;})[0];
  var lineIds={};
  if(self){ var r=self; while(r){ lineIds[r.id]=1; r=r.dam_id?byId[r.dam_id]:null; } }

  var cl=document.getElementById('colorlegend');
  if(cl) cl.innerHTML=[['Bēra','--c-bay'],['Tumši bēra','--c-darkbay'],['Ruda','--c-chestnut'],
    ['Sirma','--c-grey'],['Dūkana','--c-dun']].map(function(c){
      return '<span><span class="dot" style="background:var('+c[1]+')"></span> '+c[0]+'</span>';}).join('');

  var cr=document.getElementById('crumb');
  if(cr&&self){ var line=[],p=self; while(p){line.unshift(p);p=p.dam_id?byId[p.dam_id]:null;}
    cr.innerHTML='Mātes līnija<span class="arw">›</span>'+line.map(function(x){
      return '<b>'+esc(x.name.replace(/\s+(AA|\d{2}-).*$/,''))+'</b> '+x.year;}).join('<span class="arw">›</span>');}

  if(ped){
    var pe=document.getElementById('ped');
    function pnode(h,depth){
      var cls=depth===0?'self':(h.s==='T'?'t':'m');
      var meta=[h.y,h.c,h.b].filter(Boolean).join(' · ');
      var dot='<span class="dot'+(h.s==='T'?' sq':'')+'" style="background:var('+colorVar(h.c)+')"></span>';
      var box='<div class="pbox '+cls+(h.root?' root':'')+'"><span class="nm">'+dot+
        '<span>'+esc(h.n)+'</span></span>'+(meta?'<span class="meta">'+esc(meta)+'</span>':'')+'</div>';
      var kids=h.k&&h.k.length?'<div class="pkids">'+h.k.map(function(k){return pnode(k,depth+1);}).join('')+'</div>':'';
      return '<div class="pnode">'+box+kids+'</div>';
    }
    if(pe) pe.innerHTML=pnode(ped,0);
  }

  var kidsOf={};
  rows.forEach(function(r){ if(r.dam_id)(kidsOf[r.dam_id]=kidsOf[r.dam_id]||[]).push(r); });
  var collapsed={};
  rows.forEach(function(r){ if(!lineIds[r.id]) collapsed[r.id]=true; });
  rows.forEach(function(r){ if(r.depth===0) collapsed[r.id]=false; });

  var qEl=document.getElementById('q'), maresBtn=document.getElementById('mares'),
      lineBtn=document.getElementById('linebtn'), treeEl=document.getElementById('tree'),
      cntEl=document.getElementById('count');
  var maresOnly=false, lineOnly=false;

  function damPath(r){var o=[],p=r.dam_id;
    while(p&&byId[p]){o.unshift(byId[p].name.replace(/\s+(AA|\d{2}-).*$/,''));p=byId[p].dam_id;}
    return o.join(' › ');}
  function rowHTML(r,o){o=o||{};
    var kidn=(kidsOf[r.id]||[]).length;
    var cls='row'+(r.id===subject?' self':'')+(lineIds[r.id]?' line':'')+(r.depth===0?' rootrow':'');
    var tg=(kidn&&!o.flat)?'<button class="tg" data-id="'+r.id+'" aria-label="Izvērst">'+
      (collapsed[r.id]?'▶':'▼')+'</button>':'';
    var sub=[r.year,r.color,r.sire?('T. '+r.sire):''].filter(Boolean).map(esc).join('<span class="sep">·</span>');
    if(o.crumb) sub+='<span class="sep">·</span><span class="crumb">'+esc(o.crumb)+'</span>';
    return '<div class="'+cls+'"><span class="dot'+(r.sex==='V'?' sq':'')+
      '" style="background:var('+colorVar(r.color)+')"></span><span class="nmline">'+tg+
      '<span class="nm2">'+esc(r.name)+'<span class="sx">'+(r.sex==='S'?'ķēve':'ērzelis')+
      '</span></span><span class="sub">'+sub+'</span></span><span class="cnt">'+
      (kidn?kidn+' kum.':'')+'</span></div>';}
  function render(){
    var q=(qEl?qEl.value:'').trim().toLowerCase(), out=[], shown=0;
    if(q||maresOnly||lineOnly){
      rows.forEach(function(r){
        var hay=(r.name+' '+r.year+' '+r.sire+' '+r.color).toLowerCase();
        if(q&&hay.indexOf(q)===-1)return;
        if(maresOnly&&r.sex!=='S')return;
        if(lineOnly&&!lineIds[r.id])return;
        shown++; out.push('<li>'+rowHTML(r,{flat:true,crumb:damPath(r)})+'</li>');});
      treeEl.innerHTML=out.join('')||'<li><div class="row"><span></span><span class="sub">Nekas neatbilst.</span><span></span></div></li>';
    } else {
      var i=0;
      function countIn(h){return (h.match(/class="row/g)||[]).length;}
      function branch(depth){var html='';
        while(i<rows.length&&rows[i].depth===depth){
          var r=rows[i];i++;shown++;var kids='';
          if(i<rows.length&&rows[i].depth>depth){
            var sub=branch(depth+1);
            if(!collapsed[r.id]) kids='<ul>'+sub+'</ul>'; else shown-=countIn(sub);}
          html+='<li>'+rowHTML(r)+kids+'</li>';}
        return html;}
      treeEl.innerHTML=branch(0);
    }
    if(cntEl) cntEl.textContent=shown+' no '+rows.length+' zirgiem';
  }
  treeEl.addEventListener('click',function(e){var b=e.target.closest('.tg');if(!b)return;
    collapsed[b.dataset.id]=!collapsed[b.dataset.id];render();});
  if(qEl) qEl.addEventListener('input',render);
  if(maresBtn) maresBtn.addEventListener('click',function(){maresOnly=!maresOnly;
    maresBtn.setAttribute('aria-pressed',maresOnly);render();});
  if(lineBtn) lineBtn.addEventListener('click',function(){lineOnly=!lineOnly;
    lineBtn.setAttribute('aria-pressed',lineOnly);render();});
  var ex=document.getElementById('expand'), co=document.getElementById('collapse');
  function reset(){if(qEl)qEl.value='';maresOnly=false;lineOnly=false;
    if(maresBtn)maresBtn.setAttribute('aria-pressed',false);
    if(lineBtn)lineBtn.setAttribute('aria-pressed',false);}
  if(ex) ex.addEventListener('click',function(){collapsed={};reset();render();});
  if(co) co.addEventListener('click',function(){collapsed={};
    rows.forEach(function(r){if(r.depth>=1)collapsed[r.id]=true;});reset();render();});
  render();
}
})();
