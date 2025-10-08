/**
 * Removes markdown formatting (bold, italic, etc.) from text
 */
function removeMarkdownFormatting(text: string): string {
  return text
    // Remove bold (**text** or __text__)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove italic (*text* or _text_)
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove strikethrough (~~text~~)
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove inline code (`text`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers (# text)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes (> text)
    .replace(/^>\s+/gm, '');
}

/**
 * Formats JSON responses to human-readable text
 */
export function formatJsonToText(text: string): string {
  try {
    // Check if response contains JSON code blocks
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;
    let formattedText = text;

    while ((match = jsonBlockRegex.exec(text)) !== null) {
      const jsonString = match[1];
      try {
        const jsonData = JSON.parse(jsonString);
        let readableText = '';

        // Handle array of timeline events
        if (Array.isArray(jsonData)) {
          readableText = '\n\nVideo Timeline:\n\n';
          jsonData.forEach((item, index) => {
            if (item.start && item.end && item.label) {
              // Timeline format with start/end times
              readableText += `[${item.start} - ${item.end}]\n${item.label}\n\n`;
            } else if (item.timestamp && item.spoken) {
              // Detailed timeline format
              readableText += `[${item.timestamp}]\n`;
              readableText += `Spoken: ${item.spoken}\n`;
              if (item.visuals) readableText += `Visuals: ${item.visuals}\n`;
              if (item.notes) readableText += `Notes: ${item.notes}\n`;
              readableText += '\n';
            } else {
              // Generic object formatting
              readableText += `Entry ${index + 1}:\n`;
              Object.entries(item).forEach(([key, value]) => {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                readableText += `${formattedKey}: ${value}\n`;
              });
              readableText += '\n';
            }
          });
        } else if (typeof jsonData === 'object') {
          // Handle single object
          readableText = '\n\nDetails:\n\n';
          Object.entries(jsonData).forEach(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            readableText += `${formattedKey}: ${value}\n`;
          });
        }

        // Replace the JSON block with formatted text
        formattedText = formattedText.replace(match[0], readableText);
      } catch (parseError) {
        // If parsing fails, leave the original JSON
        console.error('Failed to parse JSON block:', parseError);
      }
    }

    // Remove all markdown formatting from the final text
    return removeMarkdownFormatting(formattedText);
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return text;
  }
}

