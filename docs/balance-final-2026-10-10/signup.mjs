import {connect,wait} from './cdp.mjs';
const b=await connect();
await b.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await b.type('#username','recette_finale');await b.type('#password','Local-Recette-2026!');await b.click(b.button("S'inscrire"));
await wait(3000);console.log(await b.js('document.body.innerText'));b.close();
