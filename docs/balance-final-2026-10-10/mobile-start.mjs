import {connect,wait} from './cdp.mjs';const b=await connect();await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await b.setTouch(true);await wait(300);
for(const phrase of ['Archiviste','Expedition classique en 3 etages','Sans modificateur','Choisir cette difficulte']){
 const target=`[...document.querySelectorAll('button')].find(e=>!e.disabled&&e.textContent.includes(${JSON.stringify(phrase)}))`;
 if(await b.js(`!!(${target})`)){await b.click(target);await wait(350);}
}
await b.click(b.button("Lancer l'expedition"));await wait(800);console.log(await b.js('document.body.innerText'));b.close();
