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
  let elapsed=0,runningSince=null,deadline=0;
  media.src=url;layer.append(media,veil);document.body.prepend(layer);
  const position=()=>elapsed+(runningSince===null?0:(performance.now()-runningSince)/1000);
  function visibility(){
    clearTimeout(deadline);deadline=0;
    if(disposed||finished)return;
    if(!motion||!active){media.pause();return;}
    const seconds=position(),duration=media.duration;
    if(Number.isFinite(duration)&&duration>0){
      if(seconds>=duration){finish('ended');return;}
      // A hidden renderer may suspend native media or delay its ended event.
      // Keep the one-shot deadline independent of decoding and frame delivery.
      deadline=setTimeout(()=>finish('ended'),Math.ceil((duration-seconds)*1000));
    }
    if(media.readyState>=1&&Math.abs(media.currentTime-seconds)>.3)media.currentTime=seconds;
    if(media.paused)media.play().catch(reason=>{
      // Opening settings may interrupt a pending play().
      if(disposed||reason.name==='AbortError')return;
      error=reason.message;finish('error');
    });
  }
  function setActive(value=true,initialElapsed=0){
    if(disposed||finished)return;
    elapsed=position();runningSince=null;
    active=Boolean(value);
    if(active&&!started){elapsed=Number.isFinite(initialElapsed)?Math.max(0,initialElapsed):0;media.currentTime=0;started=true;}
    if(active&&motion)runningSince=performance.now();
    visibility();
  }
  function finish(reason){if(disposed||finished)return;elapsed=position();runningSince=null;finished=true;active=false;clearTimeout(deadline);deadline=0;media.pause();onFinish(reason);}
  function failed(){error=media.error?.message||'Video decode failed';finish('error');}
  function ended(){finish('ended');}
  document.addEventListener('visibilitychange',visibility);media.addEventListener('loadedmetadata',visibility);media.addEventListener('loadeddata',visibility);media.addEventListener('error',failed);media.addEventListener('ended',ended);setActive(autoplay);
  return {
    setActive,
    fadeOut(milliseconds=1800){if(disposed)return;layer.style.transition=`opacity ${milliseconds}ms ease`;layer.style.opacity='0';},
    status:()=>({active:!disposed&&!finished&&media.readyState>=2&&!media.error,configured:true,kind:'video',started,finished,paused:media.paused,currentTime:media.currentTime,playbackTime:position(),duration:Number.isFinite(media.duration)?media.duration:null,width:media.videoWidth,height:media.videoHeight,error}),
    dispose(){if(disposed)return;elapsed=position();runningSince=null;disposed=true;clearTimeout(deadline);deadline=0;media.pause();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('loadedmetadata',visibility);media.removeEventListener('loadeddata',visibility);media.removeEventListener('error',failed);media.removeEventListener('ended',ended);media.removeAttribute('src');media.load();layer.remove();URL.revokeObjectURL(url);}
  };
}
