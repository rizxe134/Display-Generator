const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('startup check waits for both renderer readiness and completed page load',async()=>{
 const exits=[],listeners={};let finishLoad,window;
 const entry=path.resolve(__dirname,'../renderer/index.html');
 const electron={app:{setPath(){},getPath(){return'/tmp'},whenReady(){return Promise.resolve()},on(){},exit(code){exits.push(code)},quit(){}},BrowserWindow:class{constructor(){window=this;this.webContents={setWindowOpenHandler(){},on(){},session:{setPermissionRequestHandler(){}}}}loadFile(){return new Promise(resolve=>finishLoad=resolve)}},Menu:{buildFromTemplate:v=>v,setApplicationMenu(){}},ipcMain:{handle(){},on(name,callback){listeners[name]=callback}},dialog:{},clipboard:{},shell:{}};
 const sandbox={require:name=>name==='electron'?electron:name==='./project.cjs'?require('../desktop/project.cjs'):require(name),__dirname:path.resolve(__dirname,'../desktop'),process:{argv:['electron','.','--smoke-test'],pid:1,platform:'win32'},setTimeout:()=>1,clearTimeout(){},console};
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../desktop/main.cjs'),'utf8'),sandbox);
 await Promise.resolve();
 listeners['renderer-ready']({sender:window.webContents,senderFrame:{url:require('node:url').pathToFileURL(entry).href}});
 assert.deepEqual(exits,[],'readiness before load resolution must not exit');
 finishLoad();await Promise.resolve();
 assert.deepEqual(exits,[0]);
});

