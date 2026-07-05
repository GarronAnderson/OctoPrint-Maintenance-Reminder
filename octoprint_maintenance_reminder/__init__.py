# coding=utf-8
from __future__ import absolute_import

from flask import jsonify

import octoprint.plugin
import octoprint.events


class MaintenanceReminderPlugin(
    octoprint.plugin.SettingsPlugin,
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.TemplatePlugin,
    octoprint.plugin.EventHandlerPlugin,
    octoprint.plugin.StartupPlugin,
    octoprint.plugin.SimpleApiPlugin,
):

    ##~~ SettingsPlugin mixin

    def get_settings_defaults(self):
        return {
            "reminders": [
                {"message":"Wash PEI Sheet", "interval": 10, "count": 0},
                {"message":"Lubricate Fittings", "interval": 600, "count": 0},
            ],
            "count_failed": True,
            "count_cancelled": True,
            "show_navbar_message": True,
            "warning_threshold": 50,
            "danger_threshold": 80,
        }
        # reminders is a list of dicts with (message, interval (in prints), (current) count)

    ##~~ AssetPlugin mixin

    def get_assets(self):
        # Define your plugin's asset files to automatically include in the
        # core UI here.
        return {
            "js": ["js/maintenance_reminder.js"],
            "css": ["css/maintenance_reminder.css"],
            "less": ["less/maintenance_reminder.less"],
        }

    ##~~ Softwareupdate hook

    def get_update_information(self):
        # Define the configuration for your plugin to use with the Software Update
        # Plugin here. See https://docs.octoprint.org/en/main/bundledplugins/softwareupdate.html
        # for details.
        return {
            "maintenance_reminder": {
                "displayName": "Maintenance Reminder",
                "displayVersion": self._plugin_version,
                # version check: github repository
                "type": "github_release",
                "user": "GarronAnderson",
                "repo": "OctoPrint-Maintenance-Reminder",
                "current": self._plugin_version,
                # update method: pip
                "pip": "https://github.com/GarronAnderson/OctoPrint-Maintenance-Reminder/archive/{target_version}.zip",
            }
        }

    # Startup Plugin
    def on_after_startup(self):
        pass

    # Event Handler Mixin
    def on_event(self, event, payload):
        reminders = self._settings.get(["reminders"])
        count_failed = self._settings.get(["count_failed"])
        count_cancelled = self._settings.get(["count_cancelled"])
        
        if (event == octoprint.events.Events.PRINT_DONE) or (event == octoprint.events.Events.PRINT_CANCELLED and count_cancelled) or (event == octoprint.events.Events.PRINT_FAILED and count_failed):
            reminders = self._settings.get(["reminders"])
            for reminder in reminders:
                reminder["count"] += 1

            self._settings.set(["reminders"], reminders)
            self._plugin_manager.send_plugin_message(
                self._identifier,
                {
                    "type": "reminders_updated",
                    "reminders": reminders
                }
            )

    # Templates
    def get_template_configs(self):
        return [
            dict(type="settings", custom_bindings=True),
            dict(type="navbar", custom_bindings=True),
            dict(type="generic", template="maintenance_reminder_modal.jinja2")
        ]
    
    # API for testing, mostly
    def get_api_commands(self):
        return {"reset": ["message"], "increment": []}

    def on_api_get(self, request):
        reminders = self._settings.get(["reminders"])
        return jsonify(reminders)

    def on_api_command(self, command, data):
        if command == "reset":
            to_reset = data['message']
            reminders = self._settings.get(["reminders"])
            for reminder in reminders:
                if reminder["message"] == to_reset:
                    reminder['count'] = 0
            self._settings.set(["reminders"], reminders)

        if command == "increment":
            reminders = self._settings.get(["reminders"])
            for reminder in reminders:
                reminder["count"] += 1

            self._settings.set(["reminders"], reminders)
            self._logger.info(f"reminders now: {reminders}")
        
        self._plugin_manager.send_plugin_message(
            self._identifier,
            {
                "type": "reminders_updated",
                "reminders": reminders
            }
        )

# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "Maintenance Reminder"
__author__ = "Garron Anderson <garronanderson4321@gmail.com>"

# Set the Python version your plugin is compatible with below. Recommended is Python 3 only for all new plugins.
# OctoPrint 1.4.0 - 1.7.x run under both Python 3 and the end-of-life Python 2.
# OctoPrint 1.8.0 onwards only supports Python 3.
__plugin_pythoncompat__ = ">=3,<4"  # Only Python 3


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = MaintenanceReminderPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }
