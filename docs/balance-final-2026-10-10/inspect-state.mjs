import {connect,stateScript} from './cdp.mjs';
const b=await connect();const s=await b.js(stateScript);console.log(JSON.stringify({state:s,buttons:await b.js("[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({text:e.textContent,disabled:e.disabled,title:e.title}))")},null,2));b.close();
