// Chess board vision recognition API service
// Integrates with the trained YOLO model backend

import { API_CONFIG } from '@/constants/config';
import axios from 'axios';

// Debug: Log API configuration when module loads
console.log('🔧 Vision API Module Loaded');
console.log('📍 VISION_API_URL:', API_CONFIG.VISION_API_URL);
console.log('🎮 CHESS_ENGINE_URL:', API_CONFIG.CHESS_ENGINE_URL);

// Backend inference response format
export interface InferenceResponse {
  fen: string;
  num_pieces: number;
  detections: {
    class: string;
    conf: number;
    bbox: [number, number, number, number];
    center: [number, number];
  }[];
  board_corners: [[number, number], [number, number], [number, number], [number, number]];
  overlay_png_base64?: string;
  debug_png_base64?: string;
}

// Mobile app compatible response
export interface VisionApiResponse {
  fen: string;
  confidence: number;
  detectedPieces?: {
    square: string;
    piece: string;
    confidence: number;
  }[];
  overlayImage?: string;
  debugImage?: string;
  boardCorners?: [[number, number], [number, number], [number, number], [number, number]];
}

/**
 * Analyzes chess board image and returns FEN position
 * Uses the trained YOLO model backend
 * @param imageUri - Local file URI of the board image
 * @param flipRanks - Whether to flip the board (white at top vs bottom)
 * @param manualCorners - Optional manual corner adjustment
 * @returns FEN string and detection results
 */
export async function recognizeChessBoard(
  imageUri: string,
  flipRanks: boolean = false,
  manualCorners?: [[number, number], [number, number], [number, number], [number, number]]
): Promise<VisionApiResponse> {
  console.log('🔍 recognizeChessBoard called with:', { imageUri, flipRanks });
  console.log('📡 Backend URL:', API_CONFIG.VISION_API_URL);

  try {
    // Prepare the file info
    const filename = imageUri.split('/').pop() || 'board.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    console.log('📎 Preparing file:', { filename, type, uri: imageUri });
    console.log('🔍 Image URI:', imageUri);

    // Check if file exists and get info
    try {
      const fileInfo = await fetch(imageUri, { method: 'HEAD' });
      console.log('✅ File exists and is accessible');
      console.log('📏 File info:', {
        status: fileInfo.status,
        headers: Object.fromEntries(fileInfo.headers.entries()),
      });
    } catch (err) {
      console.error('❌ File not accessible:', err);
    }

    // Create FormData with React Native-specific file object format
    const formData = new FormData();

    // React Native requires this specific object format for file uploads
    const fileObject = {
      uri: imageUri,
      name: filename,
      type: type,
    };

    console.log('📦 File object to upload:', fileObject);

    formData.append('file', fileObject as any);
    formData.append('flip_ranks', flipRanks ? 'true' : 'false');

    if (manualCorners) {
      formData.append('corners', JSON.stringify(manualCorners));
    }

    // console.log('🚀 Sending inference request to:', `${API_CONFIG.VISION_API_URL}/infer`);
    // console.log('📤 Request details:', {
    //   url: `${API_CONFIG.VISION_API_URL}/infer`,
    //   method: 'POST',
    //   fileObject,
    //   flip_ranks: flipRanks ? 'true' : 'false',
    // });

    // // Use fetch API - don't set Content-Type header, let it be set automatically
    // const response = await fetch(`${API_CONFIG.VISION_API_URL}/infer`, {
    //   method: 'POST',
    //   body: formData,
    //   // Important: No Content-Type header! Let React Native set it with boundary
    // });

    // console.log('📨 Response status:', response.status);

    // if (!response.ok) {
    //   const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    //   throw new Error(`Backend error: ${errorData.error || response.statusText}`);
    // }

    // const data: InferenceResponse = await response.json();

    console.log('🚀 Sending inference request to:', `${API_CONFIG.VISION_API_URL}/infer`);

    console.time('infer_fetch');
    const response = await fetch(`${API_CONFIG.VISION_API_URL}/infer`, {
      method: 'POST',
      body: formData,
    });
    console.timeEnd('infer_fetch');

    console.log('📨 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Backend error: ${errorData.error || response.statusText}`);
    }

    console.time('infer_json');
    const data: InferenceResponse = await response.json();
    console.timeEnd('infer_json');


    console.log('✅ Inference response received!');
    console.log('♟️ FEN:', data.fen);
    console.log('🎯 Pieces detected:', data.num_pieces);
    console.log('📐 Board corners:', data.board_corners);

    // Calculate average confidence from detections
    const avgConfidence = data.detections.length > 0
      ? data.detections.reduce((sum, d) => sum + d.conf, 0) / data.detections.length
      : 0;

    console.log('📊 Average confidence:', avgConfidence.toFixed(2));

    // Transform backend response to mobile app format
    return {
      fen: data.fen,
      confidence: avgConfidence,
      detectedPieces: data.detections.map(det => ({
        square: det.class, // You can enhance this to calculate actual square notation
        piece: det.class,
        confidence: det.conf,
      })),
      overlayImage: data.overlay_png_base64,
      debugImage: data.debug_png_base64,
      boardCorners: data.board_corners,
    };
  } catch (error) {
    console.error('❌ Vision API error:', error);

    // Re-throw the error for the caller to handle
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to recognize chess board: Unknown error');
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
    return response.status === 200 && response.data?.ok === true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
