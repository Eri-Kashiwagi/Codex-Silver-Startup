import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createVideoWallpaper} from '../extension/video-wallpaper.mjs';
import {installRenderer} from '../extension/renderer.mjs';

function fixture(options={}){
  class Element extends EventTarget{
    constructor(){super();this.style={};this.paused=true;this.currentTime=8;this.readyState=2;this.duration=15;this.videoWidth=1280;this.videoHeight=720;this.plays=0;}
    append(){} remove(){this.removed=true;} removeAttribute(){} load(){}
    play(){this.paused=false;this.plays++;return Promise.resolve();}
    pause(){this.paused=true;}
  }
  const document=new EventTarget();document.hidden=false;document.body={prepend(){}};
  const elements=[];document.createElement=()=>{const el=new Element();elements.push(el);return el;};
  let revoked=0;const results=[];
  const create=vm.runInNewContext('('+createVideoWallpaper.toString()+')',{document,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){revoked++;}}});
  const controller=create({video:new Blob(['video']),strength:56,autoplay:false,onFinish:reason=>results.push(reason),...options});
  return {document,media:elements[1],layer:elements[0],controller,results,revoked:()=>revoked};
}
test('workspace video waits for startup, begins at zero, pauses hidden, and never loops',()=>{
  const {document,media,controller}=fixture();
  assert.equal(media.loop,false);assert.equal(media.paused,true);assert.equal(media.plays,0);
  controller.setActive(true);assert.equal(media.currentTime,0);assert.equal(media.plays,1);
  media.currentTime=4;document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(media.paused,true);
  document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));assert.equal(media.paused,false);assert.equal(media.currentTime,4);
  controller.setActive(false);assert.equal(media.paused,true);
  controller.setActive(true);assert.equal(media.currentTime,4);
  controller.dispose();
});
test('ended signals restoration once and cannot replay on visibility changes',()=>{
  const {document,media,layer,controller,results,revoked}=fixture();
  controller.setActive(true);media.dispatchEvent(new Event('ended'));media.dispatchEvent(new Event('ended'));
  assert.deepEqual(results,['ended']);assert.equal(controller.status().finished,true);
  const plays=media.plays;controller.setActive(true);document.dispatchEvent(new Event('visibilitychange'));assert.equal(media.plays,plays);
  controller.fadeOut(1800);assert.equal(layer.style.opacity,'0');assert.match(layer.style.transition,/1800ms/);
  controller.dispose();controller.dispose();assert.equal(revoked(),1);assert.equal(layer.removed,true);
});
test('decode failure restores native appearance and disposing removes all event activity',()=>{
  const {document,media,controller,results}=fixture();
  media.error={message:'bad video'};media.dispatchEvent(new Event('error'));assert.deepEqual(results,['error']);assert.equal(controller.status().error,'bad video');
  controller.dispose();document.dispatchEvent(new Event('visibilitychange'));media.dispatchEvent(new Event('ended'));assert.deepEqual(results,['error']);
});
test('motion-off setting keeps the media still',()=>{
  const {media,controller}=fixture({motion:false});controller.setActive(true);assert.equal(media.plays,0);assert.equal(media.paused,true);controller.dispose();
});
test('renderer releases workspace playback only after startup and restores original appearance after ended',()=>{
  const values=new Map([['--aemeath-wash','original-wash']]),attributes=new Map(),timers=new Map();
  const root={
    style:{getPropertyValue:key=>values.get(key)||'',getPropertyPriority:()=>'',setProperty:(key,value)=>values.set(key,value),removeProperty:key=>values.delete(key)},
    getAttribute:key=>attributes.get(key)??null,setAttribute:(key,value)=>attributes.set(key,value),removeAttribute:key=>attributes.delete(key),hasAttribute:key=>attributes.has(key),
    toggleAttribute:(key,value)=>value?attributes.set(key,''):attributes.delete(key),getBoundingClientRect:()=>({})
  };
  let iframe,style,options,disposed=0,nextTimer=0;const active=[],fades=[];
  const createMotion=opts=>{options=opts;return {setActive:value=>active.push(value),fadeOut:value=>fades.push(value),dispose:()=>disposed++,status:()=>({})};};
  const document={documentElement:root,activeElement:null,head:{appendChild:el=>el.isConnected=true},body:{appendChild:el=>el.isConnected=true,prepend(){}},createElement:tag=>{
    const el={style:{},isConnected:false,addEventListener:(name,fn)=>el[name]=fn,remove(){this.isConnected=false;},focus(){}};
    if(tag==='style')style=el;
    if(tag==='iframe'){el.contentWindow={document:{documentElement:{},createElement:()=>({}),head:{appendChild(){}}}};iframe=el;}
    return el;
  }};
  const window={addEventListener(){},removeEventListener(){}};window.top=window;
  vm.runInNewContext('('+installRenderer.toString()+')({html:"",css:"",skin:"",assets:{}},()=>{},createMotion)',{
    window,document,createMotion,atob,Blob,Uint8Array,URL:{createObjectURL:()=> 'blob:image',revokeObjectURL(){}},
    setTimeout:fn=>{const id=++nextTimer;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),console
  });
  iframe.load();
  const send=data=>iframe.contentWindow.AEMEATH_SEND({type:'aemeath-boot',...data});
  send({action:'background',image:'data:image/png;base64,AA==',strength:56,video:new Blob(['video'])});
  assert.equal(options.autoplay,false);assert.deepEqual(active,[]);assert.equal(root.hasAttribute('data-aemeath-skin'),true);
  send({action:'complete'});assert.deepEqual(active,[true]);assert.equal(window.__aemeathExtension.status().overlay,false);
  options.onFinish('ended');assert.equal(root.hasAttribute('data-aemeath-skin'),false);assert.equal(root.hasAttribute('data-aemeath-restoring'),true);assert.deepEqual(fades,[1800]);
  assert.equal(values.get('--aemeath-wash'),'original-wash');
  assert.equal(timers.size,1);[...timers.values()][0]();
  assert.equal(root.hasAttribute('data-aemeath-restoring'),false);assert.equal(style.isConnected,false);assert.equal(disposed,1);
});
