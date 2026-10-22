import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {installRenderer} from './renderer.mjs';
import {createVideoWallpaper} from './video-wallpaper.mjs';
export async function buildInjection(root,{openSettings=false}={}){
  let [html,css,skin,settings,contours,animation,avatar,artwork]=await Promise.all([
    'index.html','style.css','extension/wallpaper.css','image-settings.js','assets/contours.js','animation.js','assets/avatar.jpg','assets/artwork.jpg'
  ].map(name=>readFile(join(root,name))));
  let artworkMime='image/jpeg';
  const wallpaper=await readFile(join(root,'assets/background.jpg')).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  try{
    const animated=await Promise.all(['assets/artwork.gif','assets/artwork-contours.js'].map(name=>readFile(join(root,name))));
    [artwork,contours]=animated;artworkMime='image/gif';
  }catch(error){if(error.code!=='ENOENT')throw error;}
  const payload={openSettings,html:html.toString().replace(/<!doctype[^>]*>/ig,'').replace(/<html[^>]*>|<\/html>/ig,'')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/ig,'').replace(/<link\b[^>]*>/ig,'')
    .replace(/<meta\b[^>]*http-equiv[^>]*>/ig,'').replace(/src="assets\/[^"]*"/g,'src=""'),
    css:css.toString(),skin:skin.toString(),assets:{avatar:'data:image/jpeg;base64,'+avatar.toString('base64'),artwork:'data:'+artworkMime+';base64,'+artwork.toString('base64')}};
  // Bind animation globals to the temporary iframe so removing it stops its work.
  const mount=`function(window){const document=window.document,location=window.location,performance=window.performance,indexedDB=window.indexedDB,Image=window.Image,Path2D=window.Path2D,URL=window.URL,module=undefined;const requestAnimationFrame=window.requestAnimationFrame.bind(window),cancelAnimationFrame=window.cancelAnimationFrame.bind(window);\n${settings}\n${contours}\n${animation}\n}`;
  payload.assets.wallpaper=wallpaper?'data:image/jpeg;base64,'+wallpaper.toString('base64'):payload.assets.artwork;
  return `(${installRenderer.toString()})(${JSON.stringify(payload)},${mount},${createVideoWallpaper.toString()})`;
}
