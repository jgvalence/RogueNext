import {connect,wait} from './cdp.mjs';
const b=await connect();
if(await b.js("document.body.innerText.includes('PASSER LE PROLOGUE')")){await b.click(b.button("Passer le prologue"));await wait(300);}
await b.click("[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Archiviste'))");await wait(200);await b.click(b.button("Lancer l'expedition"));await wait(1200);console.log(await b.js('document.body.innerText'));b.close();
