import { put, list, del } from "@vercel/blob";

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
        prefix: PUBS_BLOB_NAME.replace('.json', ''),
      });
      
      console.log("Found blobs:", blobs.length, blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
      
      if (blobs.length > 0) {
        // Get the most recent blob by uploadedAt timestamp
        const sortedBlobs = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        const latestBlob = sortedBlobs[0];
        console.log("Using latest blob:", latestBlob.pathname, "uploaded at:", latestBlob.uploadedAt);
        
        // Fetch the content
        const response = await fetch(latestBlob.url);
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

    // Save the new blob
    const blob = await put(PUBS_BLOB_NAME, JSON.stringify(pubs), {
      access: "public",
      contentType: "application/json",
    });
    
    console.log("Successfully saved pubs to blob:", blob.url);
    console.log("Saved data:", pubs);

    // Clean up old pubs blobs (keep only the latest one)
    try {
      const { blobs } = await list({
        prefix: PUBS_BLOB_NAME.replace('.json', ''),
      });
      
      if (blobs.length > 1) {
        // Sort by upload date and keep only the latest one
        const sortedBlobs = blobs.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        const blobsToDelete = sortedBlobs.slice(1); // All except the most recent
        
        console.log(`Cleaning up ${blobsToDelete.length} old pubs blobs`);
        for (const oldBlob of blobsToDelete) {
          try {
            await del(oldBlob.url);
            console.log("Deleted old blob:", oldBlob.pathname);
          } catch (deleteError) {
            console.warn("Failed to delete old blob:", oldBlob.pathname, deleteError);
          }
        }
      }
    } catch (cleanupError) {
      console.warn("Failed to cleanup old blobs:", cleanupError);
    }
  } catch (error) {
    console.error("Error setting pubs in blob:", error);
    throw new Error(`Failed to save pubs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
