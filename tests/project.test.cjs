const test=require('node:test'),assert=require('node:assert/strict');
const {validateProject,parseProject}=require('../desktop/project.cjs');
const valid=()=>({format:'oled-studio',version:1,width:128,height:64,pixels:Array(8192).fill(0),settings:{controller:'SH1106',address:'0x3C',board:'esp32',sda:21,scl:22}});
test('saved projects roundtrip every pixel and setting',()=>{const p=valid();p.pixels[0]=1;p.pixels[8191]=1;assert.deepEqual(parseProject(JSON.stringify(p)),p)});
test('both supported sizes and all code targets can reopen',()=>{for(const height of [32,64])for(const board of ['esp32','arduino','pi']){const p=valid();p.height=height;p.pixels=Array(128*height).fill(1);p.settings.controller=height===32?'SSD1306':'SH1106';p.settings.board=board;assert.deepEqual(validateProject(p),p)}});
test('malformed and incompatible files are rejected before updating canvas',()=>{
  for(const change of [p=>p.width=129,p=>p.pixels.pop(),p=>p.pixels[1]=3,p=>p.version=2,p=>p.settings.address='0xFFFF',p=>p.settings.sda=-1,p=>p.settings.controller='unsupported',p=>{p.height=32;p.pixels=Array(4096).fill(0)}]){const p=valid();change(p);assert.throws(()=>validateProject(p))}
  assert.throws(()=>parseProject('{broken'));assert.throws(()=>parseProject('x'.repeat(100001)));
});
test('unknown properties are discarded and returned pixels are independent',()=>{const p=valid();p.path='unexpected';const parsed=validateProject(p);assert.equal(parsed.path,undefined);parsed.pixels[0]=1;assert.equal(p.pixels[0],0)});
