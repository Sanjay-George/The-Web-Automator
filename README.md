# Web Automator

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d0529b3d5b974981befa9dc5d536b7d6)](https://app.codacy.com/gh/Sanjay-George/Web-Automator?utm_source=github.com&utm_medium=referral&utm_content=Sanjay-George/Web-Automator&utm_campaign=Badge_Grade_Settings)

This is a powerful, robust, and open-source tool to automate tasks on the web. It can also be used to fetch data from websites. 

### Uses
Following are some of the uses of this tool:
1. Scrape data off websites  [in progress now]
2. Monitor prices on e-commerce websites 
3. Monitor web-vitals of a webpage

Note: Only web-scraper module is being built right now. Rest of the modules will be supported in future. 

## Steps to use the tool:
There are 2 important parts to this tool:
1. Training
2. Automation

### Training 
The tool needs to be trained how to perform **actions** and how to make sense of the data (or **state**) on the websites. In this step, we have to configure **actions** and **states** to form the **configChain**, which will power the automated modules later. **This is a one-time step.**

### Automation
This is the step where the tool uses the **configChain** to perform automated tasks. In case of the crawler module, the automator module will perform the configured **actions** on the page, simulating the behaviour of a user, and extract data into a structured format, such as JSON. 

NOTE: This tool is being built. There isn't a timeline for the first major release yet. 

