import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Url from '@/models/Url';
import { authOptions } from '@/lib/auth';

function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { originalUrl } = await req.json();
    if (!originalUrl) {
      return NextResponse.json({ error: 'Original URL is required' }, { status: 400 });
    }

    await connectDB();
    
    let shortCode = generateShortCode();
    while (await Url.findOne({ shortCode })) {
      shortCode = generateShortCode();
    }

    const url = await Url.create({
      originalUrl,
      shortCode,
      createdBy: session.user.id,
    });

    return NextResponse.json(url);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const urls = await Url.find({ createdBy: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(urls);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, originalUrl } = await req.json();
    
    if (!id || !originalUrl) {
      return NextResponse.json({ error: 'ID and Original URL are required' }, { status: 400 });
    }

    await connectDB();
    
    const url = await Url.findOne({ _id: id, createdBy: session.user.id });
    
    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    url.originalUrl = originalUrl;
    await url.save();

    return NextResponse.json(url);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
