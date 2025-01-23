'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';

export default function CreateUrlForm() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalUrl }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error(data.error || 'Failed to create short URL');
      }

      setOriginalUrl('');
      setSuccess(true);
      router.refresh();
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Failed to create short URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <TextField
        fullWidth
        type="url"
        label="Enter URL to shorten"
        variant="outlined"
        value={originalUrl}
        onChange={(e) => setOriginalUrl(e.target.value)}
        required
        disabled={loading}
        sx={{ mb: 2 }}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={loading}
        fullWidth
        sx={{ height: 48 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Create Short URL'}
      </Button>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Short URL created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
