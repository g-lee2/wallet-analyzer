import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; 
import data from './data.json';
import tokenData from './getAsset.json';

export default function AccountDetails() {
  let {publicKey} = useParams();
  const navigate = useNavigate();
  const [accountTotalProfit, setAccountTotalProfit] = useState();
  const [transactions, setTransactions] = useState([]);
  const [transactionUpdateAfterApi, setTransactionUpdateAfterApi] = useState([]);
  const [preTransactionDetailUpdate, setPreTransactionDetailUpdate] = useState([]);
  const [transactionDetailUpdate, setTransactionDetailUpdate] = useState([]);
  const [transactionsFromApi, setTransactionsFromApi] = useState([]);
  const [allAddedToDb, setAllAddedToDb] = useState();

  function changeToLocalDateTime(timestamp) {
    // Convert to milliseconds
    const date = new Date(timestamp * 1000);
  
    // Options for formatting the date and time
    const options = {
      timeZone: 'America/Los_Angeles', // PST timezone
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // 12-hour format
    };
  
    // Format the date
    const readableDate = new Intl.DateTimeFormat('en-US', options).format(date);
  
    return readableDate;
  }
  
  function changeToSol (numb) {
    const divideBy = 1000000000;
    const result = numb / divideBy;
    return result;
  }

  // Function to fetch an account's totalProfit from the database
  const fetchAccountInfo = async () => {
    await window.electron.sumAndUpdateTotalProfit(publicKey);
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
  }, [transactionDetailUpdate]);

  // Function to handle saving transaction as an array of objects in state when the button is clicked
  const handleGetTransactions = async () => {
    const filteredItems = await data.map(({ timestamp, signature, tokenTransfers, accountData }) => ({
      time: changeToLocalDateTime(timestamp), 
      transactionHash: signature,
      tokenTransferred: tokenTransfers.map(({ tokenAmount }) => tokenAmount)[0],
      tokenId: tokenTransfers.map(({ mint }) => mint)[0],
      accountBalanceChange: changeToSol(accountData.filter(account => account.account === publicKey).map(account => account.nativeBalanceChange)[0])
    }));
    await setTransactionsFromApi([...transactionsFromApi, ...filteredItems]);
  };

  const handleGetTokenName = async (tokenId) => {
    const tokenName = tokenData.content.metadata.name;
    const tokensymbol = tokenData.content.metadata.symbol;
    await window.electron.updateTokenNameSymbol(tokenId, tokenName, tokensymbol);
  };

  const prepareForDb = (transaction) => {
    if (!transaction) {
      return;
    }
    const newTransaction = {
      tokenId: transaction.tokenId,
      transactionHash: transaction.transactionHash,
      fromToken: transaction.accountBalanceChange < 0 ? 'sol' : transaction.tokenId,
      fromAmount: transaction.accountBalanceChange < 0 ? transaction.accountBalanceChange : transaction.tokenTransferred,
      toToken: transaction.accountBalanceChange < 0 ? transaction.tokenId : 'sol', 
      toAmount: transaction.accountBalanceChange < 0 ? transaction.tokenTransferred : transaction.accountBalanceChange,
      time: transaction.time
    }
    return newTransaction;
  }

  const prepareTransactionDetailForDb = (transaction) => {
    if (!transaction) {
      return;
    } 
    const newTransaction = {
      publicKey: publicKey,
      tokenId: transaction.tokenId,
      cost: transaction.fromAmount < 0 ? transaction.fromAmount : 0,
      profit: transaction.fromAmount > 0 ? transaction.toAmount : 0,
    }
    return newTransaction;
  }

  useEffect(() =>{
    const response = transactionsFromApi.map(prepareForDb);
    setTransactionUpdateAfterApi(response);
  }, [transactionsFromApi]);

  useEffect(() => {
    window.electron.checkIfTransactionDetailExists(transactionUpdateAfterApi).then((notFoundRows) => {
      setPreTransactionDetailUpdate(notFoundRows);
      console.log(notFoundRows);
    });
  }, [transactionUpdateAfterApi]);

  useEffect(() => {
    if (preTransactionDetailUpdate.length > 0) {
      window.electron.addTransactionDetail(preTransactionDetailUpdate);
      const responseTwo = preTransactionDetailUpdate.map(prepareTransactionDetailForDb);
      setTransactionDetailUpdate(responseTwo);
    }
  }, [preTransactionDetailUpdate]);

  useEffect(() => {
    window.electron.addTransaction(transactionDetailUpdate);
    fetchAccountInfo(); 
    fetchTransactions();
  }, [transactionDetailUpdate]);

  const handleOnClick = (transactionId) => {
    navigate(`/account-details/${publicKey}/transaction/${transactionId}`);
  }

  return (
    <>
      <span>Account Details page</span>
      <p>{publicKey} - Total Profit: {accountTotalProfit?.totalProfit ?? 0} SOL</p>
      <span><a href="/">back</a></span>
      <br />
      <button onClick={handleGetTransactions}>Get Transactions</button>  
      <ul>
          {transactions.map(transaction => ( 
            <>
              <button 
                key={transaction.transactionId} 
                onClick={() => handleOnClick(transaction.tokenId)}
              >
                {transaction.tokenId} - Cost: {transaction.cost} - Profit: {transaction.profit} 
              </button>
              <button onClick={() => handleGetTokenName(transaction.tokenId)}>Get Token Name</button> 
            </> 
          ))}
        </ul>
    </>
  );
}
