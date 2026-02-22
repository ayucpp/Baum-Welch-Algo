import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        let errors = [];
        page.on('pageerror', err => errors.push(err.toString()));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto('http://localhost:5173');
        await page.waitForSelector('.btn-primary');
        await page.click('.btn-primary');
        await new Promise(r => setTimeout(r, 1000));
        
        console.log("ERRORS CAUGHT:", errors);
        await page.screenshot({ path: '/home/ayush/.gemini/antigravity/brain/c32a0b20-8d98-480b-9b07-6030ded36af5/post_generate_test.png' });
        await browser.close();
    } catch(e) {
        console.log("CRITICAL:", e);
    }
    process.exit(0);
})();
