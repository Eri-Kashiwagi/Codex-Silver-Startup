import test from 'node:test';
import assert from 'node:assert/strict';
const implementation=await import('../extension/windows.mjs').catch(()=>({}));
const verify=implementation.validateListeners;
const expected={pid:100,executable:'C:\\Official\\ChatGPT.exe',sid:'S-1-5-21-test',packageFullName:'OpenAI.Codex_verified'};
const listener={pid:100,parentPid:1,address:'127.0.0.1',executable:'c:\\official\\ChatGPT.exe',sid:expected.sid,packageFullName:expected.packageFullName};
test('Windows listener validation exists',()=>assert.equal(typeof verify,'function'));
test('accept official same-user root and direct child',()=>{
  verify([listener,{...listener,pid:101,parentPid:100}],expected);
});
for(const [reason,change] of [
  ['public bind',{address:'0.0.0.0'}],['foreign executable',{executable:'C:\\Other\\ChatGPT.exe'}],
  ['foreign user',{sid:'S-1-5-21-other'}],['unrelated process',{pid:200,parentPid:1}]
])test('reject '+reason,()=>{assert.equal(typeof verify,'function');assert.throws(()=>verify([listener,{...listener,...change}],expected));});
test('require launched root to own listener',()=>{assert.equal(typeof verify,'function');assert.throws(()=>verify([{...listener,pid:101,parentPid:100}],expected));assert.throws(()=>verify([],expected));});
test('require official MSIX identity',()=>{assert.throws(()=>verify([{...listener,packageFullName:''}],expected));assert.throws(()=>verify([{...listener,packageFullName:'DifferentPackage'}],expected));});
