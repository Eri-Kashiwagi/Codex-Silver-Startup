// Runtime-only appearance layer. No writes to the installed application.
export function installRenderer(payload, mount, createMotion) {
  if(window.top!==window)return {installed:false,reason:'child-frame'};
  if(window.__aemeathExtension){if(payload.openSettings)window.__aemeathExtension.openSettings();return {installed:true,alreadyActive:true};}
  let frame=null,watchdog=0,observer=null,priorFocus=null,disposed=false;
  let ready=false,completed=false,phase='loading',wallpaperURL=null,lastImage=null,settingsRequested=false;
  let liveMotion=null,restoreTimer=0,videoStartedAt=null;
  let defaultVideo=null,defaultInput=null,lastBackground=null;
  const root=document.documentElement;
  const before=new Map(['--aemeath-wallpaper','--aemeath-wash'].map(key=>[key,[root.style.getPropertyValue(key),root.style.getPropertyPriority(key)]]));
  const originalAttribute=root.getAttribute('data-aemeath-skin');
  const originalRestoring=root.getAttribute('data-aemeath-restoring');
  const style=document.createElement('style');style.id='aemeath-extension-style';style.textContent=payload.skin;
  function removeOverlay(){
    clearTimeout(watchdog);observer?.disconnect();observer=null;
    frame?.remove();frame=null;
    if(priorFocus?.isConnected)priorFocus.focus();priorFocus=null;
  }
  function resetAppearance(){
    originalAttribute===null?root.removeAttribute('data-aemeath-skin'):root.setAttribute('data-aemeath-skin',originalAttribute);
    for(const [key,[value,priority]] of before)value?root.style.setProperty(key,value,priority):root.style.removeProperty(key);
  }
  function clearRestoration(){
    clearTimeout(restoreTimer);restoreTimer=0;
    originalRestoring===null?root.removeAttribute('data-aemeath-restoring'):root.setAttribute('data-aemeath-restoring',originalRestoring);
  }
  function restoreNative(reason){
    if(disposed)return;
    const milliseconds=reason==='ended'?1800:0;
    clearRestoration();
    if(milliseconds){
      root.setAttribute('data-aemeath-restoring','');
      // Commit the temporary transitions before returning the real app's tokens.
      root.getBoundingClientRect();
      liveMotion?.fadeOut?.(milliseconds);
    }
    resetAppearance();
    const release=()=>{clearRestoration();style.remove();liveMotion?.dispose();if(wallpaperURL)URL.revokeObjectURL(wallpaperURL);wallpaperURL=null;lastImage=null;};
    if(milliseconds)restoreTimer=setTimeout(release,milliseconds);else release();
  }
  function dispose(){
    if(disposed)return;disposed=true;clearRestoration();removeOverlay();style.remove();liveMotion?.dispose();liveMotion=null;defaultInput?.remove();defaultInput=null;defaultVideo=null;lastBackground=null;
    if(wallpaperURL)URL.revokeObjectURL(wallpaperURL);wallpaperURL=null;lastImage=null;
    resetAppearance();
    window.removeEventListener('message',message);window.removeEventListener('keydown',keyboard,true);
    delete window.__aemeathExtension;
  }
  function background(data){
    if(typeof data.image!=='string'||!/^data:image\/(png|jpeg|webp|gif);base64,/.test(data.image))return;
    clearRestoration();
    lastBackground=data;
    if(!style.isConnected)document.head.appendChild(style);
    const strength=Number.isFinite(data.strength)?Math.max(0,Math.min(75,data.strength)):42;
    // Large data URLs exceed CSS custom-property token limits in Chromium.
    // A short local Blob URL also avoids copying megabytes into each style value.
    if(strength>0&&data.image!==lastImage){
      const comma=data.image.indexOf(','),mime=data.image.slice(5,data.image.indexOf(';'));
      const binary=atob(data.image.slice(comma+1)),bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      const previous=wallpaperURL;wallpaperURL=URL.createObjectURL(new Blob([bytes],{type:mime}));lastImage=data.image;
      root.style.setProperty('--aemeath-wallpaper',`url(${JSON.stringify(wallpaperURL)})`);
      if(previous)URL.revokeObjectURL(previous);
    }
    if(strength===0){root.style.removeProperty('--aemeath-wallpaper');if(wallpaperURL)URL.revokeObjectURL(wallpaperURL);wallpaperURL=null;lastImage=null;}
    root.style.setProperty('--aemeath-wash',String(1-strength/100));
    root.toggleAttribute('data-aemeath-skin',strength>0);
    liveMotion?.dispose();liveMotion=null;
    if(typeof createMotion==='function'&&!defaultInput){
      defaultInput=document.createElement('input');defaultInput.type='file';defaultInput.accept='video/mp4,video/webm';defaultInput.hidden=true;defaultInput.id='codex-silver-default-video';
      defaultInput.addEventListener('change',()=>{const file=defaultInput.files[0];if(file&&file.size<=64*1024*1024&&['video/mp4','video/webm'].includes(file.type)){defaultVideo=file;if(lastBackground)background(lastBackground);}});
      document.body.appendChild(defaultInput);
    }
    if(strength>0&&typeof createMotion==='function'){
      liveMotion=createMotion({video:data.video||defaultVideo,strength,motion:data.motion!==false,autoplay:false,onFinish:restoreNative});
      if(completed&&!frame)liveMotion.setActive?.(true,Math.max(0,performance.now()-(videoStartedAt??performance.now()))/1000);
    }
  }
  function show(settings=false){
    if(disposed)return;
    if(frame){if(settings){settingsRequested=true;frame.contentWindow.AEMEATH_OPEN_SETTINGS=true;frame.contentWindow.launcherUI?.openSettings();}return;}
    settingsRequested=settings;
    liveMotion?.setActive?.(false);
    ready=false;completed=false;videoStartedAt=null;
    priorFocus=document.activeElement;phase=settings?'settings':'loading';
    frame=document.createElement('iframe');frame.id='aemeath-extension-overlay';frame.title='Startup animation';
    Object.assign(frame.style,{position:'fixed',inset:'0',width:'100%',height:'100%',border:'0',zIndex:'2147483646',background:'transparent',colorScheme:'dark'});
    const current=frame;
    current.addEventListener('load',()=>{
      if(frame!==current||disposed)return;
      try{
        const win=current.contentWindow,doc=win.document;
        // No inline script, eval, network server, or CSP change is needed.
        doc.documentElement.innerHTML=payload.html;
        const css=doc.createElement('style');css.textContent=payload.css;doc.head.appendChild(css);
        win.AEMEATH_EXTERNAL=true;win.AEMEATH_ASSETS=payload.assets;win.AEMEATH_OPEN_SETTINGS=settingsRequested;
        // The function is compiled in the parent realm. A closure-bound bridge
        // preserves frame identity without weakening postMessage source checks.
        win.AEMEATH_SEND=data=>message({source:win,data});
        mount(win);current.focus();
      }catch(error){phase='failed';console.error('Aemeath extension:',error.message);removeOverlay();}
    },{once:true});
    current.src='about:blank';document.body.appendChild(current);
    watchdog=setTimeout(()=>{phase='timeout';removeOverlay();},25000);
  }
  function message(event){
    if(!frame||event.source!==frame.contentWindow||event.data?.type!=='aemeath-boot')return;
    const data=event.data;
    if(data.action==='background')background(data);
    if(data.action==='ready'){ready=true;phase='playing';clearTimeout(watchdog);watchdog=0;}
    if(data.action==='complete'){
      completed=true;phase='complete';removeOverlay();
      const lateBy=Math.max(0,Number.isFinite(data.lateBy)?data.lateBy:0);
      videoStartedAt=performance.now()-lateBy;
      liveMotion?.setActive?.(true,lateBy/1000);
    }
    if(data.action==='assetError'){phase='failed';removeOverlay();}
    if(data.action==='settings-open'){phase='settings';clearTimeout(watchdog);}
    if(data.action==='settings-close'){phase='playing';clearTimeout(watchdog);watchdog=0;}
    if(data.action==='restore')dispose();
  }
  function keyboard(event){
    if((event.metaKey||event.ctrlKey)&&event.altKey&&event.code==='KeyB'){event.preventDefault();show(true);}
  }
  window.addEventListener('message',message);window.addEventListener('keydown',keyboard,true);
  window.__aemeathExtension={dispose,openSettings:()=>show(true),status:()=>({ready,completed,phase,overlay:!!frame,wallpaper:root.hasAttribute('data-aemeath-skin'),motion:liveMotion?.status(),imageBytes:root.style.getPropertyValue('--aemeath-wallpaper').length})};
  if(document.body)show(Boolean(payload.openSettings));
  else{observer=new MutationObserver(()=>{if(document.body){observer.disconnect();observer=null;show(Boolean(payload.openSettings));}});observer.observe(document,{childList:true,subtree:true});}
  return {installed:true};
}
