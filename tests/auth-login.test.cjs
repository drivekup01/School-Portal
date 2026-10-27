const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

for(const file of ['shared/school-auth.js','attendance/js/school-auth.js']){
 function fixture({cold=false,error}={}){
  const calls=[];
  const client={auth:{},A:{GoogleAuthProvider:class{setCustomParameters(p){this.parameters=p;}},signInWithPopup(auth,provider){calls.push({auth,provider});return error?Promise.reject(Object.assign(Error('Firebase error'),{code:error})):Promise.resolve('signed-in');},signInWithRedirect(){throw Error('Redirect must never be called');}}};
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  const ctx={client,cold,pending,Promise,Error};
  vm.createContext(ctx);
  let source=fs.readFileSync(__dirname+'/../'+file,'utf8').replace(/^import .*;\r?\n/gm,'');
  const start=source.indexOf('export async function firebase()');
  const end=source.indexOf('// Prepare before a click',start);
  source=source.slice(0,start)+'function firebase(){if(!cold){ready=client;return Promise.resolve(client);}return pending.then(()=>{ready=client;return client;});}\n'+source.slice(end);
  vm.runInContext(source.replace(/export /g,''),ctx);
  return {ctx,calls,release};
 }
 test(file+': popup opens synchronously from click with prepared SDK',async()=>{
  const f=fixture();const result=f.ctx.login();
  assert.equal(f.calls.length,1,'must open before yielding user activation');
  assert.equal(f.calls[0].provider.parameters.prompt,'select_account');
  assert.equal(await result,'signed-in');
 });
 test(file+': cold SDK asks for another click instead of opening a delayed popup',async()=>{
  const f=fixture({cold:true});const result=f.ctx.login();
  f.release();await assert.rejects(result,{code:'auth/login-ready'});
  assert.equal(f.calls.length,0);await f.ctx.login();assert.equal(f.calls.length,1);
 });
 for(const code of ['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/popup-closed-by-user']){
  test(file+': '+code+' never falls back to redirect',async()=>{
   const f=fixture({error:code});await assert.rejects(f.ctx.login(),{code});assert.equal(f.calls.length,1);
  });
 }
 test(file+': legacy redirect button uses popup',async()=>{
  const f=fixture();assert.equal(await f.ctx.loginRedirect(),'signed-in');assert.equal(f.calls.length,1);
 });
}
