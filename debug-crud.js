const { chromium } = require('playwright');
const { getBaseUrl, getLoginCredentials } = require('./utils/environment.js');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const baseUrl = getBaseUrl();

  await page.goto(new URL('auth/login', baseUrl).toString());
  await page.locator('input[name="username"]').fill(getLoginCredentials().username);
  await page.locator('input[name="password"]').fill(getLoginCredentials().password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard\//, { timeout: 20000 });

  const employeeId = Date.now().toString().slice(-9);
  await page.goto(new URL('pim/addEmployee', baseUrl).toString());
  await page.locator('input[placeholder="First Name"]').fill('Test');
  await page.locator('input[placeholder="Middle Name"]').fill('s');
  await page.locator('input[placeholder="Last Name"]').fill('User');
  const empIdInput = page.locator('.oxd-input-group').filter({ has: page.locator('label', { hasText: 'Employee Id' }) }).locator('input');
  await empIdInput.fill(String(employeeId));
  const saveButton = page.getByRole('button', { name: 'Save' }).first();
  await saveButton.click({ force: true });
  await page.waitForTimeout(5000);
  console.log('after save URL', page.url());
  console.log('success text count', await page.getByText('Successfully Saved').count());
  console.log('body sample', (await page.locator('body').innerText()).slice(0,800));

  await page.goto(new URL('pim/viewEmployeeList', baseUrl).toString());
  await page.locator('.oxd-input-group').filter({ has: page.locator('label', { hasText: 'Employee Id' }) }).locator('input').fill(String(employeeId));
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForTimeout(5000);

  const rows = await page.getByRole('row').allTextContents();
  console.log('ROW TEXT SAMPLE', rows.slice(0,12));
  const row = page.getByRole('row').filter({ hasText: String(employeeId) }).first();
  console.log('row count', await row.count());
  const cells = await page.locator('td').allTextContents();
  console.log('cell sample', cells.slice(0,25));
  if (await row.count()) {
    console.log('has row text', await row.textContent());
    await row.click();
    await page.waitForTimeout(3000);
    console.log('after click URL', page.url());
    console.log('buttons', await page.getByRole('button').allTextContents());
    console.log('body text sample', (await page.locator('body').innerText()).slice(0,1200));
  }

  await browser.close();
})();
