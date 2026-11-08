let cancelCurrent=null;
export function cancelPhotoCrop(){cancelCurrent?.();}
export async function cropStaffPhoto(file,isActive=()=>true){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)throw Error('ใช้รูป JPG, PNG หรือ WebP ขนาดไม่เกิน 12 MB');
 const bitmap=await createImageBitmap(file);if(!isActive()){bitmap.close();return null;}cancelPhotoCrop();
 return new Promise((resolve,reject)=>{
 const dialog=document.createElement('dialog');dialog.className='photo-crop-dialog';dialog.setAttribute('aria-label','จัดตำแหน่งรูปบุคลากร');dialog.innerHTML='<h2>ครอปรูปบุคลากร</h2><p>ลากภาพเพื่อจัดตำแหน่ง หรือปรับแถบเลื่อน • ทุกคนใช้ขนาด 600 × 550 พิกเซล</p><canvas width="600" height="550" aria-label="ตัวอย่างกรอบรูปบุคลากร"></canvas><label>ซูมภาพ<input data-zoom type="range" min="1" max="4" step="0.01" value="1"></label><label>ตำแหน่งแนวนอน<input data-x type="range" min="0" max="100" value="50"></label><label>ตำแหน่งแนวตั้ง<input data-y type="range" min="0" max="100" value="0"></label><div class="dialog-actions"><button type="button" data-cancel>ยกเลิก</button><button type="button" data-reset>เริ่มใหม่</button><button type="button" data-accept class="primary">ใช้รูปนี้</button></div>';
 const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),zoom=dialog.querySelector('[data-zoom]'),x=dialog.querySelector('[data-x]'),y=dialog.querySelector('[data-y]');let finished=false,drag=null;
 const geometry=()=>{const scale=Math.max(600/bitmap.width,550/bitmap.height)*Number(zoom.value);return {w:bitmap.width*scale,h:bitmap.height*scale};};
 const draw=()=>{const {w,h}=geometry();ctx.clearRect(0,0,600,550);ctx.drawImage(bitmap,(600-w)*Number(x.value)/100,(550-h)*Number(y.value)/100,w,h);};
 const finish=(value,error)=>{if(finished)return;finished=true;if(cancelCurrent===cancel)cancelCurrent=null;dialog.close();dialog.remove();bitmap.close();error?reject(error):resolve(value);};
 const cancel=()=>finish(null);cancelCurrent=cancel;dialog.addEventListener('cancel',e=>{e.preventDefault();cancel();});dialog.querySelector('[data-cancel]').onclick=cancel;
 for(const input of [zoom,x,y])input.oninput=draw;
 dialog.querySelector('[data-reset]').onclick=()=>{zoom.value=1;x.value=50;y.value=0;draw();};
 canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!drag)return;const rect=canvas.getBoundingClientRect(),{w,h}=geometry();if(w>600)x.value=Math.max(0,Math.min(100,Number(x.value)+(e.clientX-drag.x)*600/rect.width/(600-w)*100));if(h>550)y.value=Math.max(0,Math.min(100,Number(y.value)+(e.clientY-drag.y)*550/rect.height/(550-h)*100));drag={x:e.clientX,y:e.clientY};draw();};
 canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
 dialog.querySelector('[data-accept]').onclick=()=>{try{for(const quality of [.9,.78,.6,.4]){const url=canvas.toDataURL('image/webp',quality);if(!url.startsWith('data:image/webp;'))throw Error('เบราว์เซอร์นี้ยังไม่รองรับรูป WebP กรุณาใช้ Chrome หรือ Edge');const data=url.split(',')[1];if(data.length<=409600){finish(data);return;}}throw Error('รูปมีรายละเอียดมากเกินไป กรุณาเลือกรูปที่เล็กลง');}catch(error){finish(null,error);}};
 document.body.append(dialog);draw();dialog.showModal();
 });
}
