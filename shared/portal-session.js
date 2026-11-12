// Reuse the portal's initialized account connection inside its same-origin frame.
function bridge(){try{return window.parent!==window&&window.parent.location.origin===location.origin?(window.parent.schoolPortalSession||window.parent.schoolShowcaseSession):null;}catch{return null;}}
const fallback=()=>import('./school-auth.js?v=20261107-academic1');
export async function withTimeout(promise,ms=20000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('โหลดข้อมูลไม่สำเร็จ กรุณากดลองใหม่')),ms);})]);}finally{clearTimeout(timer);}}
export async function firebase(){const shared=bridge();return shared?shared.firebase():(await fallback()).firebase();}
export async function call(name,data){const shared=bridge();return withTimeout(shared?shared.call(name,data):fallback().then(a=>a.call(name,data)),data?.method==='catalog'?25000:120000);}
export async function login(){return (await fallback()).login();}
export async function logout(){return (await fallback()).logout();}

export async function profile(){const shared=bridge();return withTimeout(shared?.profile?shared.profile():(await fallback()).profile());}
export async function observeProfile(receive){const shared=bridge();return shared?.observeProfile?shared.observeProfile(receive):(await fallback()).observeProfile(receive);}
