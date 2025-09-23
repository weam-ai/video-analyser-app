// Simple URL parsing without external dependencies

export function extractVideoId(url: string): string {
  // Extract video ID from Loom URL
  const pattern = /share\/([a-zA-Z0-9]+)/;
  const match = pattern.exec(url);
  if (match) {
    return match[1];
  }
  throw new Error("Invalid Loom URL");
}

export async function getVideoUrl(videoId: string): Promise<string> {
  // Get video details from Loom API
  const apiUrl = `https://www.loom.com/api/campaigns/sessions/${videoId}/transcoded-url`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Origin': 'https://www.loom.com',
    'Referer': `https://www.loom.com/share/${videoId}`,
    'Accept': 'application/json',
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch video details. Status code: ${response.status}`);
  }
  
  const data = await response.json();
  try {
    const videoUrl = data.url;
    console.log(`Generated video URL: ${videoUrl}`);
    return videoUrl;
  } catch (error) {
    console.log(`JSON Response: ${JSON.stringify(data)}`);
    throw new Error(`Could not find video URL in response: ${error}`);
  }
}

export function extractMainDomain(url: string): string {
  try {
    // First, try to parse as URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Extract domain from hostname (remove www. if present)
    const domain = hostname.replace(/^www\./, '');
    
    // For Loom URLs, we know the domain is 'loom'
    if (domain.includes('loom.com')) {
      return 'loom';
    }
    
    // For other URLs, extract the main domain
    const parts = domain.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    
    return domain;
  } catch (error) {
    // Fallback: try to extract domain from string using regex
    const match = url.match(/https?:\/\/(?:www\.)?([^\/\?]+)/);
    if (match) {
      const hostname = match[1];
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return parts[parts.length - 2];
      }
      return hostname;
    }
    
    // If it's a Loom URL pattern, return 'loom' directly
    if (url.includes('loom.com') || url.includes('loom.com/share/')) {
      return 'loom';
    }
    
    // Last resort: return 'unknown' instead of throwing error
    console.warn('Could not extract domain from URL:', url);
    return 'unknown';
  }
}

export function getVideoSize(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    fetch(url, { method: 'HEAD' })
      .then(response => {
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          resolve(parseInt(contentLength, 10));
        } else {
          reject(new Error('Could not determine video size'));
        }
      })
      .catch(reject);
  });
}

export function getSizeInGB(numBytes: number): number {
  return numBytes / (1024 ** 3);
}
