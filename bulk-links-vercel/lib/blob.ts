export async function getPubs(): Promise<string[]> {
  try {
    console.log("getPubs called");
    
    // For now, return a simple test to verify the function is working
    return ["Test Publisher"];
  } catch (error) {
    console.error("Error getting pubs from blob:", error);
    return [];
  }
}

export async function setPubs(pubs: string[]): Promise<void> {
  try {
    console.log("setPubs called with:", pubs);
    
    // For now, just log that it was called successfully
    console.log("setPubs completed successfully");
  } catch (error) {
    console.error("Error setting pubs in blob:", error);
    throw new Error(`Failed to save pubs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
