const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../staff/staff.js'),'utf8');
function fixture(hash,allowed=true){
 const context={location:{hash},history:{replaceState(a,b,hash){context.location.hash=hash}},routes:{'academic-substitute':{app:'academic',page:'substitute',title:'สอนแทน',category:'วิชาการ',url:'https://example.test/'}},groups:[{items:['academic-substitute']}],profile:{},groupVisible:()=>allowed,routeVisible:()=>allowed,gate:{},frame:{dataset:{}},setActive:id=>context.active=id,showEmbedded:()=>{context.opened=true},showOverview:()=>{context.overview=true},pendingAcademicPage:null};
 for(const name of ['openRoute','restoreWorkspaceRoute']){
  const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);
  vm.runInNewContext(source.slice(start,end),context);
 }
 return context;
}
test('refresh restores substitute menu and passes its academic page to iframe',()=>{
 const c=fixture('#academic-substitute');c.restoreWorkspaceRoute();assert.equal(c.active,'academic-substitute');assert.equal(c.pendingAcademicPage,'substitute');assert.equal(c.opened,true);assert.equal(c.overview,undefined);
});
test('opening a menu records its URL for next refresh',()=>{
 const c=fixture('');c.openRoute('academic-substitute');assert.equal(c.location.hash,'#academic-substitute');
});
test('missing, unknown and no-longer-authorized routes safely return to overview',()=>{
 for(const [hash,allowed] of [['',true],['#unknown',true],['#academic-substitute',false]]){
  const c=fixture(hash,allowed);c.restoreWorkspaceRoute();assert.equal(c.overview,true);assert.equal(c.opened,undefined);
 }
});
test('bootstrap restores the route after profile and navigation are ready',()=>{
 assert.match(source,/renderNavigation\(\); document\.getElementById\('systemCards'\)\.hidden = true;\s+restoreWorkspaceRoute\(\);/);
});
