import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function TransactionDetails() {
  let {tokenId} = useParams();
  const [transactionDetailList, setTransactionDetailList] = useState([]);

  const fetchTransactionDetailList = async () => {
    const fetchedTransactionDetails = await window.electron.getTransactionDetails(tokenId);  // Call the getTransactionDetails function exposed by preload.js
    setTransactionDetailList(fetchedTransactionDetails);  // Update the transaction state with the fetched transaction details in a list form
  };

  // useEffect to fetch transaction details when the component mounts
  useEffect(() => {
    fetchTransactionDetailList(tokenId); 
  }, []);

  return (
    <>
      <span>Hello this is the Transaction Details Page</span>
      <span>{tokenId}</span>
      <span><a href={`../`}>back</a></span>
      <ul>
        {transactionDetailList.map(transactionDetail => ( 
          <button 
            key={transactionDetail.transactionDetailId} 
          >
            Transaction Hash: {transactionDetail.transactionHash} From: {transactionDetail.fromAmount} {transactionDetail.fromToken} - To: {transactionDetail.toAmount} {transactionDetail.toToken} - Time: {transactionDetail.time}
          </button>
        ))}
      </ul>
    </>
  )
}
