import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// 開発用のサンプルデータを投入
async function seedAnalyticsData(userId: string) {
  const subjects = ['math', 'english', 'japanese', 'science', 'social'];
  const topics = {
    math: ['二次関数', '三角関数', '微分積分'],
    english: ['文法', '長文読解', 'リスニング'],
    japanese: ['現代文', '古文', '漢文'],
    science: ['物理', '化学', '生物'],
    social: ['日本史', '世界史', '地理']
  };
  
  // 過去30日分のデータを生成
  for (let day = 0; day < 30; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    
    // 1日に2-3セッション
    const sessionCount = Math.floor(Math.random() * 2) + 1;
    
    for (let s = 0; s < sessionCount; s++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const topic = topics[subject][Math.floor(Math.random() * topics[subject].length)];
      const duration = Math.floor(Math.random() * 3600) + 1800; // 30-90分
      const questions = Math.floor(Math.random() * 30) + 10;
      const accuracy = Math.random() * 40 + 60; // 60-100%
      
      await addDoc(collection(db, 'studySessions'), {
        userId,
        subjectId: subject,
        topicId: topic,
        topicName: topic,
        startTime: new Date(date.getTime() - duration * 1000),
        endTime: date,
        duration,
        questionsAnswered: questions,
        correctAnswers: Math.floor(questions * accuracy / 100),
        accuracy,
        createdAt: date
      });
    }
  }
  
  console.log('Analytics data seeded successfully');
}

// 実行（開発環境でのみ使用）
// seedAnalyticsData('test-user');
