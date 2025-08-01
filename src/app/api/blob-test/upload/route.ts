import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Blob test upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('❌ No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📋 File info:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Forward to the API server
    const apiFormData = new FormData();
    apiFormData.append('file', file);

    const apiResponse = await fetch('https://tadbeerx-api.vercel.app/api/blob-test/upload', {
      method: 'POST',
      body: apiFormData,
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
    console.log('✅ Upload successful:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 Upload route error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}