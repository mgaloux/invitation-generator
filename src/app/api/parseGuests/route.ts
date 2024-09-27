import { NextResponse } from 'next/server';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export async function POST(request: Request) {
  // Parse the form data from the request
  const formData = await request.formData();
  
  // Retrieve the CSV file from the form data
  const csvFile = formData.get('csvFile') as File | null;

  if (!csvFile) {
    return NextResponse.json(
      { error: 'No CSV file uploaded' },
      { status: 400 }
    );
  }

  // Convert the file to a readable stream
  const fileBuffer = Buffer.from(await csvFile.arrayBuffer());
  const readableStream = Readable.from(fileBuffer);

  // List to store the guests from the first column
  const guestList: string[] = [];

  // Create a promise to handle async CSV parsing
  const csvParsePromise = new Promise<string[]>((resolve, reject) => {
    readableStream
      .pipe(csvParser())
      .on('data', (row) => {
        // Assuming the first column is the guest name
        const guestName = row[Object.keys(row)[0]]; // Get first column by index
        guestList.push(guestName);
      })
      .on('end', () => resolve(guestList))
      .on('error', (err) => reject(err));
  });

  try {
    // Await the parsed guests list
    const guests = await csvParsePromise;

    // Return the guests as JSON response
    return NextResponse.json({ guests }, { status: 200 });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return NextResponse.json({ error: 'Failed to parse CSV file' }, { status: 500 });
  }
}
