# The Web Automator💻

This is a powerful and robust tool to automate tasks on the web without writing a single line of code.   

### Uses 🔧
Following are some uses of the tool:
1. **Web Scraping:** The automator can be used to crawl a website and scrape data in JSON format. 
2. **Automating Tasks** The tool can also be used for tasks such as automating form submissions.
3. **UI Testing:** Once built, the web automator will be able to deliver the convenience of setting up UI testing without having to code. This could improve the TAT of UI testing in the software development cycle. 
4. **Data Monitoring:** The tool can be used to monitor data such as the price of products on e-commerce websites. 
5. **Monitor Health of website:** The tool can be developed to check the Web Vitals of a webpage, or log the console errors reliably.

*Note: Only web-scraper module is being built right now. Rest of the modules will be supported in future.* 

## Installation and Set up 🪛
Please note that the code for the core logic or server and the UI panel are in 2 different repos as of now. This will be merged in future. 

### To set up server 🏭
1. Clone this repo and run `npm install` in root folder. 
2. Set up your local mySQL server and run the queries in `automator.sql` file.
3. Update the details of your mySQL server in `appsettings.json` under the `dbConfig` property
4. Run `node server.js` in terminal to start the Express server.

### To set up client 🕴️
1. Clone the [UI repo](https://github.com/Sanjay-George/Web-Automator-Panel)
2. Run npm install to download all dependencies.
3. Run `npm run dev` to build.
4. Open http://localhost:3000/ to see the home page

![image](https://user-images.githubusercontent.com/10389062/157643060-4a901ba3-ad89-4f57-90ab-81e5944bfebb.png)

5. Under modules, click on `web scraper` to get started. 

![image](https://user-images.githubusercontent.com/10389062/157642936-7b597311-8185-4ab2-b1d2-6be0f52196ce.png)

*Note: nextJS requires node >= 12.22.0. In case you have a lower version, use [nvm](https://github.com/nvm-sh/nvm) to easily manage different node versions on your system.* 




## How to use it?

Check out [the wiki](https://github.com/Sanjay-George/Web-Automator/wiki) where we go about configuring a crawler on a simple blog. The core concepts of the web scraper module will extend to other modules, such as UI testing, core web vitals, etc.


