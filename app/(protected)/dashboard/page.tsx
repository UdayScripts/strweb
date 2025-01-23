'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { AccountCircle, Settings, People, Link as LinkIcon } from '@mui/icons-material';
import CreateUrlForm from '@/components/CreateUrlForm';
import UrlList from '@/components/UrlList';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!session?.user) {
    router.push('/auth/login');
    return null;
  }

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    handleClose();
    router.push('/settings');
  };

  const handlePremiumUsers = () => {
    handleClose();
    router.push('/premium-users');
  };

  const handleLogout = async () => {
    handleClose();
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            URL Shortener
          </Typography>
          <div>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handlePremiumUsers}>
                <People sx={{ mr: 1 }} />
                Premium Users
              </MenuItem>
              <MenuItem onClick={handleSettings}>
                <Settings sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Short URL
        </Typography>
        <CreateUrlForm />

        <Typography variant="h4" component="h2" sx={{ mt: 6, mb: 3 }}>
          Your URLs
        </Typography>
        <UrlList />
      </Container>
    </Box>
  );
}
