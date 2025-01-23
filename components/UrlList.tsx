'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Link,
  CircularProgress,
  Box,
  Alert,
} from '@mui/material';
import { ContentCopy, Launch, Edit } from '@mui/icons-material';
import EditUrlDialog from './EditUrlDialog';

interface Url {
  _id: string;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: string;
}

export default function UrlList() {
  const [urls, setUrls] = useState<Url[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUrl, setEditingUrl] = useState<Url | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const res = await fetch('/api/urls', {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch URLs');
      }

      const data = await res.json();
      setUrls(data);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Failed to fetch URLs');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (shortCode: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Original URL</TableCell>
              <TableCell>Short URL</TableCell>
              <TableCell align="center">Clicks</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {urls.map((url) => (
              <TableRow key={url._id} hover>
                <TableCell>
                  <Link
                    href={url.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      maxWidth: 300,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {url.originalUrl}
                  </Link>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Link
                      href={`/${url.shortCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {url.shortCode}
                    </Link>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(url.shortCode)}
                      title="Copy short URL"
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="center">{url.clicks}</TableCell>
                <TableCell>
                  {new Date(url.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={() => setEditingUrl(url)}
                    title="Edit URL"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    href={`/${url.shortCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open short URL"
                  >
                    <Launch />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editingUrl && (
        <EditUrlDialog
          open={true}
          onClose={() => setEditingUrl(null)}
          url={editingUrl}
          onUpdate={fetchUrls}
        />
      )}
    </>
  );
}
