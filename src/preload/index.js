import { contextBridge, ipcRenderer } from 'electron';

// Define an API object that holds functions to perform IPC calls
const api = {
  // Function to add a user. It sends a message to the main process to invoke the 'add-user' channel
  // `userId` is the argument passed which will be used by the main process to add a user into the database
  addUser: (userId) => ipcRenderer.invoke('add-user', userId),

  // Function to retrieve users. It sends a message to the main process to invoke the 'get-users' channel
  // This function does not need to send any additional data
  getUsers: () => ipcRenderer.invoke('get-users')
};

// Using contextBridge to expose the defined API object to the renderer process under the global
// variable `window.electron`. This is a secure method recommended by Electron to expose any functionality
// to the renderer process while keeping the Node.js environment isolated.
contextBridge.exposeInMainWorld('electron', {
  addUser: api.addUser, // Exposing the addUser function
  getUsers: api.getUsers // Exposing the getUsers function
});
