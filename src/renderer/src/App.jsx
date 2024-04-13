import Account from "./views/Account";
import AccountDetails from "./views/AccountDetails";
import Layout from "./views/Layout";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  // const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Router>
				<Routes>
					<Route path="/" element={<Layout />}>
						<Route
              path="/account"
							element={ <Account />}
						/>
						<Route
							path="/account-details"
							element={<AccountDetails />}
						/>
					</Route>
				</Routes>
			</Router>
    </>
  )
}

export default App;


