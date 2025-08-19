import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'

/**
 * 画像をFirebase Storageにアップロード
 * @param file アップロードするファイル
 * @param path 保存先のパス（例: 'mock-exams/userId/examId'）
 * @returns アップロードされたファイルのURL
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    // ファイル名を生成（タイムスタンプ付き）
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const fullPath = `${path}/${fileName}`
    
    // Storageの参照を作成
    const storageRef = ref(storage, fullPath)
    
    // ファイルをアップロード
    const snapshot = await uploadBytes(storageRef, file)
    
    // ダウンロードURLを取得
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return downloadURL
  } catch (error) {
    console.error('画像のアップロードに失敗しました:', error)
    throw new Error('画像のアップロードに失敗しました')
  }
}

/**
 * Firebase Storageから画像を削除
 * @param imageUrl 削除する画像のURL
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // URLからStorageの参照を作成
    const imageRef = ref(storage, imageUrl)
    
    // 画像を削除
    await deleteObject(imageRef)
  } catch (error) {
    console.error('画像の削除に失敗しました:', error)
    // 画像が見つからない場合もエラーを投げない（すでに削除されている可能性があるため）
  }
}

/**
 * Base64画像をFileオブジェクトに変換
 * @param base64 Base64形式の画像データ
 * @param fileName ファイル名
 * @returns Fileオブジェクト
 */
export function base64ToFile(base64: string, fileName: string): File {
  // Base64のプレフィックスを削除
  const base64Data = base64.split(',')[1]
  const mimeType = base64.match(/^data:(.+);base64/)?.[1] || 'image/png'
  
  // Base64をバイナリに変換
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  // Fileオブジェクトを作成
  return new File([bytes], fileName, { type: mimeType })
}