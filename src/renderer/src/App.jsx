import Account from "./views/Account";
import AccountDetails from "./views/AccountDetails";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <>
      <Router>
				<Routes>
					<Route path="/" exact element={<Account />} />
					<Route path="/account-details/:accountId" element={<AccountDetails />} />
					{/* <Route path="/account-details/:accountId/transaction/:transactionId" element={<AccountDetails />} /> */}
				</Routes>
			</Router>
    </>
  )
}

export default App;


