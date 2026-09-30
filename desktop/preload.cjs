const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',Object.freeze({
  saveCode: payload=>ipcRenderer.invoke('save-code',payload),
  saveProject: payload=>ipcRenderer.invoke('save-project',payload),
  openProject: ()=>ipcRenderer.invoke('open-project'),
  copyCode: code=>ipcRenderer.invoke('copy-code',code),
  ready: ()=>ipcRenderer.send('renderer-ready'),
  onAction: callback=>{const listener=(_event,action)=>callback(action);ipcRenderer.on('menu-action',listener);return()=>ipcRenderer.removeListener('menu-action',listener)}
}));
