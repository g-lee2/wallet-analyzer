import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function AccountDetails() {
  let {publicKey} = useParams();
  const navigate = useNavigate();
  const [accountTotalProfit, setAccountTotalProfit] = useState();
  const [ticker, setTicker] = useState('');
  const [cost, setCost] = useState(0);
  const [profit, setProfit] = useState(0);
  const [transactions, setTransactions] = useState([]);

  // Function to fetch an account's totalProfit from the database
  const fetchAccountInfo = async () => {
    const fetchedAccount = await window.electron.getAccountTotalProfit(publicKey);  // Call the getAccountTotalProfit function exposed by preload.js
    setAccountTotalProfit(fetchedAccount);  // Update the accounts state with the fetched account's total profit
  };

  const fetchTransactions = async () => {
    const fetchedTransactions = await window.electron.getTransactions(publicKey);  // Call the getTransactions function exposed by preload.js
    setTransactions(fetchedTransactions);  // Update the transaction state with the fetched transactions
  };

  // useEffect to fetch account's totalProfit and transactions when the component mounts
  useEffect(() => {
    fetchAccountInfo(); 
    fetchTransactions(); 
  }, []);

  // Function to handle adding a transaction when the button is clicked
  const handleAddTransaction = async () => {
    await window.electron.addTransaction(publicKey, ticker, cost, profit);
    setTicker("");
    setCost(0);
    setProfit(0);
    await fetchTransactions(publicKey);
  };

  const handleOnClick = (transactionId) => {
    navigate(`/account-details/${publicKey}/transaction/${transactionId}`);
  }

  return (
    <>
      <span>Account Details page</span>
      <p>{publicKey} - Total Profit: {accountTotalProfit?.totalProfit ?? 'Loading...'} SOL</p>
      <span><a href="/">back</a></span>
      <br />
      <input
        type="text"
        value={ticker}  
        onChange={(e) => setTicker(e.target.value)}  
        placeholder="Enter Ticker"  
      />
      <input
        type="number"
        value={cost}  
        onChange={(e) => setCost(e.target.value)}  
        placeholder="Enter Cost"  
      />
      <input
        type="number"
        value={profit}  
        onChange={(e) => setProfit(e.target.value)}  
        placeholder="Enter Profit"  
      />
      <button onClick={handleAddTransaction}>Add Transaction</button>  
      <ul>
          {transactions.map(transaction => ( 
            <button 
              key={transaction.transactionId} 
              onClick={() => handleOnClick(transaction.transactionId)}
            >
              {transaction.ticker} - Cost: {transaction.cost} - Profit: {transaction.profit} 
            </button>
          ))}
        </ul>
    </>
  );
}
