import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import Url from '@/models/Url';

export async function GET(
  request: Request,
  { params }: { params: { shortCode: string } }
) {
  try {
    await connectDB();
    const url = await Url.findOne({ shortCode: params.shortCode });

    if (!url) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Increment clicks
    url.clicks += 1;
    await url.save();

    return NextResponse.redirect(url.originalUrl);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
