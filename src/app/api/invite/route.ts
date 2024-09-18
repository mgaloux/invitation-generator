import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import sharp from 'sharp';

// POST request handler
export async function POST(request: Request) {
  const formData = await request.formData();
  const imageFile = formData.get('templateImage') as File;
  const guestsString = formData.get('guests') as string;
  const font = formData.get('font') as string;
  const fontSize = formData.get('fontSize') as string;
  const color = formData.get('color') as string;
  const letterSpacing = formData.get('letterSpacing') as string; // New parameter for letter spacing
  
  if (!imageFile || !guestsString) {
    return NextResponse.json({ error: 'Missing image or guests' }, { status: 400 });
  }

  const guests = JSON.parse(guestsString); // Parse the guests list
  const zip = new JSZip();

  // Read the image file
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

  // For each guest, create an image with their name on it
  for (const guest of guests) {
    const guestImageBuffer = await addGuestNameToImage(imageBuffer, guest, font, fontSize, color, letterSpacing);
    zip.file(`${guest}.png`, guestImageBuffer); // Add the modified image to the ZIP
  }

  // Generate the ZIP file
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="invitations.zip"',
    },
  });
}

// Function to add guest name to the image
async function addGuestNameToImage(imageBuffer: Buffer, guestName: string, font: string, fontSize: string, color: string, letterSpacing: string): Promise<Buffer> {
  const image = sharp(imageBuffer);

  // Get the image metadata to determine size for positioning text
  const metadata = await image.metadata();
  const imageWidth = metadata.width ?? 800; // Fallback to 800 if metadata is missing
  const imageHeight = metadata.height ?? 600; // Fallback to 600 if metadata is missing

  // Set up text rendering with Sharp's overlayWith feature
  const svgText = `
    <svg width="${imageWidth}" height="${imageHeight}">
      <text x="50%" y="50%" font-size="${fontSize}" fill="${color}" font-family="${font}" dy=".3em" text-anchor="middle" letter-spacing="${letterSpacing}">
        ${guestName}
      </text>
    </svg>
  `;

  // Combine the image and the text
  return await image
    .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
