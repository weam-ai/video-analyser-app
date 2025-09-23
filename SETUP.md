# Loom Video Analyzer Setup

This Next.js application integrates Loom video analysis functionality using Google's Gemini AI.

## Features

- **Video Upload**: Upload Loom videos by providing the share URL
- **AI Analysis**: Generate comprehensive summaries using Gemini AI
- **Custom Queries**: Ask specific questions about video content
- **Storage Management**: Built-in storage limits and validation
- **Modern UI**: Clean, responsive interface with Tailwind CSS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Upload Video**: Enter a Loom video URL (e.g., `https://www.loom.com/share/your-video-id`)
2. **Automatic Analysis**: The app will automatically generate a comprehensive summary
3. **Custom Analysis**: Ask specific questions about the video content
4. **View Results**: See the AI-generated insights and analysis

## API Endpoints

### POST `/api/upload-video`
Uploads and analyzes a Loom video.

**Request Body:**
```json
{
  "url": "https://www.loom.com/share/your-video-id",
  "companyId": "default",
  "companymodel": "default",
  "agentExtraInfo": {}
}
```

### POST `/api/analyze-video`
Performs custom analysis on an uploaded video.

**Request Body:**
```json
{
  "fileName": "file_name",
  "prompt": "Your custom question about the video"
}
```

## Technical Details

- **Video Processing**: Extracts video ID from Loom URLs and fetches the actual video file
- **AI Integration**: Uses Google's Gemini 1.5 Flash model for video analysis
- **Storage Limits**: 20GB total storage limit, 30-minute video duration limit
- **Security**: Encrypted API key handling and secure file processing
- **Error Handling**: Comprehensive error handling for various failure scenarios

## Limitations

- Currently supports only Loom videos
- Requires valid Loom video URLs
- Video duration limited to 30 minutes
- Storage limited to 20GB total

## Troubleshooting

1. **API Key Issues**: Ensure your Gemini API key is valid and has proper permissions
2. **Video URL Issues**: Make sure the Loom URL is publicly accessible
3. **Storage Issues**: Check if you've exceeded the storage limit
4. **Network Issues**: Ensure stable internet connection for video processing