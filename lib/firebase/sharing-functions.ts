import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

export async function getSharingSettings(userId: string) {
  try {
    const settingsDoc = await getDoc(
      doc(db, 'users', userId, 'settings', 'sharing')
    )
    return settingsDoc.exists() ? settingsDoc.data() : null
  } catch (error) {
    console.error('Error getting sharing settings:', error)
    return null
  }
}

export async function saveSharingSettings(
  userId: string,
  studentId: string,
  pin: string,
  sharingEnabled: boolean
) {
  try {
    await setDoc(
      doc(db, 'users', userId, 'settings', 'sharing'),
      {
        studentId,
        pinHash: pin, // 簡略化
        sharingEnabled,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
    return { success: true }
  } catch (error) {
    console.error('Error saving sharing settings:', error)
    return { success: false, error: 'エラーが発生しました' }
  }
}
