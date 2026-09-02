import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

const BASE_URL = 'http://localhost:3001'
const ARTIFACT_DIR = 'C:/Users/abhij/.gemini/antigravity/brain/9b4c7287-0aff-4537-b0b0-113d3189d8ff/scratch'

// Ensure dir exists
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
}

async function runE2E() {
  console.log("Starting Puppeteer E2E tests on", BASE_URL)
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 }
  })
  const page = await browser.newPage()

  page.on('dialog', async dialog => {
    console.log("DIALOG TRIGGERED:", dialog.message())
    await dialog.accept()
  })

  try {
    // 1. LOGIN
    console.log("Navigating to login...")
    await page.goto(`${BASE_URL}/login`)
    await page.waitForSelector('button[type="submit"]')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_login.png') })
    
    // The inputs are prefilled by React state. Just click submit!
    await page.click('button[type="submit"]')
    
    // Wait for NextAuth to process POST and redirect
    await new Promise(r => setTimeout(r, 3000))
    
    // 2. DASHBOARD
    console.log("Waiting for dashboard...")
    await new Promise(r => setTimeout(r, 3000))
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_dashboard.png') })

    // 3. NEW INVOICE PAGE & MODALS
    console.log("Navigating to new invoice...")
    await page.goto(`${BASE_URL}/sales/invoices/new`)
    await page.waitForSelector('input[type="date"]')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_new_invoice_top.png') })
    
    // Capture bottom
    await page.evaluate(() => window.scrollBy(0, window.innerHeight))
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_new_invoice_bottom.png') })
    await page.evaluate(() => window.scrollTo(0, 0))

    // 4. PARTY CREATION MODAL
    console.log("Testing Party Modal...")
    // Click the Plus button next to Party
    const partyPlusBtn = await page.$$('button.h-10.w-10') // size="icon"
    if (partyPlusBtn.length > 0) {
      await partyPlusBtn[0].click()
      await new Promise(r => setTimeout(r, 1000))
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_party_creation_modal.png') })
      
      // Close modal
      const cancelBtns = await page.$$('text/Cancel')
      if (cancelBtns.length > 0) {
        await cancelBtns[cancelBtns.length - 1].click()
      }
    }
    await new Promise(r => setTimeout(r, 500))

    // 5. ITEM CREATION MODAL
    console.log("Testing Item Modal...")
    const itemPlusBtn = await page.$$('button.h-10.w-10') // re-query
    if (itemPlusBtn.length > 1) {
      await itemPlusBtn[1].click()
      await new Promise(r => setTimeout(r, 1000))
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_item_creation_modal.png') })
      
      // Close modal
      const cancelBtns = await page.$$('text/Cancel')
      if (cancelBtns.length > 0) {
        await cancelBtns[cancelBtns.length - 1].click()
      }
    }
    await new Promise(r => setTimeout(r, 500))

    // 9. INVOICE HISTORY
    console.log("Navigating to invoice history...")
    await page.goto(`${BASE_URL}/sales/invoices`)
    await new Promise(r => setTimeout(r, 2000))
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_invoice_history.png') })
    
    // Check if there's any invoice to view
    const invoiceLinks = await page.$$('a[href^="/sales/invoices/"]')
    if (invoiceLinks.length > 1) { // 1st is usually "New Invoice" in Header, others are actual invoices
      console.log("Navigating to invoice details...")
      await page.goto(BASE_URL + await page.evaluate(el => el.getAttribute('href'), invoiceLinks[1]))
      await new Promise(r => setTimeout(r, 2000))
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_invoice_details.png') })
    }

    console.log("✅ Puppeteer E2E complete.")
  } catch (error) {
    console.error("Puppeteer Script Failed:", error)
  } finally {
    await browser.close()
  }
}

runE2E()
