import assert from 'node:assert/strict';
export const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function connect(id){
 const tabs=await(await fetch('http://127.0.0.1:9224/json/list')).json();
 const tab=tabs.find(t=>id?t.id===id:t.type==='page');
 const ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let touchMode=false;
 let serial=0;const pending=new Map(),errors=[];
 ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const [r,j]=pending.get(m.id);pending.delete(m.id);m.error?j(m.error):r(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
 const cdp=(method,params={})=>new Promise((r,j)=>{const id=++serial;pending.set(id,[r,j]);ws.send(JSON.stringify({id,method,params}));});
 const js=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const until=async (expression,timeout=60000)=>{const start=Date.now();while(Date.now()-start<timeout){const r=await js(expression);if(r)return r;await wait(150);}throw Error('Timed out: '+expression);};
 const click=async (expression,edge=false)=>{await js(`(${expression})?.scrollIntoView({block:'center',inline:'center',behavior:'instant'})`);await wait(150);const box=await js(`(()=>{const e=${expression};if(!e)return null;e.scrollIntoView({block:'center',inline:'center'});const r=e.getBoundingClientRect();return {x:r.x+(${edge}?Math.min(20,r.width/2):r.width/2),y:r.y+(${edge}?Math.min(15,r.height/2):r.height/2),w:r.width,h:r.height};})()`);assert(box?.w>0&&box?.h>0,'Missing click target: '+expression);if(touchMode){await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x,y:box.y,radiusX:1,radiusY:1,force:1}]});await wait(80);await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return;}await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x,y:box.y,buttons:0});await cdp('Input.dispatchMouseEvent',{buttons:1,type:'mousePressed',x:box.x,y:box.y,button:'left',clickCount:1});await wait(50);await cdp('Input.dispatchMouseEvent',{buttons:0,type:'mouseReleased',x:box.x,y:box.y,button:'left',clickCount:1});};
 const press=async expression=>{assert(await js(`(()=>{const e=${expression};if(!e)return false;e.scrollIntoView({block:'center'});e.focus();return document.activeElement===e;})()`),'Cannot focus '+expression);await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});};
 const button=text=>`[...document.querySelectorAll('button,a')].find(e=>e.getBoundingClientRect().width>0&&e.textContent.trim()===${JSON.stringify(text)})`;
 const type=async(selector,text)=>{await click(`document.querySelector(${JSON.stringify(selector)})`);await wait(200);await js(`document.querySelector(${JSON.stringify(selector)}).focus()`);await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await cdp('Input.insertText',{text});await wait(200);};
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Network.enable');
 const setTouch=async enabled=>{touchMode=enabled;await cdp('Emulation.setTouchEmulationEnabled',{enabled,maxTouchPoints:1});};
 return {id:tab.id,cdp,js,until,click,press,button,type,errors,setTouch,close:()=>ws.close()};
}
export const stateScript=`(()=>{const e=document.querySelector('main')??document.querySelector('button');if(!e)return null;let f=e[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];if(!f)return null;while(f.return)f=f.return;const stack=[f.stateNode.current];while(stack.length){const n=stack.pop();const v=n.memoizedProps?.value;if(v?.state?.runId&&v.cardDefs)return v.state;if(n.sibling)stack.push(n.sibling);if(n.child)stack.push(n.child);}return null;})()`;

if(process.argv[1]?.endsWith('cdp.mjs')){
 const b=await connect();
 if(process.argv[2]==='navigate'){await b.cdp('Page.navigate',{url:process.argv[3]});await wait(3000);}
 if(process.argv[2]==='click'){await b.click(b.button(process.argv[3]));await wait(500);}
 console.log(await b.js(process.argv[2]==='eval'?process.argv[3]:`({url:location.href,text:document.body.innerText.slice(0,14000),inputs:[...document.querySelectorAll('input')].map(e=>({id:e.id,type:e.type,placeholder:e.placeholder}))})`));b.close();
}
