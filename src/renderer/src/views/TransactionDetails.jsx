import { useParams } from "react-router-dom";

export default function TransactionDetails() {
  let {transactionId} = useParams();
  return (
    <>
      <span>Hello this is the Transaction Details Page</span>
      <span>{transactionId}</span>
      <span><a href={`../`}>back</a></span>
    </>
  )
}