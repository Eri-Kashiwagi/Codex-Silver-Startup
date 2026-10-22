// The workspace has its own real video, independent of the startup illustration.
export function createVideoWallpaper({video,strength,motion=true,autoplay=true,onFinish=()=>{}}) {
  const mediaType=Object.prototype.toString.call(video);
  if(!['[object Blob]','[object File]'].includes(mediaType))return {dispose(){},status:()=>({active:false,kind:'video',configured:false})};
  const layer=document.createElement('div');layer.id='codex-silver-live-wallpaper';layer.ariaHidden='true';
  Object.assign(layer.style,{position:'fixed',inset:'0',zIndex:'0',pointerEvents:'none',overflow:'hidden',background:'#180f2a'});
  const media=document.createElement('video');
  Object.assign(media.style,{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'});
  media.muted=true;media.defaultMuted=true;media.loop=false;media.playsInline=true;media.preload='auto';
  const veil=document.createElement('div');Object.assign(veil.style,{position:'absolute',inset:'0',background:`rgba(24,15,42,${1-strength/100})`});
  const url=URL.createObjectURL(video);let disposed=false,error=null,active=false,started=false,finished=false;
  media.src=url;layer.append(media,veil);document.body.prepend(layer);
  function visibility(){
    if(disposed)return;
    if(document.hidden||!motion||!active||finished)media.pause();else media.play().catch(reason=>{
      // Hiding the window or opening settings may interrupt a pending play().
      if(disposed||reason.name==='AbortError')return;
      error=reason.message;finish('error');
    });
  }
  function setActive(value=true){
    if(disposed||finished)return;
    active=Boolean(value);
    if(active&&!started){media.currentTime=0;started=true;}
    visibility();
  }
  function finish(reason){if(disposed||finished)return;finished=true;active=false;media.pause();onFinish(reason);}
  function failed(){error=media.error?.message||'Video decode failed';finish('error');}
  function ended(){finish('ended');}
  document.addEventListener('visibilitychange',visibility);media.addEventListener('loadeddata',visibility);media.addEventListener('error',failed);media.addEventListener('ended',ended);setActive(autoplay);
  return {
    setActive,
    fadeOut(milliseconds=1800){if(disposed)return;layer.style.transition=`opacity ${milliseconds}ms ease`;layer.style.opacity='0';},
    status:()=>({active:!disposed&&!finished&&media.readyState>=2&&!media.error,configured:true,kind:'video',started,finished,paused:media.paused,currentTime:media.currentTime,duration:Number.isFinite(media.duration)?media.duration:null,width:media.videoWidth,height:media.videoHeight,error}),
    dispose(){if(disposed)return;disposed=true;media.pause();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('loadeddata',visibility);media.removeEventListener('error',failed);media.removeEventListener('ended',ended);media.removeAttribute('src');media.load();layer.remove();URL.revokeObjectURL(url);}
  };
}
