import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),locales=['en','zh-CN','zh-TW','ja','ru'];
const sources=await Promise.all([...locales.map(locale=>'locales/'+locale+'.js'),'i18n.js'].map(file=>readFile(new URL(file,root),'utf8')));
function fixture(){const context=vm.createContext({});for(const source of sources)vm.runInContext(source,context);return context;}

test('English is the default even on a non-English system; invalid preferences fall back to English',()=>{
  const {SilverI18n:i18n}=fixture();
  assert.equal(i18n.locale,'en');assert.equal(i18n.t('language'),'Language');
  i18n.setLocale('ja');assert.equal(i18n.t('language'),'言語');
  for(const value of [undefined,null,'fr','__proto__']){i18n.setLocale(value);assert.equal(i18n.locale,'en');}
});

test('all five catalogs cover every UI message and preserve interpolation placeholders',async()=>{
  const {SILVER_TRANSLATIONS:catalogs}=fixture(),keys=Object.keys(catalogs.en).sort();
  const placeholders=value=>[...value.matchAll(/\{\w+\}/g)].map(match=>match[0]).sort();
  for(const locale of locales){
    assert.deepEqual(Object.keys(catalogs[locale]).sort(),keys);
    for(const key of keys){assert.ok(catalogs[locale][key].trim(),locale+': '+key);assert.deepEqual(placeholders(catalogs[locale][key]),placeholders(catalogs.en[key]));}
  }
  const html=await readFile(new URL('index.html',root),'utf8');
  for(const [,key] of html.matchAll(/data-i18n(?:-(?:title|aria-label|alt))?="([^"]+)"/g))assert.ok(keys.includes(key),key);
  for(const file of ['animation.js','image-settings.js']){
    for(const [,key] of (await readFile(new URL(file,root),'utf8')).matchAll(/\bt\('([^']+)'/g))assert.ok(keys.includes(key),key);
  }
});

test('missing translations fall back to English and parameters are treated as literal text',()=>{
  const {SilverI18n:i18n,SILVER_TRANSLATIONS:catalogs}=fixture();
  i18n.setLocale('ru');delete catalogs.ru.saveFailed;
  assert.equal(i18n.t('saveFailed',{error:'<img onerror=alert(1)> $& {error}'}),'Could not save. Previous settings kept: <img onerror=alert(1)> $& {error}');
});

test('release manifests and standalone preview include the complete language runtime',async()=>{
  const manifest=JSON.parse(await readFile(new URL('project.json',root),'utf8'));
  const html=await readFile(new URL('index.html',root),'utf8');
  for(const file of [...locales.map(locale=>'locales/'+locale+'.js'),'i18n.js']){
    assert.ok(manifest.runtimeFiles.includes(file),file);assert.ok(manifest.sourceFiles.includes(file),file);assert.ok(html.includes('src="'+file+'"'),file);
  }
});
