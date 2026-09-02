const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = "C:\\Users\\abhij\\.gemini\\antigravity\\brain\\9b4c7287-0aff-4537-b0b0-113d3189d8ff\\scratch\\implementation_screenshots";
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1440, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // 1. Login
  await page.goto('http://localhost:3001/login');
  await page.type('input[type="email"]', 'admin@supermart.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  
  // Create an invoice first so we have one for SCREEN-006 (Invoice Details)
  let invoiceId = "";
  
  // SCREEN-010 Dashboard / SCREEN-001 Sales Invoice List
  await page.goto('http://localhost:3001/sales/invoices');
  await page.waitForSelector('table');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'SCREEN-001_implementation.png') });
  await page.screenshot({ path: path.join(outDir, 'SCREEN-010_implementation.png') }); // Reusing for now
  
  // Find an invoice ID if it exists
  const invoiceLink = await page.$('a[href^="/sales/invoices/"]');
  if (invoiceLink) {
    const href = await page.evaluate(el => el.getAttribute('href'), invoiceLink);
    invoiceId = href.split('/').pop();
  }
  
  // SCREEN-002 Create Sales Invoice
  await page.goto('http://localhost:3001/sales/invoices/new');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'SCREEN-002_implementation.png') });
  
  // SCREEN-004 Party Search Dropdown
  // Find the "+ Add Party" button and click it, or click the combobox
  const addPartyBtn = await page.$x("//button[contains(., '+ Add Party')]");
  if (addPartyBtn.length > 0) {
    await addPartyBtn[0].click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'SCREEN-004_implementation.png') });
    
    // SCREEN-003 Create New Party Modal
    const createPartyBtn = await page.$x("//button[contains(., 'Create Party')]");
    if (createPartyBtn.length > 0) {
      await createPartyBtn[0].click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(outDir, 'SCREEN-003_implementation.png') });
      
      // Close modal
      const closeBtn = await page.$x("//button[contains(., 'Cancel')]");
      if (closeBtn.length > 0) await closeBtn[0].click();
    }
  }
  
  // Click somewhere to close dropdowns
  await page.mouse.click(10, 10);
  await new Promise(r => setTimeout(r, 500));
  
  // SCREEN-007 Add Items to Bill
  const addItemBtn = await page.$x("//button[contains(., '+ Add Item')]");
  if (addItemBtn.length > 0) {
    await addItemBtn[0].click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'SCREEN-007_implementation.png') });
    
    // SCREEN-005 Create New Item Modal
    const createItemBtn = await page.$x("//button[contains(., 'Create New Item')]");
    if (createItemBtn.length > 0) {
      await createItemBtn[0].click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(outDir, 'SCREEN-005_implementation.png') });
      
      // Close modal
      const closeBtn = await page.$x("//button[contains(., 'Cancel')]");
      if (closeBtn.length > 0) await closeBtn[0].click();
    }
    
    // Close Add Item modal
    const closeAddBtn = await page.$x("//button[contains(., 'Cancel [ESC]')]");
    if (closeAddBtn.length > 0) await closeAddBtn[0].click();
  }
  
  // Click somewhere to close
  await page.mouse.click(10, 10);
  await new Promise(r => setTimeout(r, 500));

  // SCREEN-008 Quick Party Settings
  const settingsBtns = await page.$$('button:has(svg.lucide-settings)');
  if (settingsBtns.length >= 2) {
    await settingsBtns[1].click(); // Assuming second is in Party box
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'SCREEN-008_implementation.png') });
    
    // Close
    const closeBtn = await page.$x("//button[contains(., 'Cancel')]");
    if (closeBtn.length > 0) await closeBtn[closeBtn.length - 1].click();
  }

  // SCREEN-009 Quick Invoice Settings
  if (settingsBtns.length >= 3) {
    await settingsBtns[2].click(); // Assuming third is in Invoice Details box
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'SCREEN-009_implementation.png') });
    
    // Close
    const closeBtn = await page.$x("//button[contains(., 'Cancel')]");
    if (closeBtn.length > 0) await closeBtn[closeBtn.length - 1].click();
  }
  
  // SCREEN-006 Invoice Details
  if (invoiceId) {
    await page.goto(`http://localhost:3001/sales/invoices/${invoiceId}`);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'SCREEN-006_implementation.png') });
  }

  await browser.close();
  console.log("Screenshots captured");
}

run().catch(console.error);
