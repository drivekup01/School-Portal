const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={Intl,Date};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../attendance/js/core.js','utf8').replace(/export /g,''),ctx);vm.runInContext(fs.readFileSync(__dirname+'/../attendance/js/today-lessons.js','utf8').replace(/^import.*\r?\n/,'').replace('export ',''),ctx);
test('today lists the teachers own ordinary and replacement lessons on the assigned date only',()=>{
 const base={teacherUid:'u',active:true,from:'2026-10-01',to:'2026-12-31',weekday:3,period:2,kind:'subject'},jobs=[{...base,id:'own'},{...base,id:'other',teacherUid:'other'},{...base,id:'sub',kind:'substitute',date:'2026-10-28',period:1},{...base,id:'tomorrow',kind:'substitute',date:'2026-10-29'},{...base,id:'cancelled',kind:'substitute',date:'2026-10-28',active:false}];
 assert.deepEqual(Array.from(ctx.teachingToday(jobs,{uid:'u',role:'teacher'},'2026-10-28'),a=>a.id),['sub','own']);assert.equal(ctx.teachingToday(jobs,{uid:'u',role:'teacher'},'2026-10-27').length,0);
});
