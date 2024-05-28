import Account from "./views/Account";
import AccountDetails from "./views/AccountDetails";
import TransactionDetails from "./views/TransactionDetails";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <>
      <Router>
				<Routes>
					<Route path="/" exact element={<Account />} />
					<Route path="/account-details/:publicKey" element={<AccountDetails />} />
					<Route path="/account-details/:publicKey/transaction/:tokenId" element={<TransactionDetails />} />
				</Routes>
			</Router>
    </>
  )
}

export default App;
