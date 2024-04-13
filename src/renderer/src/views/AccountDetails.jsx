import { useState, useEffect } from "react";

export default function AccountDetails({accountPathKey}) {
  const [pathAgain, setPathAgain] = useState(accountPathKey);

  useEffect(() => {
    setPathAgain(accountPathKey);  // Update local state to force re-render
    console.log("Effect runs: New ID set", accountPathKey);
}, [accountPathKey]);

  return (
    <>
      <span>Account Details page</span>
      <span>{pathAgain}</span>
    </>
  );
}