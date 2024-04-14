import { useParams } from "react-router-dom";

export default function AccountDetails() {
  let {publicKey} = useParams();
  return (
    <>
      <span>Account Details page</span>
      <p>{publicKey}</p>
      <span><a href="/">back</a></span>
    </>
  );
}