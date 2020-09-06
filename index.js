const puppeteer = require('puppeteer');

const account = 'b1800425';
const password = 'b18004251';
const loginURL = 'https://stdportal.tdtu.edu.vn';
const newsURL = 'https://studentnews.tdtu.edu.vn/Home/Index';
var browser = null;
var page = null;
var btn = null;

const Login = async () => {
    try {
        browser = await puppeteer.launch({ headless: false });
        page = await browser.newPage({});
        await page.goto(loginURL, { waitUntil: "domcontentloaded" });
        const txtAccount = await page.$('#MSSV');
        const txtPassword = await page.$('#MK');
        btn = await page.$('input[type=submit]');
        await page.evaluate((accountInput, passInput, accountVal, passVal) => {
            accountInput.value = accountVal;
            passInput.value = passVal;
        }, txtAccount, txtPassword, account, password);
        await Promise.all([
            page.waitForNavigation(),
            btn.click()
        ]);

    } catch(err) {
        console.log(err);
    }
};

const GoToTabNews = async () => {
    try {
        await page.goto(newsURL, { waitUntil: "domcontentloaded" });
        btn = await page.$('#XemTatCaTBQuanTrong > u');
        await Promise.all([
            page.waitForNavigation(),
            btn.click()
        ]);
        //await page.evaluate(ReadNotification);
    } catch(err) {
        console.log(err);
    }
};

const GetIndexPathScript = () => {
    const indexPathArr = [];
    const links = Array.from(document.querySelectorAll('.link-detail'));
    links.forEach(link => {
        const indexPath = link.getAttribute('onclick').match(/\d/g).join('');
        if(indexPath.length > 1) {
            indexPathArr.push(indexPath);
        }
    })
    return indexPathArr;
};

const GetAllIndexPath = async () => {
    var indexPathArr = [];
    try {
        const tabsQuantity = parseInt(await page.evaluate(() => document.querySelector('.jplist-label').innerText.split(' ')[3]));
        for(let tabIndex = 1; tabIndex <= tabsQuantity; tabIndex++) {
            //Get all index path on page
            await page.waitFor(1000);
            var temp = await page.evaluate(GetIndexPathScript);
            indexPathArr = indexPathArr.concat(temp);
            console.log(`Crawl page ${tabIndex} done`);
            if(tabIndex === tabsQuantity) {
                break;
            }
            //go to next page
            btn = await page.$('.jplist-next');
            await Promise.all([
                page.waitForResponse('https://studentnews.tdtu.edu.vn/ThongBao/Filter_TintucList'),
                btn.click()
            ]);
        };
    } catch(err) {
        console.log(err);
        return null;
    }
    return indexPathArr;
}

const ReadAllNoti = async () => {
    const url = 'https://studentnews.tdtu.edu.vn/ThongBao/Detail/';
    var endpoint = null;
    const indexPathArr = await GetAllIndexPath();
    //kh xai dc forEach vi moi iteration se tao ra 1 function rieng (chay song song) nen chi xai for...of hoac for thuong
    //indexPathArr.forEach(async indexPath => {
        //let i = 1;
        //endpoint = `${url}${indexPath}`;
        //const page = await browser.newPage();
        //await page.goto(endpoint, { waitUntil: "domcontentloaded" });
        //await page.waitFor(10000);
        //await page.close();
        //i++;
        //console.log(`Readed ${i} noti(s)`);
    //});
    if(indexPathArr !== null) {
        for(let i = 0; i < indexPathArr.length; i++) {
            endpoint = `${url}${indexPathArr[i]}`;
            const page = await browser.newPage();
            await page.goto(endpoint, { waitUntil: "domcontentloaded" });
            await page.close();
            console.log(`Read ${i + 1} noti(s)`);
        }
    };
}

const Main = async () => {
    await Login();
    await GoToTabNews();
    await ReadAllNoti();
    browser.close()
};

Main();