'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

interface TelegramUser {
  _id: string;
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  createdAt: string;
  urlsCreated: number;
}

export default function PremiumUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/telegram/users', {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch users');
      }

      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const togglePremium = async (telegramId: string, currentStatus: boolean) => {
    setUpdating(telegramId);
    try {
      const res = await fetch('/api/telegram/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId,
          isPremium: !currentStatus,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setUsers(users.map(user => 
        user.telegramId === telegramId 
          ? { ...user, isPremium: !currentStatus }
          : user
      ));
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setUpdating(null);
    }
  };

  if (!session?.user) {
    router.push('/auth/login');
    return null;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Premium Users Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="center">URLs Created</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="center">Premium Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>{user.telegramId}</TableCell>
                <TableCell>
                  {user.username ? `@${user.username}` : 'No username'}
                </TableCell>
                <TableCell>
                  {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                </TableCell>
                <TableCell align="center">{user.urlsCreated}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={user.isPremium}
                    onChange={() => togglePremium(user.telegramId, user.isPremium)}
                    disabled={updating === user.telegramId}
                    color="primary"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {users.length === 0 && !error && (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            No Telegram users found. Users will appear here when they start using the bot.
          </Typography>
        </Box>
      )}
    </Container>
  );
}
