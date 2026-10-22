import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import vm from 'node:vm';
import {buildInjection} from '../extension/payload.mjs';
const root=new URL('../',import.meta.url);
async function removeFixture(fixture){
  const target=resolve(fixture);
  assert.equal(dirname(target).toLowerCase(),resolve(tmpdir()).toLowerCase());
  assert.match(basename(target),/^codex-(jpeg|gif)-/);
  await rm(target,{recursive:true,force:true});
}
test('original JPEG default remains available without GIF assets',async()=>{
  const fixture=await mkdtemp(join(tmpdir(),'codex-jpeg-'));
  try{
    for(const file of ['index.html','style.css','image-settings.js','animation.js','extension','assets'])await cp(new URL(file,root),join(fixture,file),{recursive:true});
    await rm(join(fixture,'assets/artwork.gif'),{force:true});
    await rm(join(fixture,'assets/artwork-contours.js'),{force:true});
    const code=await buildInjection(fixture);
    const jpeg=await readFile(join(fixture,'assets/artwork.jpg'));
    assert.ok(code.includes('data:image/jpeg;base64,'+jpeg.toString('base64')));
  }finally{await removeFixture(fixture);}
});
test('injection uses animated artwork and its matching contours when provided',async()=>{
  const fixture=await mkdtemp(join(tmpdir(),'codex-gif-'));
  try{
    for(const file of ['index.html','style.css','image-settings.js','animation.js','extension','assets'])await cp(new URL(file,root),join(fixture,file),{recursive:true});
    const gif=Buffer.from('GIF89a animated fixture');
    await writeFile(join(fixture,'assets/artwork.gif'),gif);
    await writeFile(join(fixture,'assets/artwork-contours.js'),'window.CONTOUR_PATHS=[[[10,20],[30,40]]];');
    const code=await buildInjection(fixture);
    assert.ok(code.includes('data:image/gif;base64,'+gif.toString('base64')));
    assert.ok(code.includes('window.CONTOUR_PATHS=[[[10,20],[30,40]]];'));
  }finally{await removeFixture(fixture);}
});
test('GIF artwork import preserves original animation bytes and creates contours',async()=>{
  const source=await readFile(new URL('image-settings.js',root),'utf8');
  const width=960,height=540,rgba=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,c=x<width/2?0:255;
    rgba[i]=rgba[i+1]=rgba[i+2]=c;rgba[i+3]=255;
  }
  const gifURL='data:image/gif;base64,R0lGODlh';
  const scope={};
  const context={window:scope,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},Image:class{naturalWidth=500;naturalHeight=281;async decode(){}},document:{createElement:()=>({getContext:()=>({fillRect(){},drawImage(){},getImageData:()=>({data:rgba})}),toDataURL:()=> 'data:image/png;base64,static'})},FileReader:class{readAsDataURL(){this.result=gifURL;this.onload();}}};
  vm.runInNewContext(source,context);
  const imported=await scope.imageSettings.importImage({size:6,type:'image/gif'},'artwork');
  assert.equal(imported.artwork,gifURL);
  assert.ok(imported.contours.length>0);
  assert.ok(imported.contours.every(path=>path.every(([x,y])=>x>=0&&x<=1920&&y>=0&&y<=1080)));
  await assert.rejects(scope.imageSettings.importImage({size:6,type:'image/gif'},'avatar'),/PNG/);
});
