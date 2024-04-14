import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function AccountDetails() {
  let {publicKey} = useParams();
  const [accountTotalProfit, setAccountTotalProfit] = useState();

  // Function to fetch an account's totalProfit from the database
  const fetchAccountInfo = async () => {
    const fetchedAccount = await window.electron.getAccountTotalProfit(publicKey);  // Call the getAccountTotalProfit function exposed by preload.js
    setAccountTotalProfit(fetchedAccount);  // Update the accounts state with the fetched account's total profit
  };

  // useEffect to fetch account's totalProfit when the component mounts
  useEffect(() => {
    fetchAccountInfo();  // Fetch accounts initially and refresh list each time component is mounted
  }, []);

  return (
    <>
      <span>Account Details page</span>
      <p>{publicKey} - Total Profit: {accountTotalProfit?.totalProfit ?? 'Loading...'} SOL</p>
      <span><a href="/">back</a></span>
    </>
  );
}
