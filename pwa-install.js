/* Installation UI only. Account roles and student data remain in their apps. */
(() => {
  'use strict';
  const byId=id=>document.getElementById(id),panel=byId('pwaInstallPanel'),install=byId('pwaInstall'),help=byId('pwaHelp'),dialog=byId('pwaInstallHelp'),status=byId('pwaInstallStatus');
  let promptEvent=null,installed=false,waitingWorker=null,reloading=false,updateRequested=false;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function paint(){panel.hidden=standalone();install.hidden=installed;status.textContent=installed?'ติดตั้งแล้ว เปิดผ่านไอคอน KBW School บนหน้าจอโฮมได้เลย':'เปิดจากหน้าจอโฮม แล้วเลือกใช้ทั้งสามระบบ';}
  function showHelp(){if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal();}else dialog.setAttribute('open','');}
  help.addEventListener('click',showHelp);
  byId('pwaHelpClose').addEventListener('click',()=>{if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');install.focus();});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;paint();});
  window.addEventListener('appinstalled',()=>{installed=true;promptEvent=null;paint();});
  install.addEventListener('click',async()=>{
    if(!promptEvent){showHelp();return;}
    const event=promptEvent;promptEvent=null;install.disabled=true;
    try{await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')status.textContent='กำลังติดตั้ง กรุณาทำตามขั้นตอนบนโทรศัพท์';}
    catch{showHelp();}
    finally{install.disabled=false;}
  });
  const display=window.matchMedia('(display-mode: standalone)');display.addEventListener?.('change',paint);
  function network(){byId('pwaOfflineNotice').hidden=navigator.onLine;}
  window.addEventListener('online',network);window.addEventListener('offline',network);network();paint();
  function offerUpdate(worker){waitingWorker=worker;byId('pwaUpdateNotice').hidden=false;}
  byId('pwaUpdate').addEventListener('click',()=>{if(waitingWorker){updateRequested=true;waitingWorker.postMessage({type:'SKIP_WAITING'});}});
  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updateRequested&&!reloading){reloading=true;location.reload();}});
    window.addEventListener('load',async()=>{
      try{
        const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
        if(registration.waiting)offerUpdate(registration.waiting);
        registration.addEventListener('updatefound',()=>{const worker=registration.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offerUpdate(worker);});});
        await navigator.serviceWorker.ready;console.info('[KBW PWA] app shell ready');
      }catch(error){console.warn('[KBW PWA] browser installation fallback remains available:',error.message);}
    });
  }
})();
