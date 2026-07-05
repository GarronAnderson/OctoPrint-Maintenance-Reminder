# OctoPrint-Maintenance-Reminder

This plugin counts your prints and reminds you when maintenance is due.

I wrote this plugin because I wanted OctoPrint to remind me to wash my PEI sheet and was suprised to find there wasn't already a plugin for that. So, I decided to fill the gap.

This plugin counts completed prints and increments counters. You set up a reminder with a certain number of prints, and when it reaches that number, a message shows in the navbar and a modal appears before each print. You are offered the option to cancel the print, ignore the maintenance, or reset and continue. You can also view maintenance status in a popover from the navbar.

I may add support for notifications via ntfy.sh in the future.

## Setup

Install via the bundled [Plugin Manager](https://docs.octoprint.org/en/main/bundledplugins/pluginmanager.html)
or manually using this URL:

    https://github.com/GarronAnderson/OctoPrint-Maintenance-Reminder/archive/main.zip

## Configuration

You can choose whether or not to count failed and canceled prints toward maintenance (I would). 
Reminders have an interval in prints when they are due. You can add, modify, and remove reminders through the settings under "Maintenance Reminder."
