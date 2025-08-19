import { test, expect } from '@playwright/test';

// テスト用の認証情報
const ADMIN_EMAIL = 'yodfdfsshyo9029@gmail.com';
const ADMIN_PASSWORD = 'your-password'; // 実際のパスワードに置き換えてください
const TEST_USER_EMAIL = 'testuser@example.com';
const TEST_USER_PASSWORD = 'testpassword123';

// テストデータ
const testCorporateData = {
  companyName: `テスト企業_${Date.now()}`,
  maxUsers: 5,
  contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  contactEmail: 'test@example.com',
  notes: '自動テスト用の契約'
};

let corporateId: string;
let qrCodeUrl: string;

test.describe('法人契約機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始時のスクリーンショット
    await page.screenshot({ path: `tests/screenshots/start-${Date.now()}.png` });
  });

  test('1. 管理者ログイン', async ({ page }) => {
    console.log('🔐 管理者ログインを開始...');
    
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // ログイン後のリダイレクトを待つ
    await page.waitForURL('**/home', { timeout: 10000 });
    
    console.log('✅ 管理者ログイン成功');
    await page.screenshot({ path: 'tests/screenshots/admin-logged-in.png' });
  });

  test('2. 法人契約作成', async ({ page }) => {
    console.log('📝 法人契約作成を開始...');
    
    // 管理者としてログイン（前のテストからセッションが続いていない場合）
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home');

    // 管理画面へ移動
    await page.goto('/admin/corporate');
    
    // ページが読み込まれるのを待つ
    await page.waitForSelector('h1:has-text("法人契約作成")', { timeout: 10000 });
    
    // フォームに入力
    await page.fill('input[id="companyName"]', testCorporateData.companyName);
    await page.fill('input[id="maxUsers"]', testCorporateData.maxUsers.toString());
    await page.fill('input[id="contractEndDate"]', testCorporateData.contractEndDate);
    await page.fill('input[id="contactEmail"]', testCorporateData.contactEmail);
    await page.fill('textarea[id="notes"]', testCorporateData.notes);
    
    // スクリーンショット
    await page.screenshot({ path: 'tests/screenshots/create-form-filled.png' });
    
    // 作成ボタンをクリック
    await page.click('button:has-text("契約を作成")');
    
    // 成功メッセージを待つ
    await page.waitForSelector('text=法人契約が正常に作成されました', { timeout: 10000 });
    
    // 法人IDを取得
    const corporateIdElement = await page.locator('code').first();
    corporateId = await corporateIdElement.textContent() || '';
    
    console.log(`✅ 法人契約作成成功: ${corporateId}`);
    await page.screenshot({ path: 'tests/screenshots/contract-created.png' });
  });

  test('3. QRコードダウンロード', async ({ page }) => {
    console.log('📥 QRコードダウンロードテスト...');
    
    // 前のテストの続きから（実際には再度ログインと作成が必要）
    // ここでは簡略化のため、管理画面に直接アクセス
    
    // ダウンロードボタンが存在することを確認
    const downloadButton = page.locator('button:has-text("ダウンロード")');
    await expect(downloadButton).toBeVisible();
    
    console.log('✅ QRコードダウンロードボタン確認');
  });

  test('4. テストユーザーで法人契約認証', async ({ page }) => {
    console.log('🔑 法人契約認証テスト...');
    
    // ログアウト（簡易的な方法）
    await page.goto('/auth/logout');
    
    // テストユーザーでログイン（既存ユーザーを使用するか、新規作成）
    await page.goto('/auth/login');
    // 既存のテストユーザーがいない場合は、サインアップページへ
    
    // 法人契約認証ページへ
    await page.goto('/corporate');
    
    // 法人IDを入力
    await page.fill('input[id="code"]', corporateId || 'CORP-TEST-TEST-TEST-TEST');
    
    // 確認ボタンをクリック
    await page.click('button:has-text("確認")');
    
    // 契約情報が表示されるのを待つ
    await page.waitForSelector('text=法人契約が確認されました', { timeout: 10000 });
    
    // 登録ボタンをクリック
    await page.click('button:has-text("登録する")');
    
    // 成功後のリダイレクトを待つ
    await page.waitForURL('**/home?corporate=success', { timeout: 10000 });
    
    console.log('✅ 法人契約認証成功');
    await page.screenshot({ path: 'tests/screenshots/corporate-activated.png' });
  });

  test('5. エラーケーステスト', async ({ page }) => {
    console.log('❌ エラーケーステスト...');
    
    // 無効な法人IDでテスト
    await page.goto('/corporate');
    await page.fill('input[id="code"]', 'INVALID-CODE-1234');
    await page.click('button:has-text("確認")');
    
    // エラーメッセージを確認
    await expect(page.locator('text=法人IDが無効です')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ エラーハンドリング確認');
    await page.screenshot({ path: 'tests/screenshots/error-invalid-code.png' });
  });
});

// テスト結果のサマリーを生成
test.afterAll(async () => {
  console.log('\n📊 テスト完了！');
  console.log('スクリーンショットは tests/screenshots/ に保存されています');
  console.log('HTMLレポートを見るには: npx playwright show-report');
});