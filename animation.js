(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const i18n=window.SilverI18n,t=(key,values)=>i18n.t(key,values);
  i18n.apply(document);
  const duration = 12000;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const native = !window.AEMEATH_EXTERNAL && Boolean(window.webkit?.messageHandlers?.launcher);
  const embedded = window.parent!==window && (window.AEMEATH_EXTERNAL || new URLSearchParams(location.search).has('embedded'));
  const assets=window.AEMEATH_ASSETS||{artwork:'assets/artwork.jpg',avatar:'assets/avatar.jpg'};
  if(embedded)document.body.classList.add('embedded');
  const root = $('.window'), art = $('.artwork'), scene = $('.scene');
  const hud = $('.hud'), intro = $('.intro'), sweep = $('.light-sweep');
  const slider = $('#timeline'), pause = $('#pause'), subtitle = $('.subtitle');
  slider.max=String(duration/1000);
  let playing = false, elapsed = 0, origin = 0, frame = 0, lastUI = -Infinity;
  let completed = false, hiddenPause = false, mode = 'preview', loaded = false, revealed = false;
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const t = clamp(n); return t*t*(3-2*t); };
  const send = (action, details={}) => {
    if(native)window.webkit.messageHandlers.launcher.postMessage(action);
    if(embedded){const data={type:'aemeath-boot',action,...details};if(window.AEMEATH_EXTERNAL)window.AEMEATH_SEND(data);else window.parent.postMessage(data,'*');}
  };
  const particles = Array.from({length: reduced ? 0 : 14}, (_, i) => {
    const node = document.createElement('i'); node.className = 'particle';
    const size = i % 4 === 0 ? 3 : 1.5;
    Object.assign(node.style, {width:`${size}px`,height:`${size}px`,left:`${(i*37+7)%100}%`,top:`${(i*23+17)%100}%`});
    $('.particles').appendChild(node); return node;
  });
  const milestones = [[0,0],[.12,.06],[.35,.41],[.56,.76],[.66,.924],[.72,.97],[.77,1],[1,1]];
  function progress(t) {
    const p = t / duration;
    for (let i=1;i<milestones.length;i++) {
      if (p <= milestones[i][0]) {
        const [a,x] = milestones[i-1], [b,y] = milestones[i];
        return x+(y-x)*smooth((p-a)/(b-a));
      }
    }
    return 1;
  }
  // Split the selected image's own contours once; no particles are allocated per frame.
  const canvas = $('.line-art'), ctx = canvas.getContext('2d');
  const artWidth=canvas.width,artHeight=canvas.height;
  function preparePaths(raw) { return raw.map(points => {
    let total=0;
    for(let i=1;i<points.length;i++)total+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    const full=new Path2D();points.forEach((point,i)=>i?full.lineTo(...point):full.moveTo(...point));
    return {points,total,full};
  }); }
  function prepareFragments(paths){
    const result=[],span=Math.max(18,paths.reduce((sum,path)=>sum+path.total,0)/1400);
    const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
    function add(points){
      if(points.length<2)return;
      const first=points[0],last=points[points.length-1],x=(first[0]+last[0])/2,y=(first[1]+last[1])/2;
      const seed=result.length+1;
      result.push({x,y,points:points.map(point=>[point[0]-x,point[1]-y]),
        sx:(x+(noise(seed)-.5)*440+artWidth)%artWidth,sy:(y+(noise(seed+271)-.5)*300+artHeight)%artHeight,
        angle:(noise(seed+563)-.5)*Math.PI*2,seed:noise(seed+811)*Math.PI*2});
    }
    for(const path of paths){
      if(path.points.length<2)continue;
      let chunk=[path.points[0]],used=0;
      for(let i=1;i<path.points.length;i++){
        let a=path.points[i-1];const b=path.points[i];
        let length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        while(length>0&&used+length>=span){
          const ratio=(span-used)/length,cut=[a[0]+(b[0]-a[0])*ratio,a[1]+(b[1]-a[1])*ratio];
          chunk.push(cut);add(chunk);chunk=[cut];a=cut;used=0;
          length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        }
        if(length>0){chunk.push(b);used+=length;}
      }
      add(chunk);
    }
    return result;
  }
  let paths=preparePaths(window.CONTOUR_PATHS || []),fragments=prepareFragments(paths);
  let identityTexture=null,identityPieces=[];
  function releaseIdentityTexture(){
    if(identityTexture)identityTexture.width=identityTexture.height=0;
    identityTexture=null;identityPieces=[];
  }
  function prepareIdentityTexture(){
    releaseIdentityTexture();
    const bounds=canvas.getBoundingClientRect(),scale=Math.max(bounds.width/artWidth,bounds.height/artHeight);
    if(!scale)return;
    const ox=bounds.left+(bounds.width-artWidth*scale)/2,oy=bounds.top+(bounds.height-artHeight*scale)/2;
    const rect=node=>{const r=node.getBoundingClientRect();return {x:(r.left-ox)/scale,y:(r.top-oy)/scale,w:r.width/scale,h:r.height/scale};};
    const texture=document.createElement('canvas');texture.width=artWidth;texture.height=artHeight;
    const ink=texture.getContext('2d');ink.imageSmoothingEnabled=false;
    const avatar=rect($('.avatar')),radar=rect($('.radar')),border=rect($('.avatar-frame'));
    const cx=radar.x+radar.w/2,cy=radar.y+radar.h/2;
    ink.strokeStyle='#a8d8f5';ink.lineWidth=1.3;
    ink.beginPath();ink.arc(cx,cy,radar.w*.4425,0,Math.PI*2);ink.stroke();
    ink.setLineDash([9,12]);ink.globalAlpha=.4;
    ink.beginPath();ink.arc(cx,cy,radar.w*.3775,0,Math.PI*2);ink.stroke();ink.setLineDash([]);ink.globalAlpha=.8;
    for(let i=0;i<60;i++){
      const a=i*Math.PI/30,r0=radar.w*(i%5===0?.4525:.46),r1=radar.w*(i%5===0?.4975:.48);
      ink.beginPath();ink.moveTo(cx+Math.sin(a)*r0,cy-Math.cos(a)*r0);ink.lineTo(cx+Math.sin(a)*r1,cy-Math.cos(a)*r1);ink.stroke();
    }
    ink.globalAlpha=1;ink.strokeRect(border.x,border.y,border.w,border.h);
    ink.drawImage($('.avatar'),avatar.x,avatar.y,avatar.w,avatar.h);
    // Neutralize the bitmap once, not with an expensive live blur/filter on every frame.
    ink.globalCompositeOperation='saturation';ink.fillStyle='#999';
    ink.fillRect(avatar.x,avatar.y,avatar.w,avatar.h);ink.globalCompositeOperation='source-over';
    const textBounds=[];
    for(const selector of ['.boot-title','.boot-caption']){
      const node=$(selector),r=rect(node),style=window.getComputedStyle(node);
      if(node.textContent)textBounds.push(r);
      ink.font=`${style.fontWeight} ${parseFloat(style.fontSize)/scale}px ${style.fontFamily}`;
      ink.textAlign='center';ink.textBaseline='middle';ink.fillStyle=style.color;
      ink.globalAlpha=selector==='.boot-caption'?.5:1;
      ink.letterSpacing=`${(parseFloat(style.letterSpacing)||0)/scale}px`;
      ink.fillText(node.textContent,r.x+r.w/2,r.y+r.h/2,r.w);
    }
    ink.globalAlpha=1;
    ink.globalCompositeOperation='source-atop';ink.globalAlpha=.32;ink.fillStyle='#b5ddf5';
    ink.fillRect(0,0,artWidth,artHeight);ink.globalAlpha=1;ink.globalCompositeOperation='source-over';
    // Geometric tile selection works for file:// images too, without reading protected pixels.
    const tile=36,boxes=[avatar,border,...textBounds];
    const overlaps=(x,y,r)=>x<r.x+r.w&&x+tile>r.x&&y<r.y+r.h&&y+tile>r.y;
    for(let y=0;y<artHeight;y+=tile)for(let x=0;x<artWidth;x+=tile){
      const w=Math.min(tile,artWidth-x),h=Math.min(tile,artHeight-y);
      const distance=Math.hypot(x+w/2-cx,y+h/2-cy);
      const onRing=[.3775,.4425,.48].some(radius=>Math.abs(distance-radar.w*radius)<tile);
      if(onRing||boxes.some(box=>overlaps(x,y,box)))identityPieces.push({x,y,w,h,target:fragments[(identityPieces.length*37)%fragments.length]});
    }
    identityTexture=texture;
    canvas.dataset.identityPieces=String(identityPieces.length);
    fragments.forEach((fragment,i)=>{
      const tile=identityPieces[i%identityPieces.length];
      fragment.ix=tile?tile.x+tile.w/2:cx;fragment.iy=tile?tile.y+tile.h/2:cy;
    });
    for(const tile of identityPieces){tile.target.ix=tile.x+tile.w/2;tile.target.iy=tile.y+tile.h/2;}
  }
  function drawIdentityPieces(spread){
    if(!identityTexture||spread>=1)return;
    const fade=1-smooth((spread-.03)/.43),size=1-.9*spread;
    if(fade<=0)return;
    ctx.globalAlpha=fade;ctx.imageSmoothingEnabled=false;
    for(const tile of identityPieces){
      const target=tile.target;
      const x=(tile.x+tile.w/2)*(1-spread)+target.sx*spread,y=(tile.y+tile.h/2)*(1-spread)+target.sy*spread;
      const angle=target.angle*spread,cs=Math.cos(angle)*size,sn=Math.sin(angle)*size;
      ctx.setTransform(cs,sn,-sn,cs,x,y);
      ctx.drawImage(identityTexture,tile.x,tile.y,tile.w,tile.h,-tile.w/2,-tile.h/2,tile.w,tile.h);
    }
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
  }
  let lastTrace=-1;
  function trace(p,drift=0,spread=1) {
    const stamp=p===1?1:p+drift*.00001;
    if(stamp===lastTrace)return;lastTrace=stamp;
    ctx.clearRect(0,0,artWidth,artHeight);
    ctx.strokeStyle='#b5ddf5';ctx.lineWidth=1.25;ctx.lineCap='round';ctx.lineJoin='round';
    if(p===1){
      ctx.globalAlpha=1;paths.forEach(path=>ctx.stroke(path.full));
    }else{
      drawIdentityPieces(spread);
      if(spread>.04){
      ctx.globalAlpha=.82*smooth((spread-.04)/.36);ctx.beginPath();
      // Arrival time follows target X, so the left edge resolves before the face and right edge.
      const front=p*1.5-.25;
      for(const fragment of fragments){
        const arrival=smooth((front-fragment.x/artWidth+.16)/.32),loose=1-arrival;
        const angle=fragment.angle*loose,cs=Math.cos(angle),sn=Math.sin(angle);
        const sx=(fragment.ix??fragment.sx)*(1-spread)+fragment.sx*spread;
        const sy=(fragment.iy??fragment.sy)*(1-spread)+fragment.sy*spread;
        const x=sx*loose+fragment.x*arrival+Math.sin(drift*.8+fragment.seed)*7*loose*spread;
        const y=sy*loose+fragment.y*arrival+Math.cos(drift*.6+fragment.seed)*7*loose*spread;
        const size=.16+.84*arrival;
        fragment.points.forEach((point,i)=>{
          const px=x+(point[0]*cs-point[1]*sn)*size,py=y+(point[0]*sn+point[1]*cs)*size;
          if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
        });
      }
      ctx.stroke();ctx.globalAlpha=1;
      }
    }
    canvas.dataset.progress=p.toFixed(3);canvas.dataset.fragments=String(fragments.length);
  }
  for(let i=0;i<60;i++){
    const tick=document.createElementNS('http://www.w3.org/2000/svg','line');
    const angle=i*Math.PI/30,inner=i%5===0?181:184;
    tick.setAttribute('x1',200+Math.sin(angle)*inner);tick.setAttribute('y1',200-Math.cos(angle)*inner);
    tick.setAttribute('x2',200+Math.sin(angle)*(i%5===0?199:192));tick.setAttribute('y2',200-Math.cos(angle)*(i%5===0?199:192));
    tick.style.opacity=i%5===0?'.9':'.55';$('.ticks').appendChild(tick);
  }
  function render(t) {
    const s=t/1000, p=progress(t), color=smooth((s-7.18)/.24), collapse=smooth((s-11)/.3), pinch=smooth((s-11.65)/.35);
    const dissolve=smooth((s-4.18)/.56);
    const closing=s>=11;
    root.classList.toggle('closing',closing);document.body.classList.toggle('closing',closing);
    scene.style.opacity=collapse>=1?'0':'1';
    scene.style.transform=`scaleY(${Math.max(.001,1-collapse)})`;
    scene.style.filter=closing?`brightness(${1+collapse*3})`:'none';
    $('.transition-flash').style.opacity=String(reduced?0:smooth((s-7.18)/.035)*(1-smooth((s-7.22)/.2))*.8);
    const line=$('.shutter-line');
    line.style.opacity=String(smooth((s-11.15)/.15)*(1-smooth((s-11.96)/.04)));
    line.style.transform=`scaleX(${1-pinch})`;
    if(closing&&!revealed){revealed=true;send('reveal');}

    intro.style.opacity=String(reduced?1-smooth((s-4.18)/.56):s<4.18?1:0);
    $('.identity').style.opacity=String(smooth((s-1.05)/.65));
    $('.identity').style.transform=`translate(-50%,-43%) scale(${.94+.06*smooth((s-1.05)/.65)})`;
    const beat=reduced?0:Math.pow((1-Math.cos(Math.max(0,s-1.05)*Math.PI*2/1.08))/2,2);
    $('.avatar-frame').style.transform=`translateY(${-4*beat}px) scale(${1+.025*beat})`;
    $('.pulse').style.opacity=String(1-smooth((s-1.15)/.5));
    document.querySelectorAll('.pulse i').forEach((ring,i)=>{
      const phase=(s*.75+i*.5)%1;
      ring.style.transform=`scale(${.25+phase*.9})`;ring.style.opacity=String((1-phase)*.8);
    });
    $('.dashed').style.transformOrigin='200px 200px';$('.dashed').style.transform=`rotate(${reduced?0:s*16}deg)`;
    $('.boot-title').style.clipPath=`inset(0 ${(1-clamp((s-1.9)/.7))*100}% 0 0)`;
    $('.boot-caption').style.opacity=String(smooth((s-2.5)/.35)*.5);
    $('.wave').style.transform=`scaleY(${reduced?1:.6+Math.sin(s*6)*.4})`;
    $('.boot-grid').style.opacity=String(smooth((s-.8)/.6)*(1-color));
    $('.boot-corners').style.opacity=String(smooth((s-.8)/.6)*(1-color));
    $('.boot-logs').style.opacity=String((1-color)*.55);
    document.querySelectorAll('.boot-logs div').forEach((line,i)=>line.style.opacity=String(smooth((s-.15-i*.38)/.3)));
    const assembling=clamp((s-5.08)/2.02);
    if(s>=4.18&&s<7.43)trace(reduced?1:assembling,s-4.18,reduced?1:dissolve);
    if(s>=4.74&&identityTexture)releaseIdentityTexture();
    canvas.style.opacity=String((reduced?smooth((s-4.18)/.56):s>=4.18?1:0)*(1-color));
    canvas.dataset.dissolve=dissolve.toFixed(3);
    art.style.opacity=String(color);
    // The art stays registered to the contours until the color transition finishes.
    art.style.transform=reduced?'none':`scale(${1+.012*smooth((s-7.42)/3.58)})`;
    $('.shade').style.opacity=String(color);
    hud.style.opacity=String(smooth((s-7.24)/.45));
    $('.portrait-title').style.opacity=String(smooth((s-7.24)/.45));
    $('.sync-fill').style.transform=`scaleX(${p})`;
    sweep.style.opacity=reduced?'0':String(Math.sin(clamp((s-7.18)/.8)*Math.PI)*.1);
    sweep.style.transform=`translateX(${(-60+clamp((s-7.18)/.8)*120)}%)`;
    particles.forEach((node,i)=>{
      node.style.opacity=String(color*(.12+.28*(.5+.5*Math.sin(s*.9+i))));
      node.style.transform=`translate(${Math.sin(s*.4+i)*8}px,${-s*(2+i%3)}px)`;
    });
    subtitle.style.opacity=String(smooth((s-7.6)/.4)*(1-smooth((s-10.65)/.25)));
    if(Math.abs(t-lastUI)>60 || t===0 || t>=duration) {
      lastUI=t;
      $('#ratio').textContent=`${(p*100).toFixed(2).padStart(5,'0')}%`;
      $('.sync-phase').textContent=s<6.5?'INITIALIZING':p<1?'SYNCHRONIZING':'SYNC COMPLETE';
      $('#timecode').textContent=`00:${String(Math.floor(s)).padStart(2,'0')}:${String(Math.floor(s%1*30)).padStart(2,'0')}`;
      slider.value=String(s);
      $('#elapsed').innerHTML=`${s.toFixed(1).padStart(4,'0')} <span>/ 12.0s</span>`;
      root.dataset.elapsed=s.toFixed(2);
      root.dataset.stage=s>=11?'shutter':s<1.15?'pulse':s<4.18?'identity':s<4.74?'dispersing':s<5.08?'scattered':s<7.18?'drawing':s<7.43?'colorize':'portrait';
    }
  }
  function updateButton() { pause.textContent=t(completed?'ended':playing?'pause':'resume'); root.dataset.playing=String(playing); }
  function stop() { playing=false; cancelAnimationFrame(frame); frame=0; updateButton(); }
  function finish(skipped=false) {
    stop(); elapsed=duration; render(elapsed); completed=true;
    root.classList.add('finished'); root.dataset.completed='true';
    pause.textContent=t('ended'); pause.disabled=true;
    $('.end-description').dataset.i18n=mode==='launch'?'showingCodex':skipped?'skipped':'previewFinished';
    $('.end-description').textContent=t($('.end-description').dataset.i18n);
    send('complete');
  }
  function tick(now) {
    if(!playing)return;
    elapsed=Math.min(duration,now-origin); render(elapsed);
    if(elapsed>=duration){finish();return;}
    frame=requestAnimationFrame(tick);
  }
  function warmIdentityTexture(){
    if(reduced||identityTexture||elapsed>=4740)return;
    const restoreTime=elapsed;
    // Prepare the final avatar layout before starting the playback clock, never in tick().
    render(4179);prepareIdentityTexture();drawIdentityPieces(0);
    ctx.clearRect(0,0,artWidth,artHeight);lastTrace=-1;render(restoreTime);
  }
  function play() {
    if(!loaded)return;
    if(elapsed>=duration)elapsed=0;
    warmIdentityTexture();
    completed=false; root.classList.remove('finished'); root.dataset.completed='false';
    pause.disabled=false; origin=performance.now()-elapsed; playing=true;updateButton();
    cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);
  }
  function replay(){revealed=false;hiddenPause=false;stop();elapsed=0;lastUI=-Infinity;render(0);play();}
  $('#replay').addEventListener('click',replay);$('.replay-end').addEventListener('click',replay);
  pause.addEventListener('click',()=>{hiddenPause=false;if(playing){elapsed=Math.min(duration,performance.now()-origin);stop();render(elapsed);}else play();});
  $('.skip').addEventListener('click',()=>finish(true));
  slider.addEventListener('input',()=>{hiddenPause=false;stop();elapsed=Number(slider.value)*1000;warmIdentityTexture();if(elapsed>=duration){finish();return;}lastUI=-Infinity;completed=false;root.classList.remove('finished');root.dataset.completed='false';pause.disabled=false;render(elapsed);});
  window.addEventListener('keydown',event=>{
    if((event.metaKey||event.ctrlKey)&&event.altKey&&event.code==='KeyB'){
      event.preventDefault();if(!$('#settings-dialog').open)openSettings();return;
    }
    if($('#settings-dialog').open)return;
    if(event.key==='Escape'){event.preventDefault();finish(true);}
    if(event.code==='Space'&&event.target.tagName!=='INPUT'&&event.target.tagName!=='BUTTON'){event.preventDefault();pause.click();}
  });
  document.addEventListener('visibilitychange',()=>{
    if(native)return;
    if(document.hidden&&playing){elapsed=Math.min(duration,performance.now()-origin);hiddenPause=true;stop();}
    else if(!document.hidden&&hiddenPause&&!completed){hiddenPause=false;play();}
  });
  // Narrow native bridge: the host may select launch mode or report its own launch error.
  window.launcherUI={
    openSettings,
    beginLaunch(){mode='launch';document.body.classList.add('launch-mode');replay();},
    error(message){stop();scene.style.opacity='0';root.classList.add('finished');delete $('.end-description').dataset.i18n;$('.end-description').textContent=message;$('.eyebrow').textContent='LAUNCH UNAVAILABLE';$('.end-screen h1').dataset.i18n='launchUnavailable';$('.end-screen h1').textContent=t('launchUnavailable');},
    waiting(){ $('.end-description').dataset.i18n='waiting';$('.end-description').textContent=t('waiting'); }
  };
  if(native){
    document.body.classList.add('native');
  }
  function ready(){if(loaded)return;loaded=true;render(0);send('ready');if(window.AEMEATH_OPEN_SETTINGS||new URLSearchParams(location.search).has('settings'))openSettings();else play();}
  function failed(){stop();$('#asset-error').hidden=false;send('assetError');}
  let savedImages={},pendingImages={},busy=false;
  const settings=$('#settings-dialog'),status=$('#settings-status');
  const textFields=[
    {key:'introTitle',input:'#intro-title',target:'.boot-title',fallback:'defaultTitle',limit:16},
    {key:'introCaption',input:'#intro-caption',target:'.boot-caption',fallback:'defaultCaption',limit:48},
    {key:'artworkSubtitle',input:'#artwork-subtitle',target:'#subtitle',fallback:'defaultSubtitle',limit:60}
  ];
  const textValue=(images,field)=>typeof images[field.key]==='string'?images[field.key].slice(0,field.limit):t(field.fallback);
  function applyLanguage(images){
    i18n.setLocale(images.language);i18n.apply(document);updateButton();
    if(window.frameElement)window.frameElement.title=t('windowLabel');
    $('#language-select').value=i18n.locale;
  }
  function thumbnails(){
    $('#avatar-preview').src=pendingImages.avatar||assets.avatar;
    $('#artwork-preview').src=pendingImages.artwork||assets.artwork;
    $('#wallpaper-strength').value=String(pendingImages.wallpaperStrength??56);
    $('#wallpaper-motion').checked=pendingImages.wallpaperMotion!==false;
    $('#wallpaper-video-name').textContent=pendingImages.backgroundVideoName||t('noPersonalVideo');
    $('#wallpaper-value').textContent=$('#wallpaper-strength').value+'%';
    for(const field of textFields)$(field.input).value=textValue(pendingImages,field);
  }
  function openSettings(){
    if(mode==='launch'||settings.open)return;
    hiddenPause=false;stop();pendingImages={...savedImages};applyLanguage(pendingImages);thumbnails();
    status.textContent=t('editing');
    settings.returnValue='';settings.showModal();send('settings-open');
  }
  function setBusy(value){
    busy=value;
    settings.querySelectorAll('input,button,select').forEach(node=>node.disabled=value);
  }
  async function applyImages(images){
    releaseIdentityTexture();
    art.src=images.artwork||assets.artwork;$('.avatar').src=images.avatar||assets.avatar;
    await Promise.all([art,$('.avatar')].map(img=>img.decode()));
    paths=preparePaths(images.contours||window.CONTOUR_PATHS||[]);fragments=prepareFragments(paths);lastTrace=-1;
    if(!paths.length)throw new Error(t('contoursMissing'));
    for(const field of textFields)$(field.target).textContent=textValue(images,field);
    $('.boot-title').classList.toggle('long-title',Array.from(textValue(images,textFields[0])).length>6);
    send('background',{image:assets.wallpaper||art.src,video:images.backgroundVideo||null,strength:images.wallpaperStrength??56,motion:images.wallpaperMotion!==false});
  }
  for(const field of textFields)$(field.input).addEventListener('input',event=>{
    pendingImages[field.key]=event.target.value.slice(0,field.limit);
  });
  $('#language-select').addEventListener('change',event=>{
    pendingImages.language=event.target.value;applyLanguage(pendingImages);thumbnails();status.textContent=t('editing');
  });
  $('#wallpaper-strength').addEventListener('input',event=>{
    pendingImages.wallpaperStrength=Number(event.target.value);
    $('#wallpaper-value').textContent=event.target.value+'%';
  });
  $('#wallpaper-motion').addEventListener('change',event=>{pendingImages.wallpaperMotion=event.target.checked;});
  $('#wallpaper-video').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    setBusy(true);status.textContent=t('checkingVideo');
    try{pendingImages={...pendingImages,...await window.imageSettings.importVideo(file)};thumbnails();status.textContent=t('videoReady');}
    catch(error){status.textContent=error.message;}
    finally{setBusy(false);event.target.value='';}
  });
  $('#clear-wallpaper-video').addEventListener('click',()=>{delete pendingImages.backgroundVideo;delete pendingImages.backgroundVideoName;thumbnails();});
  $('#image-settings').addEventListener('click',openSettings);
  if(window.AEMEATH_EXTERNAL){$('#restore-appearance').hidden=false;$('#restore-appearance').addEventListener('click',()=>send('restore'));}
  settings.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  settings.addEventListener('close',()=>{
    if(!loaded)return;
    applyLanguage(savedImages);
    if(settings.returnValue==='preview'){send('settings-close');replay();}
    else finish(true);
  });
  for(const kind of ['avatar','artwork'])$('#'+kind+'-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    setBusy(true);status.textContent=t(kind==='artwork'?'tracing':'preparingAvatar');
    // Let the progress text paint before the one-time contour computation.
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    try{
      pendingImages={...pendingImages,...await window.imageSettings.importImage(file,kind)};thumbnails();
      status.textContent=t('imageReady');
    }catch(error){status.textContent=error.message;}
    finally{setBusy(false);event.target.value='';}
  });
  $('#reset-images').addEventListener('click',()=>{pendingImages={language:i18n.locale};thumbnails();status.textContent=t('resetReady');});
  $('#preview-images').addEventListener('click',async()=>{
    setBusy(true);status.textContent=t('saving');
    try{
      await applyImages(pendingImages);await window.imageSettings.save(pendingImages);savedImages={...pendingImages};settings.close('preview');
    }catch(error){await applyImages(savedImages);status.textContent=t('saveFailed',{error:error.message});}
    finally{setBusy(false);}
  });
  window.imageSettings.load().catch(()=>({})).then(async images=>{
    savedImages=images;
    applyLanguage(images);
    try{await applyImages(images);}catch{savedImages={language:i18n.locale};await applyImages(savedImages);}
    ready();
  }).catch(failed);
})();
