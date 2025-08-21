import { put, list } from "@vercel/blob";

const PUBS_BLOB_NAME = "pubs.json";

export async function getPubs(): Promise<string[]> {
  try {
    console.log("getPubs called");
    
    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.log("Blob storage not configured, returning empty array");
      return [];
    }

    // Use the list API to find our blob
    try {
      const { blobs } = await list({
        prefix: PUBS_BLOB_NAME,
      });
      
      if (blobs.length > 0) {
        // Get the most recent blob (in case there are multiple)
        const pubsBlob = blobs[0];
        console.log("Found pubs blob:", pubsBlob.url);
        
        // Fetch the content
        const response = await fetch(pubsBlob.url);
        if (response.ok) {
          const data = await response.json();
          console.log("Successfully retrieved pubs from blob:", data);
          return Array.isArray(data) ? data : [];
        } else {
          console.log("Failed to fetch blob content:", response.status, response.statusText);
        }
      } else {
        console.log("No pubs blob found, returning empty array");
      }
    } catch (listError) {
      console.log("Failed to list blobs:", listError);
    }
    
    return [];
  } catch (error) {
    console.error("Error getting pubs from blob:", error);
    return [];
  }
}

export async function setPubs(pubs: string[]): Promise<void> {
  try {
    console.log("setPubs called with:", pubs);
    
    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("Blob environment variables not set:", {
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
      });
      throw new Error("Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.");
    }

    const blob = await put(PUBS_BLOB_NAME, JSON.stringify(pubs), {
      access: "public",
      contentType: "application/json",
    });
    
    console.log("Successfully saved pubs to blob:", blob.url);
    console.log("Saved data:", pubs);
  } catch (error) {
    console.error("Error setting pubs in blob:", error);
    throw new Error(`Failed to save pubs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
