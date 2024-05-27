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

  // Function to retrieve a certain account. It sends a message to the main process to invoke the 'get-account-by-public-key' channel
  // `publicKey` is the argument passed which will be used by the main process to return a certain account into the database
  getAccountTotalProfit: (publicKey) => ipcRenderer.invoke('get-account-total-profit', publicKey),

  getTransactionId: (tokenId) => ipcRenderer.invoke('get-transaction-id', tokenId),

  // Function to retrieve transactions. It sends a message to the main process to invoke the 'get-transaction' channel
  addTransaction: (rows) => ipcRenderer.invoke('add-transaction', rows),

  // Function to retrieve transactions. It sends a message to the main process to invoke the 'get-transactions' channel
  // `publicKey` is the argument passed which will be used by the main process to return a certain account into the database
  getTransactions: (publicKey) => ipcRenderer.invoke('get-transactions', publicKey),

  // Function to retrieve transaction details. It sends a message to the main process to invoke the 'add-transaction-detail' channel
  addTransactionDetail: (rows) => ipcRenderer.invoke('add-transaction-detail', rows),
  // Function to retrieve transactions. It sends a message to the main process to invoke the 'get-transaction-details' channel
  // `transactionId` is the argument passed which will be used by the main process to return a certain transaction's details into the database
  getTransactionDetails: (tokenId) => ipcRenderer.invoke('get-transaction-details', tokenId)
};

// Using contextBridge to expose the defined API object to the renderer process under the global
// variable `window.electron`. This is a secure method recommended by Electron to expose any functionality
// to the renderer process while keeping the Node.js environment isolated.
contextBridge.exposeInMainWorld('electron', {
  checkAccountExists: api.checkAccountExists, // Exposing the checkAccountExists function
  addAccount: api.addAccount, // Exposing the addAccunt function
  getAccounts: api.getAccounts, // Exposing the getAccounts function
  getAccountTotalProfit: api.getAccountTotalProfit,
  getTransactionId: api.getTransactionId,
  addTransaction: api.addTransaction, // Exposing the addTransaction function
  getTransactions: api.getTransactions, // Exposing the getTransactions function
  addTransactionDetail: api.addTransactionDetail, // Exposing the addTransactionDetail function
  getTransactionDetails: api.getTransactionDetails // Exposing the getTransactionDetails function
});
