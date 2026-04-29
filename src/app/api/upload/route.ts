import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Crear FormData para Cloudinary
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'zaiko_pos');
    uploadData.append('cloud_name', 'dwunkgitl');

    // Subir a Cloudinary
    const response = await fetch('https://api.cloudinary.com/v1_1/dwunkgitl/image/upload', {
      method: 'POST',
      body: uploadData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudinary error:', data);
      return NextResponse.json({ 
        error: data.error?.message || 'Error uploading to Cloudinary' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      url: data.secure_url,
      public_id: data.public_id 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}