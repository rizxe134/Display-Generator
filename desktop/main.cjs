const {app,BrowserWindow,Menu,dialog,ipcMain,shell,clipboard}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {validateProject,parseProject,MAX_PROJECT_BYTES}=require('./project.cjs');
const entry=path.join(__dirname,'../renderer/index.html'),entryURL=pathToFileURL(entry).href;
const smoke=process.argv.includes('--smoke-test');
if(smoke)app.setPath('userData',path.join(app.getPath('temp'),`oled-studio-smoke-${process.pid}`));
let win,smokeTimer;
function trusted(event){if(!win||event.sender!==win.webContents||event.senderFrame?.url!==entryURL)throw Error('Unauthorized request.');}
function codeText(code){if(typeof code!=='string'||code.length>200000)throw Error('Invalid code export.');return code;}
function reply(fn){return async(event,payload)=>{try{trusted(event);return await fn(payload)}catch(error){return{ok:false,error:error.message}}};}
ipcMain.handle('save-code',reply(async payload=>{
  if(!payload||!['ino','py'].includes(payload.extension))throw Error('Invalid export format.');
  const code=codeText(payload.code),ext=payload.extension;
  const result=await dialog.showSaveDialog(win,{title:'Export display code',defaultPath:`oled_design.${ext}`,filters:[{name:ext==='py'?'Python script':'Arduino sketch',extensions:[ext]}]});
  if(result.canceled)return{ok:true,canceled:true};
  const destination=result.filePath.toLowerCase().endsWith(`.${ext}`)?result.filePath:`${result.filePath}.${ext}`;
  await fs.writeFile(destination,code,'utf8');return{ok:true};
}));
ipcMain.handle('save-project',reply(async payload=>{
  const project=validateProject(payload);
  const result=await dialog.showSaveDialog(win,{title:'Save OLED project',defaultPath:'design.oled.json',filters:[{name:'OLED Studio project',extensions:['json']}]});
  if(result.canceled)return{ok:true,canceled:true};
  const destination=result.filePath.toLowerCase().endsWith('.json')?result.filePath:`${result.filePath}.oled.json`;
  await fs.writeFile(destination,JSON.stringify(project,null,2),'utf8');return{ok:true};
}));
ipcMain.handle('open-project',reply(async()=>{
  const result=await dialog.showOpenDialog(win,{title:'Open OLED project',properties:['openFile'],filters:[{name:'OLED Studio project',extensions:['json']}]});
  if(result.canceled)return{ok:true,canceled:true};
  const file=result.filePaths[0];if((await fs.stat(file)).size>MAX_PROJECT_BYTES)throw Error('The project file is too large.');
  return{ok:true,project:parseProject(await fs.readFile(file,'utf8'))};
}));
ipcMain.handle('copy-code',reply(async code=>{clipboard.writeText(codeText(code));return{ok:true}}));
ipcMain.on('renderer-ready',event=>{trusted(event);if(smoke){clearTimeout(smokeTimer);console.log('SMOKE PASS: desktop renderer loaded and secure preload bridge is ready.');app.exit(0)}});
const external=new Set(['https://github.com/adafruit/Adafruit_SH110x','https://github.com/adafruit/Adafruit_SSD1306','https://luma-oled.readthedocs.io/en/latest/python-usage.html']);
function openLink(url){if(external.has(url))shell.openExternal(url).catch(()=>{});}
function createWindow(){
  win=new BrowserWindow({width:1440,height:980,minWidth:820,minHeight:650,title:'OLED Studio',backgroundColor:'#0b1019',show:!smoke,icon:path.join(__dirname,'../build/icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
  win.webContents.setWindowOpenHandler(({url})=>{openLink(url);return{action:'deny'}});
  win.webContents.on('will-navigate',(event,url)=>{if(url!==entryURL){event.preventDefault();openLink(url)}});
  win.webContents.session.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  win.webContents.on('render-process-gone',()=>{if(smoke)app.exit(1)});
  win.loadFile(entry).catch(error=>{console.error(error.message);app.exit(1)});
  if(smoke)smokeTimer=setTimeout(()=>{console.error('Desktop startup timed out.');app.exit(1)},20000);
  const action=name=>()=>win?.webContents.send('menu-action',name);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform==='darwin'?[{role:'appMenu'}]:[]),
    {label:'File',submenu:[{label:'Open project…',accelerator:'CmdOrCtrl+O',click:action('open-project')},{label:'Save project…',accelerator:'CmdOrCtrl+S',click:action('save-project')},{type:'separator'},{label:'Export code…',accelerator:'CmdOrCtrl+E',click:action('export-code')},{type:'separator'},process.platform==='darwin'?{role:'close'}:{role:'quit'}]},
    {label:'Edit',submenu:[{label:'Undo drawing',accelerator:'CmdOrCtrl+Z',click:action('undo')},{label:'Redo drawing',accelerator:'CmdOrCtrl+Shift+Z',click:action('redo')},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
    {label:'View',submenu:[{role:'zoomIn'},{role:'zoomOut'},{role:'resetZoom'},{role:'togglefullscreen'}]}
  ]));
}
app.whenReady().then(createWindow);
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
