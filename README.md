# Web Automator

This is a powerful, robust, and open-source tool to automate tasks on the web. It can also be used to fetch data from any website and build custom APIs or datasets. 

### Uses
Following are some of the uses of this tool:
1. Scrape data off websites  [in progress now]
2. Monitor the price of products on e-commerce websites [tbd]
3. Monitor web-vitals or console errors of a webpage [tbd]

Note: Only web-scraper module is being built right now. Rest of the modules will be supported in future. 

## How to use it?
Below are the steps to try it out in the current state (pre-release):
1. Clone the repo and run `npm install` in root folder. 
2. Change the value of the global const named `url` in `./server.js`. Set it to a website you want to try scraping data from.
3. Run `node server.js` in terminal. This should open the url specified, in a chromium browser.
4. Right click an element on the page to configure either an **action** or **state**. 

## How does it work?
There are 2 important parts to this tool:
1. Configuration
2. Automation

### Configuration 
The tool needs to be configured to perform **actions** and to make sense of the data (or **state**) of the websites. In this step, we have to configure **actions** and **states** to form the **configChain**, which will power the automated modules later. **This is a one-time step.**

### Automation
This is the step where the tool uses the **configChain** to perform the tasks automatically. In case of the web-scraper module, the automator module will perform the configured **actions** on the page, simulating the behaviour of a user, and extract data into a structured format (JSON, for now). 

NOTE: This tool is being built. There isn't a timeline for the first major release yet. 

