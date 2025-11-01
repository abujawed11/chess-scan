// Chess board vision recognition API service

import axios from 'axios';
import { API_CONFIG } from '@/constants/config';

export interface VisionApiResponse {
  fen: string;
  confidence: number;
  detectedPieces?: {
    square: string;
    piece: string;
    confidence: number;
  }[];
}

/**
 * Analyzes chess board image and returns FEN position
 * @param imageUri - Local file URI of the cropped board image
 * @returns FEN string and confidence score
 */
export async function recognizeChessBoard(imageUri: string): Promise<VisionApiResponse> {
  try {
    // Create form data
    const formData = new FormData();

    // For React Native, we need to prepare the image file
    const filename = imageUri.split('/').pop() || 'board.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await axios.post<VisionApiResponse>(
      `${API_CONFIG.VISION_API_URL}/recognize`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: API_CONFIG.TIMEOUT,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Vision API error:', error);

    // Fallback: return starting position for now
    // TODO: Remove this mock once backend is ready
    return {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      confidence: 0.0,
      detectedPieces: [],
    };
  }
}

/**
 * Check if vision API is available
 */
export async function checkVisionApiHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_CONFIG.VISION_API_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
