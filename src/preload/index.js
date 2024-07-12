import { contextBridge, ipcRenderer } from 'electron';

// API object that holds functions to perform IPC calls
const api = {
  // Function to check if an account exists.
  checkAccountExists: (publicKey) => ipcRenderer.invoke('check-account-exists', publicKey),
  // Function to add an account/wallet
  addAccount: (publicKey) => ipcRenderer.invoke('add-account', publicKey),

  // Function to retrieve accounts/wallets
  getAccounts: () => ipcRenderer.invoke('get-accounts'),

  // Function to retrieve a certain account
  getAccountTotalProfit: (publicKey) => ipcRenderer.invoke('get-account-total-profit', publicKey),

  // Function to calculate an account's/wallet's total profit
  sumAndUpdateTotalProfit: (publicKey) =>
    ipcRenderer.invoke('sum-and-update-total-profit', publicKey),

  // Function to retrieve a certain transaction id
  getTransactionId: (tokenId) => ipcRenderer.invoke('get-transaction-id', tokenId),

  // Function to add transactions
  addTransaction: (rows) => ipcRenderer.invoke('add-transaction', rows),

  // Function to retrieve transactions
  getTransactions: (publicKey) => ipcRenderer.invoke('get-transactions', publicKey),

  // Function to add transaction details
  addTransactionDetail: (rows) => ipcRenderer.invoke('add-transaction-detail', rows),

  // Function to retrieve transaction details
  getTransactionDetails: (tokenId) => ipcRenderer.invoke('get-transaction-details', tokenId),

  // Function to check if transaction exists
  checkIfTransactionDetailExists: (rows) =>
    ipcRenderer.invoke('check-if-transaction-detail-exists', rows),

  // Function to update token name and symbol in db
  updateTokenNameSymbol: (tokenId, tokenName, tokenSymbol) =>
    ipcRenderer.invoke('update-token-name-symbol', tokenId, tokenName, tokenSymbol),

  // Function to fetch token metadata
  getAccountTokenName: (tokenId) => ipcRenderer.invoke('get-account-token-name', tokenId),

  // Function to fetches all transactions based on public key
  fetchTransactionData: (pubKey) => ipcRenderer.invoke('fetch-transaction-data', pubKey),

  // Function to retrieve token info from db
  fetchTokenData: (token) => ipcRenderer.invoke('fetch-token-data', token),

  // Function to sort the fetched signature hashes into an array of JSON-RPC request objects
  fetchTransactionDataTwo: (signatures) =>
    ipcRenderer.invoke('fetch-transaction-data-two', signatures),

  // Function to fetch transaction metadata for each signature in the array of JSON-RPC request object
  fetchTransactionDataThree: (batch) => ipcRenderer.invoke('fetch-transaction-data-three', batch),

  // Function to filter out all failed transactions
  fetchTransactionDataFour: (batch) => ipcRenderer.invoke('fetch-transaction-data-four', batch),

  // Function to fetch all transactions prior to a specific transaction
  fetchTransactionDataBefore: (pubKey, transHash) =>
    ipcRenderer.invoke('fetch-transaction-data-before', pubKey, transHash),

  // Function to retrieve transaction hashes
  getTokenTransactionHash: (tokenId) => ipcRenderer.invoke('get-token-transaction-hash', tokenId),

  // Function to fetch one transaction and the metadata
  fetchTransactionDataOne: () => ipcRenderer.invoke('fetch-transaction-data-one'),

  // Function to update how much it cost to purchase a specific token
  updateCostProfit: () => ipcRenderer.invoke('update-cost-profit'),

  // Function to delete a row in the db
  deleteRowsSol: () => ipcRenderer.invoke('delete-rows-sol')
};

// Using contextBridge to expose the defined API object to the renderer process under the global
// variable `window.electron`. This is a secure method recommended by Electron to expose any functionality
// to the renderer process while keeping the Node.js environment isolated.
contextBridge.exposeInMainWorld('electron', {
  checkAccountExists: api.checkAccountExists,
  addAccount: api.addAccount,
  getAccounts: api.getAccounts,
  getAccountTotalProfit: api.getAccountTotalProfit,
  sumAndUpdateTotalProfit: api.sumAndUpdateTotalProfit,
  getTransactionId: api.getTransactionId,
  addTransaction: api.addTransaction,
  getTransactions: api.getTransactions,
  addTransactionDetail: api.addTransactionDetail,
  getTransactionDetails: api.getTransactionDetails,
  checkIfTransactionDetailExists: api.checkIfTransactionDetailExists,
  updateTokenNameSymbol: api.updateTokenNameSymbol,
  getAccountTokenName: api.getAccountTokenName,
  fetchTransactionData: api.fetchTransactionData,
  fetchTokenData: api.fetchTokenData,
  fetchTransactionDataTwo: api.fetchTransactionDataTwo,
  fetchTransactionDataThree: api.fetchTransactionDataThree,
  fetchTransactionDataFour: api.fetchTransactionDataFour,
  fetchTransactionDataBefore: api.fetchTransactionDataBefore,
  getTokenTransactionHash: api.getTokenTransactionHash,
  fetchTransactionDataOne: api.fetchTransactionDataOne,
  updateCostProfit: api.updateCostProfit,
  deleteRowsSol: api.deleteRowsSol
});
