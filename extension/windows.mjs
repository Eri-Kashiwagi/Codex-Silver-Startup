import {execFile as rawExec} from 'node:child_process';
import {promisify} from 'node:util';
import {dirname,join,win32,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {buildInjection} from './payload.mjs';
import {connect,pageTarget,localSocket} from './cdp.mjs';
import {installDefaultVideo} from './default-video.mjs';
const exec=promisify(rawExec),root=dirname(dirname(fileURLToPath(import.meta.url)));
export function validateListeners(records,expected){
  if(!Array.isArray(records)||!records.length)throw Error('No debug listener');
  const official=win32.resolve(expected.executable).toLowerCase();
  if(!records.some(x=>x.pid===expected.pid))throw Error('Launched official process does not own listener');
  for(const record of records){
    if(record.address!=='127.0.0.1')throw Error('Debug listener must use 127.0.0.1 only');
    if(!record.executable||win32.resolve(record.executable).toLowerCase()!==official)throw Error('Listener is not the official executable');
    if(!record.sid||record.sid!==expected.sid)throw Error('Listener belongs to another user');
    if(!expected.packageFullName||record.packageFullName!==expected.packageFullName)throw Error('Listener has no matching official MSIX identity');
    if(record.pid!==expected.pid&&record.parentPid!==expected.pid)throw Error('Listener is not a child of the launched process');
  }
}
async function verify(port,expected){
  const powershell=join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
  const env={...process.env,PSModulePath:join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/Modules')};
  const {stdout}=await exec(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',join(root,'windows/verify-port.ps1'),'-Port',String(port)],{windowsHide:true,timeout:12000,maxBuffer:1024*1024,env});
  validateListeners(JSON.parse(stdout.trim()),expected);
}
export async function inject({port,pid,executable,sid,packageFullName,openSettings=false}){
  if(!Number.isInteger(port)||port<1||port>65535||!Number.isInteger(pid)||pid<1||!executable||!sid||!packageFullName)throw Error('Invalid launcher parameters');
  const source=await buildInjection(root,{openSettings}),expected={pid,executable,sid,packageFullName},deadline=Date.now()+60000;
  let last='Waiting for official window';
  while(Date.now()<deadline){
    let client;
    try{
      await verify(port,expected);
      const response=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(2000),redirect:'error'});
      if(!response.ok)throw Error('Debug endpoint is not ready');
      const targets=await response.json();if(!Array.isArray(targets))throw Error('Invalid target list');
      const target=targets.find(pageTarget);if(!target)throw Error('Main window is not ready');
      client=await connect(localSocket(target.webSocketDebuggerUrl,port));
      const result=await client.call('Runtime.evaluate',{expression:source,returnByValue:true,awaitPromise:true});
      if(result.exceptionDetails||result.result?.value?.installed!==true)throw Error('Animation installation failed');
      if(openSettings)await client.call('Page.bringToFront');
      for(let attempt=0;attempt<100&&Date.now()<deadline;attempt++){
        const result=await client.call('Runtime.evaluate',{expression:'globalThis.__aemeathExtension?.status()',returnByValue:true});
        const state=result.result?.value;
        if(state?.ready){await installDefaultVideo(client,root);console.log(JSON.stringify({phase:'ready',port,pid,settings:'Ctrl+Alt+B'}));return;}
        if(['failed','timeout'].includes(state?.phase))throw Error('Animation asset loading failed');
        await delay(100);
      }
      throw Error('Animation start timed out');
    }catch(error){last=error.message;}
    finally{client?.close();}
    await delay(300);
  }
  throw Error('Could not attach animation: '+last+'. Exit the official app completely and open its original icon to end debug mode.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),value=key=>args[args.indexOf(key)+1];
  inject({port:Number(value('--port')),pid:Number(value('--pid')),executable:value('--exe'),sid:value('--sid'),packageFullName:value('--package'),openSettings:args.includes('--settings')}).catch(error=>{console.error(error.message);process.exitCode=1;});
}
