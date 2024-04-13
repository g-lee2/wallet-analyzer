import React, { useState, useEffect } from 'react';

function Account() {
  // State to store the input value for public key
  const [publicKey, setPublicKey] = useState('');
  // State to store the list of accounts fetched from the database
  const [accounts, setAccounts] = useState([]);

  // Function to handle adding a user when the button is clicked
  const handleAddAccount = async () => {
    try {
      const accountExists = await window.electron.checkAccountExists(publicKey);
      if (!accountExists) {
        // Call the addAccount function exposed by preload.js
          await window.electron.addAccount(publicKey);
      } else {
          console.log("Account already exists.");
      }
  } catch (error) {
      console.error("Error in IPC call:", error);
  }
    setPublicKey("");  // Reset the input field
    await fetchAccounts();  // Refetch the list of accounts to update the UI
  };

  // Function to fetch all accounts from the database
  const fetchAccounts = async () => {
    const fetchedAccounts = await window.electron.getAccounts();  // Call the getAccounts function exposed by preload.js
    setAccounts(fetchedAccounts);  // Update the accounts state with the fetched accounts
  };

  // useEffect to fetch accounts when the component mounts
  useEffect(() => {
    fetchAccounts();  // Fetch accounts initially and refresh list each time component is mounted
  }, []);

  return (
    <div>
      <input
        type="text"
        value={publicKey}  // Bind input value to publicKey state
        onChange={(e) => setPublicKey(e.target.value)}  // Update state when input changes
        placeholder="Enter Public Key"  // Placeholder for the input
      />
      {/* Button to trigger addUser */}
      <button onClick={handleAddAccount}>Search Account</button>  
      <div>
        {/* Section heading for user list */}
        <h2>Account List</h2>  
        <ul>
          {accounts.map(account => (  // Map over the accounts array to render list items
            <button key={account.id} onClick={() => setPublicKey(account.publicKey)}>{account.publicKey} - Total: {account.totalProfit} </button>  // Display public key and total profit
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Account;  // Export the Account component
