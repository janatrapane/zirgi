
(function(){
var el=document.getElementById('app'); if(!el) return;
var cfg=JSON.parse(document.getElementById('cfg').textContent);
fetch(cfg.data).then(function(r){return r.json();}).then(function(D){ build(D,cfg); })
 .catch(function(){ document.getElementById('tree').innerHTML=
   '<div class="empty-msg">Datus neizdevās ielādēt.</div>'; });

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var LW='https://lwhorse.lv/horse/';
var COLORS=[['Tumši bēra','--c-darkbay'],['Dūkanbēra','--c-dun'],['Bēra','--c-bay'],
  ['Tumši ruda','--c-chestnut'],['Ruds','--c-chestnut'],['Ruda','--c-chestnut'],
  ['Tumši sirma','--c-grey'],['Sirma','--c-grey'],['Salni','--c-bay'],
  ['Dūkana','--c-dun'],['Dūkans','--c-dun'],['Melna','--c-black']];
function colorVar(c){for(var i=0;i<COLORS.length;i++){if(c&&c.indexOf(COLORS[i][0])===0)return COLORS[i][1];}
  return '--c-unknown';}
function fold(s){return String(s||'').toLowerCase()
  .replace(/[āàá]/g,'a').replace(/[ēèé]/g,'e').replace(/[īìí]/g,'i').replace(/[ūùú]/g,'u')
  .replace(/[čć]/g,'c').replace(/[ģ]/g,'g').replace(/[ķ]/g,'k').replace(/[ļ]/g,'l')
  .replace(/[ņñ]/g,'n').replace(/[šś]/g,'s').replace(/[žź]/g,'z').replace(/[`'’]/g,'');}
function shortName(n){return n.replace(/\s+(AA|\d{2}-)[\w\-]*$/,'').trim();}

function build(D,cfg){
  var rows=D.horses, ped=D.pedigree, subject=cfg.subject;
  var byId={}; rows.forEach(function(r){byId[r.id]=r;});
  var self=byId[subject];
  var lineIds={};
  if(self){var r=self; while(r){lineIds[r.id]=1; r=r.dam_id?byId[r.dam_id]:null;}}

  var cl=document.getElementById('colorlegend');
  if(cl) cl.innerHTML=[['Bēra','--c-bay'],['Tumši bēra','--c-darkbay'],['Ruda','--c-chestnut'],
    ['Sirma','--c-grey'],['Dūkana','--c-dun']].map(function(c){
      return '<span><span class="dot" style="background:var('+c[1]+')"></span> '+c[0]+'</span>';}).join('');

  var cr=document.getElementById('crumb');
  if(cr&&self){var line=[],p=self; while(p){line.unshift(p);p=p.dam_id?byId[p.dam_id]:null;}
    cr.innerHTML='Mātes līnija<span class="arw">›</span>'+line.map(function(x){
      return '<a href="'+LW+x.id+'" target="_blank" rel="noopener"><b>'+esc(shortName(x.name))+
             '</b> '+x.year+'</a>';}).join('<span class="arw">›</span>');}

  if(ped&&document.getElementById('ped')){
    function pnode(h,depth){
      var cls=depth===0?'self':(h.s==='T'?'t':'m');
      var l1=[h.y,h.c].filter(Boolean).join(' · ');
      var meta=l1+(h.b?(l1?'<br>':'')+h.b:'');
      var dot='<span class="dot'+(h.s==='T'?' sq':'')+'" style="background:var('+colorVar(h.c)+')"></span>';
      var nm=h.id?'<a href="'+LW+h.id+'" target="_blank" rel="noopener">'+esc(h.n)+'</a>':esc(h.n);
      var box='<div class="pbox '+cls+(h.root?' root':'')+'"><span class="nm">'+dot+
        '<span>'+nm+'</span></span>'+(meta?'<span class="meta">'+meta+'</span>':'')+'</div>';
      var kids=h.k&&h.k.length?'<div class="pkids">'+h.k.map(function(k){return pnode(k,depth+1);}).join('')+'</div>':'';
      return '<div class="pnode">'+box+kids+'</div>';
    }
    document.getElementById('ped').innerHTML=pnode(ped,0);
  }

  var kidsOf={};
  rows.forEach(function(r){if(r.dam_id)(kidsOf[r.dam_id]=kidsOf[r.dam_id]||[]).push(r);});
  var collapsed={};
  rows.forEach(function(r){if(!lineIds[r.id])collapsed[r.id]=true;});
  rows.forEach(function(r){if(r.depth===0)collapsed[r.id]=false;});

  var qEl=document.getElementById('q'), maresBtn=document.getElementById('mares'),
      lineBtn=document.getElementById('linebtn'), treeEl=document.getElementById('tree'),
      cntEl=document.getElementById('count');
  var maresOnly=false, lineOnly=false;

  function damPath(r){var o=[],p=r.dam_id;
    while(p&&byId[p]){o.unshift(shortName(byId[p].name));p=byId[p].dam_id;}
    return o.join(' › ');}

  function rowHTML(r,o){o=o||{};
    var kidn=(kidsOf[r.id]||[]).length;
    var cls='row'+(r.id===subject?' self':'')+(lineIds[r.id]?' line':'');
    var d=o.flat?0:r.depth;
    var tg=(kidn&&!o.flat)
      ? '<button class="tg" data-id="'+r.id+'" aria-expanded="'+(!collapsed[r.id])+
        '" aria-label="Izvērst">'+(collapsed[r.id]?'▶':'▼')+'</button>'
      : '<span class="tg empty">·</span>';
    var last=o.flat?('<span class="col crumb">'+esc(damPath(r))+'</span>')
                   :('<span class="col sr">'+(r.sire?esc(r.sire):'')+'</span>');
    return '<div class="'+cls+'">'+
      '<span class="nmcell" style="padding-left:'+(d*16)+'px;background-size:'+
        Math.max(0,d*16-6)+'px 100%">'+tg+
        '<span class="dot'+(r.sex==='V'?' sq':'')+'" style="background:var('+colorVar(r.color)+')"></span>'+
        '<a class="nm2" href="'+LW+r.id+'" target="_blank" rel="noopener" title="'+esc(r.name)+'">'+
        esc(r.name)+'</a></span>'+
      '<span class="col yr">'+esc(r.year)+'</span>'+
      '<span class="col cl">'+esc(r.color)+'</span>'+ last +
      '<span class="cnt">'+(kidn?'<b>'+kidn+'</b> kum.':'')+'</span></div>';}

  function head(flat){
    return '<div class="thead"><span>Vārds</span><span>Dzimis</span><span>Krāsa</span>'+
      '<span>'+(flat?'Mātes līnija':'Tēvs')+'</span><span>Kumeļi</span></div>';}

  function render(){
    var q=fold((qEl?qEl.value:'').trim()), out=[], shown=0;
    var flat=!!(q||maresOnly||lineOnly);
    if(flat){
      rows.forEach(function(r){
        var hay=fold(r.name+' '+r.year+' '+r.sire+' '+r.color);
        if(q&&hay.indexOf(q)===-1)return;
        if(maresOnly&&r.sex!=='S')return;
        if(lineOnly&&!lineIds[r.id])return;
        shown++; out.push(rowHTML(r,{flat:true}));});
    } else {
      var i=0;
      function countIn(h){return (h.match(/class="row/g)||[]).length;}
      function branch(depth){var html='';
        while(i<rows.length&&rows[i].depth===depth){
          var r=rows[i];i++;shown++;var kids='';
          if(i<rows.length&&rows[i].depth>depth){
            var sub=branch(depth+1);
            if(!collapsed[r.id])kids=sub; else shown-=countIn(sub);}
          html+=rowHTML(r)+kids;}
        return html;}
      out.push(branch(0));
    }
    treeEl.innerHTML='<div class="tgrid">'+head(flat)+'<div class="rows">'+
      (out.join('')||'<div class="empty-msg">Nekas neatbilst meklējumam.</div>')+'</div></div>';
    if(cntEl) cntEl.textContent=shown+' no '+rows.length+' zirgiem';
  }

  treeEl.addEventListener('click',function(e){var b=e.target.closest('.tg');
    if(!b||!b.dataset.id)return;
    collapsed[b.dataset.id]=!collapsed[b.dataset.id];render();});
  if(qEl) qEl.addEventListener('input',render);
  if(maresBtn) maresBtn.addEventListener('click',function(){maresOnly=!maresOnly;
    maresBtn.setAttribute('aria-pressed',maresOnly);render();});
  if(lineBtn) lineBtn.addEventListener('click',function(){lineOnly=!lineOnly;
    lineBtn.setAttribute('aria-pressed',lineOnly);render();});
  function reset(){if(qEl)qEl.value='';maresOnly=false;lineOnly=false;
    if(maresBtn)maresBtn.setAttribute('aria-pressed',false);
    if(lineBtn)lineBtn.setAttribute('aria-pressed',false);}
  var ex=document.getElementById('expand'), co=document.getElementById('collapse');
  if(ex) ex.addEventListener('click',function(){collapsed={};reset();render();});
  if(co) co.addEventListener('click',function(){collapsed={};
    rows.forEach(function(r){if(r.depth>=1)collapsed[r.id]=true;});reset();render();});
  render();
}
})();
