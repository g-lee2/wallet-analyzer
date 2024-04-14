import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Account() {
  const navigate = useNavigate();
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
          navigate(`/account-details/${publicKey}`);
      } else {
          console.log("Account already exists.");
          navigate(`/account-details/${publicKey}`);
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
    fetchAccounts();  
  }, []);

  return (
    <div>
      <input
        type="text"
        value={publicKey}
        onChange={(e) => setPublicKey(e.target.value)}
        placeholder="Enter Public Key"
      />
      <button onClick={handleAddAccount}>Search Account</button>  
      <div>
        <h2>Account List</h2>  
        <ul>
          {accounts.map(account => (  
            <button key={account.id} onClick={() => setPublicKey(account.publicKey)}>{account.publicKey} - Total: {account.totalProfit} </button> 
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Account;
