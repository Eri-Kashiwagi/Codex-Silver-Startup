import {stat} from 'node:fs/promises';
import {join} from 'node:path';
export async function installDefaultVideo(client,root){
  const path=join(root,'assets/background.mp4');
  const info=await stat(path).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  if(!info)return false;
  if(!info.isFile()||info.size>64*1024*1024)throw Error('Default background video exceeds the 64 MiB media budget');
  const {root:document}=await client.call('DOM.getDocument',{depth:0});
  const {nodeId}=await client.call('DOM.querySelector',{nodeId:document.nodeId,selector:'#codex-silver-default-video'});
  if(!nodeId)throw Error('Default video input is not ready');
  // Chromium receives a File handle: video bytes never expand into CDP JSON or Base64.
  await client.call('DOM.setFileInputFiles',{nodeId,files:[path]});
  await client.call('Runtime.evaluate',{expression:'document.querySelector("#codex-silver-default-video").dispatchEvent(new Event("change"))'});
  return true;
}
