import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json', {
      headers: {
        'User-Agent': 'ZefyrioApp/1.0',
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // Cache the response for 1 hour
    });
    
    if (!res.ok) {
      throw new Error(`NOAA API returned ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching NOAA Kp Forecast:', error);
    return NextResponse.json({ error: 'Failed to fetch KP forecast' }, { status: 500 });
  }
}
