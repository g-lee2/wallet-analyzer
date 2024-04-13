import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div>
      <ul>
        <li>
          <a href='/account'>Account</a>
        </li>
        <li>
          <a href='/account-details'>Account Details</a>
        </li>
      </ul>
      <Outlet />
    </div>
  );
}