import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  UploadTaskSnapshot
} from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { app } from './config';

const storage = getStorage(app);

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export class StorageService {
  private static instance: StorageService;
  
  private constructor() {}
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * ファイルをアップロード
   */
  async uploadFile(
    path: string, 
    file: File | Blob,
    metadata?: { [key: string]: string }
  ): Promise<string> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('認証が必要です');
    }

    const storageRef = ref(storage, path);
    
    const uploadMetadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: user.uid,
        uploadedAt: new Date().toISOString(),
        ...metadata
      }
    };

    const snapshot = await uploadBytes(storageRef, file, uploadMetadata);
    return getDownloadURL(snapshot.ref);
  }

  /**
   * プログレス付きアップロード
   */
  uploadFileWithProgress(
    path: string,
    file: File | Blob,
    onProgress: (progress: UploadProgress) => void,
    metadata?: { [key: string]: string }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        reject(new Error('認証が必要です'));
        return;
      }

      const storageRef = ref(storage, path);
      
      const uploadMetadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      };

      const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage
          });
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  /**
   * 音声ファイルのアップロード
   */
  async uploadAudio(userId: string, audioBlob: Blob, sessionId: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `audio/${userId}/${sessionId}/${timestamp}.webm`;
    
    return this.uploadFile(filename, audioBlob, {
      sessionId,
      type: 'interview-audio'
    });
  }

  /**
   * 動画ファイルのアップロード
   */
  async uploadVideo(userId: string, videoBlob: Blob, sessionId: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `video/${userId}/${sessionId}/${timestamp}.webm`;
    
    return this.uploadFileWithProgress(
      filename,
      videoBlob,
      (progress) => {
        console.log(`アップロード進捗: ${progress.percentage.toFixed(2)}%`);
      },
      {
        sessionId,
        type: 'interview-video'
      }
    );
  }

  /**
   * 小論文ファイルのアップロード
   */
  async uploadEssayDocument(userId: string, file: File, essayId: string): Promise<string> {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'pdf';
    const filename = `essays/${userId}/${essayId}/${timestamp}.${extension}`;
    
    return this.uploadFile(filename, file, {
      essayId,
      originalName: file.name,
      type: 'essay-document'
    });
  }

  /**
   * ファイルの削除
   */
  async deleteFile(url: string): Promise<void> {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('ファイル削除エラー:', error);
      throw new Error('ファイルの削除に失敗しました');
    }
  }

  /**
   * URLからStorageパスを取得
   */
  getPathFromUrl(url: string): string {
    const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/`;
    const path = url.replace(baseUrl, '').split('?')[0];
    return decodeURIComponent(path);
  }
}

export const storageService = StorageService.getInstance();

export async function deleteImage(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}
