import { contextBridge, ipcRenderer } from 'electron';

// Define an API object that holds functions to perform IPC calls
const api = {
  // Function to check if an account exists. It sends a message to the main process to invoke the 'check-account-exists' channel
  // `publicKey` is the argument passed which will be used by the main process to check if an account exists in the database
  checkAccountExists: (publicKey) => ipcRenderer.invoke('check-account-exists', publicKey),
  // Function to add an account. It sends a message to the main process to invoke the 'add-account' channel
  // `publicKey` is the argument passed which will be used by the main process to add an account into the database
  addAccount: (publicKey) => ipcRenderer.invoke('add-account', publicKey),

  // Function to retrieve accounts. It sends a message to the main process to invoke the 'get-accounts' channel
  // This function does not need to send any additional data
  getAccounts: () => ipcRenderer.invoke('get-accounts'),

  // Function to retrieve transactions. It sends a message to the main process to invoke the 'get-transaction' channel
  // `publicKey, ticker, cost, profit` is the argument passed which will be used by the main process to add a transaction into the database
  addTransaction: () => ipcRenderer.invoke('add-transaction', publicKey, ticker, cost, profit),

  // Function to retrieve transactions. It sends a message to the main process to invoke the 'get-transactions' channel
  // This function does not need to send any additional data
  getTransactions: () => ipcRenderer.invoke('get-transactions')
};

// Using contextBridge to expose the defined API object to the renderer process under the global
// variable `window.electron`. This is a secure method recommended by Electron to expose any functionality
// to the renderer process while keeping the Node.js environment isolated.
contextBridge.exposeInMainWorld('electron', {
  checkAccountExists: api.checkAccountExists, // Exposing the checkAccountExists function
  addAccount: api.addAccount, // Exposing the addAccunt function
  getAccounts: api.getAccounts, // Exposing the getAccounts function
  addTransaction: api.addTransaction, // Exposing the addTransaction function
  getTransactions: api.getTransactions // Exposing the getTransactions function
});
