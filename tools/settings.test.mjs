import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {buildInjection} from '../extension/payload.mjs';
import {installRenderer} from '../extension/renderer.mjs';
const root=new URL('../',import.meta.url);
test('settings entry preserves a fresh-install setting flag in the payload',async()=>{
  const source=await buildInjection(fileURLToPath(root),{openSettings:true});
  assert.ok(source.includes('"openSettings":true'));
});
test('settings entry opens the existing extension rather than reinjecting',()=>{
  let opened=0;
  const window={__aemeathExtension:{openSettings(){opened++;}}};window.top=window;
  vm.runInNewContext('('+installRenderer.toString()+')({openSettings:true},()=>{})',{window});
  assert.equal(opened,1);
});
test('settings request reaches an active animation iframe and survives pending mount',()=>{
  let opened=0,load;
  const root={style:{getPropertyValue:()=>'',getPropertyPriority:()=>''},getAttribute:()=>null};
  const child={document:{documentElement:{},head:{appendChild(){}},createElement:()=>({})}};
  const frame={style:{},contentWindow:child,addEventListener:(event,handler)=>{load=handler;},focus(){},remove(){}};
  const document={documentElement:root,activeElement:null,body:{appendChild(){}},createElement:tag=>tag==='iframe'?frame:{}};
  const window={addEventListener(){}};window.top=window;
  let requested;
  const mount=win=>{win.launcherUI={openSettings(){opened++;}};requested=win.AEMEATH_OPEN_SETTINGS;};
  const context={window,document,setTimeout:()=>0,clearTimeout(){},console};
  vm.runInNewContext('('+installRenderer.toString()+')({html:"",css:"",skin:"",assets:{}},mount)',{...context,mount});
  window.__aemeathExtension.openSettings();load();assert.equal(requested,true);
  window.__aemeathExtension.openSettings();assert.equal(opened,1);
});
