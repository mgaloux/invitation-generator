import { NextResponse } from "next/server";
import JSZip from "jszip";
import sharp from "sharp";
import { registerFont, createCanvas, CanvasRenderingContext2D } from "canvas";

// POST request handler
export async function POST(request: Request) {
  const formData = await request.formData();
  const imageFile = formData.get("templateImage") as File;
  const guestsString = formData.get("guests") as string;
  const font = formData.get("font") as string;
  const fontSize = formData.get("fontSize") as string;
  const color = formData.get("color") as string;
  const letterSpacing = formData.get("letterSpacing") as string; // New parameter for letter spacing

  if (!imageFile || !guestsString) {
    return NextResponse.json(
      { error: "Missing image or guests" },
      { status: 400 },
    );
  }

  const guests = JSON.parse(guestsString); // Parse the guests list
  const zip = new JSZip();

  // Read the image file
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

  // For each guest, create an image with their name on it
  for (const guest of guests) {
    const guestImageBuffer = await addGuestNameToImage(
      imageBuffer,
      guest,
      font,
      parseInt(fontSize),
      color,
      parseInt(letterSpacing),
    );
    zip.file(`${guest}.png`, guestImageBuffer); // Add the modified image to the ZIP
  }

  // Generate the ZIP file
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="invitations.zip"',
    },
  });
}

// Function to draw text with custom letter spacing
function drawTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number = 0,
) {
  let currentX = x;

  // Loop over each character and draw it with the spacing
  for (const char of text) {
    ctx.fillText(char, currentX, y);
    currentX += ctx.measureText(char).width + letterSpacing;
  }
}

// Function to add guest name to the image using canvas and sharp
async function addGuestNameToImage(
  imageBuffer: Buffer,
  guestName: string,
  fontPath: string,
  fontSize: number,
  color: string,
  letterSpacing: number,
): Promise<Buffer> {
  // Register the custom font
  registerFont("./public/fonts/MonumentGrotesk.ttf", {
    family: "MonumentGrotesk",
  });

  // Create a canvas with the same size as the image
  const { width, height } = await sharp(imageBuffer).metadata();
  if (!width || !height) {
    console.log("Error: Image metadata not found");
    return imageBuffer;
  }
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Set the font, size, and color
  ctx.font = `${fontSize}px MonumentGrotesk`;
  ctx.fillStyle = color;

  // Calculate the text width with letter spacing
  const textWidth =
    ctx.measureText(guestName).width + (guestName.length - 1) * letterSpacing;

  // Draw the guest's name in the center of the canvas
  const xPosition = (width - textWidth) / 2;
  const yPosition = height / 2;

  drawTextWithLetterSpacing(
    ctx,
    guestName,
    xPosition,
    yPosition,
    letterSpacing,
  );

  // Convert the canvas to a buffer
  const canvasBuffer = canvas.toBuffer("image/png");

  // Use Sharp to overlay the canvas text buffer onto the original image
  const image = sharp(imageBuffer);

  // Combine the original image and the canvas text
  return await image
    .composite([{ input: canvasBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
