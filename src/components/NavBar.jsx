import { AppBar, Button, Box, Toolbar, Typography } from '@mui/material/';
import ToysTwoToneIcon from '@mui/icons-material/ToysTwoTone';
import AccountCircleSharpIcon from '@mui/icons-material/AccountCircleSharp';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DropdownMenu from './DropdownMenu';
import './NavBar.css';


function NavBar() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('userData');
    console.log("Logged in user from session storage:", loggedInUser);
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
      setIsLoggedIn(true);
    } else {
      setUser(null); // Set user to null if there's no user in sessionStorage
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AppBar position="static" style={{ width: '100vw', margin: 0 }}>
      <Toolbar>
        <Box mr={4}>
          <HomeLink />
        </Box>
        <Box mr={2}>
          <InventoryLink />
        </Box>
        <Box mr={2}>
          <WishlistLink />
        </Box>
        <Box flexGrow={1}>
          <AboutUsLink />
        </Box>
        {user ? (
          <>
            <Typography variant="h6" color="white">
              {`Welcome, ${user.firstName}`}
            </Typography>
            <Box>
              <DropdownMenu anchor={<AccountCircleSharpIcon fontSize='large'/>} loginStatus={isLoggedIn} handleLogout={handleLogout} user={user} setUser={setUser}/>
            </Box>
          </>
        ) : (
          <>
            <Box>
              <DropdownMenu anchor={<AccountCircleSharpIcon fontSize='large'/>} loginStatus={isLoggedIn} handleLogout={handleLogout} user={user} setUser={setUser}/>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

function HomeLink() {
  return (
    <Link to={`/`} className='nav-link'>
      <Typography variant="h7" sx={{ fontFamily: 'Figtree, Roboto, sans-serif' }}>
        Home
      </Typography>
    </Link>
  );
}

function InventoryLink() {
  return (
    <Link to={`/inventory`} className='nav-link'>
      <Typography variant="h7" sx={{ fontFamily: 'Figtree, Roboto, sans-serif' }}>
        Inventory
      </Typography>
    </Link>
  );
}

function AboutUsLink() {
  return (
    <Link to={`/aboutUs`} className='nav-link'>
      <Typography variant="h7" sx={{ fontFamily: 'Figtree, Roboto, sans-serif' }}>
        About Us
      </Typography>
    </Link>
  );
}

function WishlistLink() {
  return (
    <Link to={`/wishlist`} className='nav-link'>
      <Typography variant="h7" sx={{ fontFamily: 'Figtree, Roboto, sans-serif' }}>
        Wishlist
      </Typography>
    </Link>
  );
}

// function RegisterLink() {
//   return (
//     <Link to={`/register`} className='nav-link'>
//       <Typography variant="h7" sx={{ fontFamily: 'Figtree, Roboto, sans-serif' }}>
//         Register
//       </Typography>
//     </Link>
//   );
// }

function AdminPageLink() {
  return (
    <Link to={`/adminPage`} className='nav-link'>
      <Typography variant="h7" sx={{ fontFamily: 'Figtree, Roboto, sans-serif' }}>
        Admin Page
      </Typography>
    </Link>
  );
}

export default NavBar;