import { NextResponse } from 'next/server';
import promoConfig from '../../../data/promo-config.json';

export async function GET() {
  return NextResponse.json(promoConfig, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
