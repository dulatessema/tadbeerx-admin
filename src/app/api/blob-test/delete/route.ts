import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Blob test delete API called');
    
    const { url } = await request.json();

    if (!url) {
      console.error('❌ No URL provided for deletion');
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    console.log('🔗 Deleting URL:', url);

    // Forward to the API server
    const apiResponse = await fetch('https://tadbeerx-api.vercel.app/api/blob-test/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    console.log('📨 API response status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ API error:', errorText);
      return NextResponse.json(
        { error: `API error: ${apiResponse.status} - ${errorText}` },
        { status: apiResponse.status }
      );
    }

    const result = await apiResponse.json();
    console.log('✅ Delete successful:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 Delete route error:', error);
    return NextResponse.json(
      { error: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}