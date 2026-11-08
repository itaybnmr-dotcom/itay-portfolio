// Record Day vibe comps v2 – rebuilds the two Claude comps by cloning the project's own text layers (keeps exact font/style).
(function () { try {
  app.beginUndoGroup("Record Day vibe comps v2");
  var P = app.project, i, j;
  // remove v1 comps + folder
  for (i=P.numItems;i>=1;i--){ var it=P.item(i);
    if ((it instanceof CompItem && it.name.indexOf("יום התקליט –")===0) || (it instanceof FolderItem && it.name=="Claude – vibe comps")) { try{ it.remove(); }catch(e){} } }

  var src=null;
  for (i=1;i<=P.numItems;i++){ var it=P.item(i); if (it instanceof CompItem && it.name.indexOf("כרזת אוטובוס יום התקליט")>=0){ src=it; break; } }
  var nark=null, sec=null;
  function scan(comp){
    for (var j=1;j<=comp.numLayers;j++){ var L=comp.layer(j);
      if (L instanceof TextLayer){ var f=""; try{ f=L.property("Source Text").value.font; }catch(e){}
        if (!nark && /narkis/i.test(f)) nark=L; if (!sec && /secolo/i.test(f)) sec=L; }
      else if (L.source instanceof CompItem && (!nark||!sec)) scan(L.source);
    } }
  if (src) scan(src);
  for (i=1;i<=P.numItems && (!nark||!sec);i++){ var it=P.item(i); if (it instanceof CompItem) scan(it); }
  if (!nark || !sec) { alert("Could not find Narkiss/Secolo layers. nark="+(nark?nark.name:"-")+" sec="+(sec?sec.name:"-")); return; }

  var GREEN=[0.1176,0.2902,0.2196], WHITE=[1,1,1];
  var W=src?src.width:1080, H=src?src.height:1920, FPS=12, DUR=10;
  var folder=P.items.addFolder("Claude – vibe comps");

  function clean(L){
    var tr=L.property("ADBE Transform Group");
    for (var k=1;k<=tr.numProperties;k++){ var pr=tr.property(k); try{ pr.expression=""; while(pr.numKeys>0) pr.removeKey(1);}catch(e){} }
    try{ var st=L.property("Source Text"); st.expression=""; while(st.numKeys>0) st.removeKey(1);}catch(e){}
    try{ var an=L.property("ADBE Text Properties").property("ADBE Text Animators"); for (var a=an.numProperties;a>=1;a--) an.property(a).remove(); }catch(e){}
    try{ var ms=L.property("ADBE Mask Parade"); for (var m=ms.numProperties;m>=1;m--) ms.property(m).remove(); }catch(e){}
    try{ var fx=L.property("ADBE Effect Parade"); for (var f=fx.numProperties;f>=1;f--) fx.property(f).remove(); }catch(e){}
    L.parent=null; L.inPoint=0; L.outPoint=DUR; L.startTime=0; L.inPoint=0; L.outPoint=DUR;
    try{ L.trackMatteType=TrackMatteType.NO_TRACK_MATTE; }catch(e){}
    L.enabled=true; L.opacity=100;
  }
  function clone(proto, comp, str, color, name){
    var before={}; for (var q=1;q<=comp.numLayers;q++) before[comp.layer(q).id]=1;
    proto.copyToComp(comp); var L=null;
    for (var q=1;q<=comp.numLayers;q++){ var c=comp.layer(q); if(!before[c.id] && c instanceof TextLayer){ L=c; } }
    for (var q=comp.numLayers;q>=1;q--){ var c=comp.layer(q); if(!before[c.id] && c!==L){ try{c.remove();}catch(e){} } }
    clean(L);
    var st=L.property("Source Text"), td=st.value; td.text=str;
    try{ td.applyFill=true; td.fillColor=color; td.applyStroke=false; }catch(e){}
    try{ td.justification=ParagraphJustification.CENTER_JUSTIFY; }catch(e){}
    st.setValue(td); L.name=name;
    L.property("ADBE Transform Group").property("ADBE Anchor Point").expression="var r=sourceRectAtTime(0,false);[r.left+r.width/2,r.top+r.height/2]";
    L.property("ADBE Transform Group").property("ADBE Rotate Z").setValue(0);
    return L;
  }
  function fitH(L, h){ var r=L.sourceRectAtTime(0,false); var s=100*h/r.height; L.property("ADBE Transform Group").property("ADBE Scale").setValue([s,s]); return r.width*s/100; }
  function texture(comp){ if(!src) return; for (var j=src.numLayers;j>=1;j--){ var L=src.layer(j); if (/texture|grain/i.test(L.name)||L.adjustmentLayer) L.copyToComp(comp); } }

  // ===== Comp 1 =====
  var c1=P.items.addComp("יום התקליט – שתי שורות (ירוק)",W,H,1,DUR,FPS); c1.parentFolder=folder;
  c1.layers.addSolid(GREEN,"BG ירוק",W,H,1,DUR);
  var capH=H*0.05, gap=W*0.04;
  var rows=[{y:H*0.45, order:["day","year"], ph:0},{y:H*0.55, order:["year","day"], ph:1}];
  for (var r=0;r<2;r++){
    var R=rows[r], Ls={}, ws={};
    Ls.day = clone(nark,c1,"יום התקליט",WHITE,"יום התקליט "+(r+1)); ws.day=fitH(Ls.day,capH);
    Ls.year= clone(sec ,c1,"2026",WHITE,"2026 שורה "+(r+1));          ws.year=fitH(Ls.year,capH);
    var total=ws.day+gap+ws.year, right=(W+total)/2;
    var first=R.order[0], second=R.order[1];  // first = rightmost (RTL)
    Ls[first].property("ADBE Transform Group").property("ADBE Position").setValue([right-ws[first]/2, R.y]);
    Ls[second].property("ADBE Transform Group").property("ADBE Position").setValue([right-ws[first]-gap-ws[second]/2, R.y]);
    // year goes out and back in through its own slot (mask stays, glyphs move)
    var Y=Ls.year, rc=Y.sourceRectAtTime(0,false), pad=rc.height*0.08;
    var m=Y.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), sh=new Shape();
    sh.vertices=[[rc.left-pad,rc.top-pad],[rc.left+rc.width+pad,rc.top-pad],[rc.left+rc.width+pad,rc.top+rc.height+pad],[rc.left-pad,rc.top+rc.height+pad]]; sh.closed=true;
    m.property("ADBE Mask Shape").setValue(sh);
    var an=Y.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
    var ap=an.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D");
    ap.expression="var h="+(rc.height*1.3)+", per=2, ph="+R.ph+";\nvar t=posterizeTime(12), u=((t+ph)%per)/per;\nvar o = u<0.25 ? -h*(u/0.25) : (u<0.5 ? h*(1-(u-0.25)/0.25) : 0);\n[0,o,0]";
  }
  texture(c1);

  // ===== Comp 2 =====
  var c2=P.items.addComp("יום התקליט – תנועת טיפוגרפיה (לבן)",W,H,1,DUR,FPS); c2.parentFolder=folder;
  c2.layers.addSolid(WHITE,"BG לבן",W,H,1,DUR);
  var lines=["יום התקליט","2026","10.04.26"];
  for (var k=0;k<3;k++){
    var T=clone(sec,c2,lines[k],GREEN,lines[k]); fitH(T,H*0.06);
    T.property("ADBE Transform Group").property("ADBE Position").expression=
      "var n=3,k="+k+",per=6,span=thisComp.height*1.3;\nvar t=posterizeTime(12),u=((t/per)+k/n)%1;\n[thisComp.width/2,-thisComp.height*0.15+u*span]";
  }
  texture(c2);
  for (j=1;j<=c2.numLayers;j++){ var Lq=c2.layer(j); if (/texture|grain/i.test(Lq.name)||Lq.adjustmentLayer) Lq.enabled=false; }

  app.endUndoGroup();
  c1.openInViewer();
  } catch(err){ alert("Error line "+err.line+": "+err.toString()); }
})();
