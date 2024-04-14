import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import sqlite3 from 'sqlite3';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

// Define the path to the SQLite database
const dbPath = join(__dirname, '../../resources/database.sqlite');

// Connect to the SQLite Database, and create it if it doesn't already exist
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to the database.');
    // Create an account table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS account (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      publicKey TEXT UNIQUE,
      totalProfit INTEGER DEFAULT 0
    )`);
    // Create an account_transactions table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS account_transactions (
      transactionId INTEGER PRIMARY KEY AUTOINCREMENT, 
      publicKey TEXT,
      ticker TEXT,
      cost DECIMAL,
      profit DECIMAL,
      FOREIGN KEY (publicKey) REFERENCES account (publicKey)
    )`);
    // Create the 'transaction_detail' table if it doesn't already exist
    db.run(`CREATE TABLE IF NOT EXISTS transaction_detail (
      transactionDetailId INTEGER PRIMARY KEY AUTOINCREMENT,
      transactionId INTEGER, 
      transactionHash TEXT,
      transactionDetail TEXT,
      time DATETIME,
      tip DECIMAL,
      FOREIGN KEY (transactionId) REFERENCES account_transactions (transactionId)
    )`);
  }
});

// Handle IPC to check if an account exists
ipcMain.handle('check-account-exists', (event, publicKey) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT 1 FROM account WHERE publicKey = ? LIMIT 1`, [publicKey], function (err, row) {
      if (err) {
        reject(err);
      } else {
        resolve(row ? true : false); // returns true if account exists, otherwise false
      }
    });
  });
});

// Handle IPC call for adding an account
ipcMain.handle('add-account', async (event, publicKey) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO account (publicKey) VALUES (?)`, [publicKey], function (err) {
      if (err) {
        console.error('Failed to add account', err);
        reject(new Error('Error adding account'));
      } else {
        console.log(`A row has been inserted with rowid ${this.lastID}`);
        resolve(`Account added with ID ${this.lastID}`);
      }
    });
  });
});

// Handle IPC call for retrieving all accounts
ipcMain.handle('get-accounts', async (event) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, publicKey, totalProfit FROM account', [], (err, rows) => {
      if (err) {
        console.error('Failed to retrieve accounts', err);
        reject(new Error('Failed to retrieve accounts'));
      } else {
        resolve(rows);
      }
    });
  });
});

// Handle IPC call for retrieving a certain account's total profit
ipcMain.handle('get-account-total-profit', async (event, publicKey) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT totalProfit FROM account WHERE publicKey = ?', [publicKey], (err, row) => {
      if (err) {
        reject(new Error('Failed to retrieve account from the database: ' + err.message));
      } else {
        resolve(row);
      }
    });
  });
});

// Handle IPC call for adding a transaction
ipcMain.handle('add-transaction', async (event, publicKey, ticker, cost, profit) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO account_transactions (publicKey, ticker, cost, profit) VALUES (?, ?, ?, ?)`,
      [publicKey, ticker, cost, profit],
      function (err) {
        if (err) {
          console.error('Failed to add transaction', err);
          reject(new Error('Error adding transaction'));
        } else {
          console.log(`A row has been inserted with rowid ${this.lastID}`);
          resolve(`Transaction added with ID ${this.lastID}`);
        }
      }
    );
  });
});

// Handle IPC call for retrieving all transactions
ipcMain.handle('get-transactions', async (event, publicKey) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM account_transactions WHERE publicKey = ?`, [publicKey], (err, rows) => {
      if (err) {
        console.error('Failed to retrieve transactions', err);
        reject(new Error('Failed to retrieve transactions'));
      } else {
        resolve(rows);
      }
    });
  });
});

// Handle IPC call for adding transaction details
ipcMain.handle(
  'add-transaction-detail',
  async (event, transactionId, transactionHash, transactionDetail, time, tip) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO transaction_detail (transactionId, transactionHash, transactionDetail, time, tip) VALUES (?, ?, ?, ?, ?)`,
        [transactionId, transactionHash, transactionDetail, time, tip],
        function (err) {
          if (err) {
            console.error('Failed to add transaction detail', err);
            reject(new Error('Error adding transaction detail'));
          } else {
            console.log(`A row has been inserted with rowid ${this.lastID}`);
            resolve(`Transaction detail added with ID ${this.lastID}`);
          }
        }
      );
    });
  }
);

// Handle IPC call for retrieving all transaction details
ipcMain.handle('get-transaction-details', async (event, transactionId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM transaction_detail WHERE transactionId = ?`,
      [transactionId],
      (err, rows) => {
        if (err) {
          console.error('Failed to retrieve transaction details', err);
          reject(new Error('Failed to retrieve transaction details'));
        } else {
          resolve(rows);
        }
      }
    );
  });
});

// Function to create the main window of the Electron app
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: process.platform === 'linux' ? join(__dirname, '../../resources/icon.png') : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  // Show window when it is ready to be displayed
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external URLs by opening them in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' }; // Prevent new window creation
  });

  // Load the correct URL in the window based on development or production environment
  const rendererUrl = is.dev
    ? process.env.ELECTRON_RENDERER_URL
    : join(__dirname, '../renderer/index.html');
  mainWindow.loadURL(rendererUrl);
}

// App readiness to create window
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.yourdomain.yourapp');
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Handle all windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // If not on macOS
    db.close(() => console.log('Database connection closed')); // Close the database connection properly
    app.quit();
  }
});
