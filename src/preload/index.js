import { contextBridge, ipcRenderer } from 'electron';

// Define an API object that holds functions to perform IPC calls
const api = {
  // Function to add an account. It sends a message to the main process to invoke the 'add-account' channel
  // `publicKey` is the argument passed which will be used by the main process to add an account into the database
  addAccount: (publicKey) => ipcRenderer.invoke('add-account', publicKey),

  // Function to retrieve accounts. It sends a message to the main process to invoke the 'get-accounts' channel
  // This function does not need to send any additional data
  getAccounts: () => ipcRenderer.invoke('get-accounts')
};

// Using contextBridge to expose the defined API object to the renderer process under the global
// variable `window.electron`. This is a secure method recommended by Electron to expose any functionality
// to the renderer process while keeping the Node.js environment isolated.
contextBridge.exposeInMainWorld('electron', {
  addAccount: api.addAccount, // Exposing the addAccunt function
  getAccounts: api.getAccounts // Exposing the getAccounts function
});
