import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function TransactionDetails() {
  let {transactionId} = useParams();
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionDetail, setTransactionDetail] = useState('');
  const [time, setTime] = useState('');
  const [tip, setTip] = useState(0);
  const [transactionDetailList, setTransactionDetailList] = useState([]);

  const fetchTransactionDetailList = async () => {
    const fetchedTransactionDetails = await window.electron.getTransactionDetails(transactionId);  // Call the getTransactionDetails function exposed by preload.js
    setTransactionDetailList(fetchedTransactionDetails);  // Update the transaction state with the fetched transaction details in a list form
  };

  // useEffect to fetch transaction details when the component mounts
  useEffect(() => {
    fetchTransactionDetailList(transactionId); 
  }, []);

  // Function to handle adding transaction details when the button is clicked
  const handleAddTransactionDetail = async () => {
    await window.electron.addTransactionDetail(transactionId, transactionHash, transactionDetail, time, tip);
    setTransactionHash("");
    setTransactionDetail("");
    setTime("");
    setTip("")
    await fetchTransactionDetailList(transactionId);
  };

  return (
    <>
      <span>Hello this is the Transaction Details Page</span>
      <span>{transactionId}</span>
      <span><a href={`../`}>back</a></span>
      <input
        type="text"
        value={transactionHash}  
        onChange={(e) => setTransactionHash(e.target.value)}  
        placeholder="Enter Transaction Hash"  
      />
      <input
        type="text"
        value={transactionDetail}  
        onChange={(e) => setTransactionDetail(e.target.value)}  
        placeholder="Enter Transaction Detail"  
      />
      <input
        type="text"
        value={time}  
        onChange={(e) => setTime(e.target.value)}  
        placeholder="Enter Time"  
      />
      <input
        type="number"
        value={tip}  
        onChange={(e) => setTip(e.target.value)}  
        placeholder="Enter Tip"  
      />
      <button onClick={handleAddTransactionDetail}>Add Transaction Detail</button>
      <ul>
        {transactionDetailList.map(transactionDetail => ( 
          <button 
            key={transactionDetail.transactionDetailId} 
          >
            {transactionDetail.setTransactionHash} - Detail: {transactionDetail.transactionDetail} - Time: {transactionDetail.time} - Tip: {transactionDetail.tip}
          </button>
        ))}
      </ul>
    </>
  )
}