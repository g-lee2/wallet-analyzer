import React, { useState, useEffect } from 'react';

function Account() {
  // State to store the input value for user ID
  const [userId, setUserId] = useState('');
  // State to store the list of users fetched from the database
  const [users, setUsers] = useState([]);

  // Function to handle adding a user when the button is clicked
  const handleAddUser = async () => {
    await window.electron.addUser(userId);  // Call the addUser function exposed by preload.js
    setUserId("");  // Reset the input field
    await fetchUsers();  // Refetch the list of users to update the UI
  };

  // Function to fetch all users from the database
  const fetchUsers = async () => {
    const fetchedUsers = await window.electron.getUsers();  // Call the getUsers function exposed by preload.js
    setUsers(fetchedUsers);  // Update the users state with the fetched users
  };

  // useEffect to fetch users when the component mounts
  useEffect(() => {
    fetchUsers();  // Fetch users initially and refresh list each time component is mounted
  }, []);

  return (
    <div>
      <input
        type="text"
        value={userId}  // Bind input value to userId state
        onChange={(e) => setUserId(e.target.value)}  // Update state when input changes
        placeholder="Enter User ID"  // Placeholder for the input
      />
      {/* Button to trigger addUser */}
      <button onClick={handleAddUser}>Add User</button>  
      <div>
        {/* Section heading for user list */}
        <h2>User List</h2>  
        <ul>
          {users.map(user => (  // Map over the users array to render list items
            <li key={user.id}>{user.userId} - Total: {user.total}</li>  // Display user ID and total
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Account;  // Export the Account component
