/*
 * View model for OctoPrint-Maintenance-Reminder
 *
 * Author: Garron Anderson
 * License: AGPL-3.0-or-later
 */
 $(function () {

    function MaintenanceReminderSettingsViewModel(parameters) {
        var self = this;
        window.maintenanceReminderVM = self;

        console.log("MaintenanceReminderSettingsViewModel");

        self.settingsViewModel = parameters[0];
        self.pluginSettings = null;

        self.onBeforeBinding = function () {
          console.log("onBeforeBinding");
            self.pluginSettings =
                self.settingsViewModel.settings.plugins.maintenance_reminder;

            console.log("settings:", self.pluginSettings);
        };

        self.isAlert = function(reminder) {
          return Number(reminder.count()) >= Number(reminder.interval());
        };

        self.addReminder = function () {
            console.log("added reminder");

            var reminder = {
                message: ko.observable("New Reminder"),
                interval: ko.observable(10),
                count: ko.observable(0)
            };

            self.pluginSettings.reminders.push(reminder);
        };

        self.removeReminder = function (item) {
            self.pluginSettings.reminders.remove(item);
        };

        self.resetReminder = function (item) {
            item.count(0);
        };

        self.incrementReminder = function (item) {
          item.count(item.count() + 1);
        }

        self.needsMaintenance = ko.pureComputed(function () {
            return self.pluginSettings &&
                   self.pluginSettings.reminders().some(self.isAlert);
        });

        self.onDataUpdaterPluginMessage = function(plugin, data) {
          if (plugin !== "maintenance_reminder") {
              return;
          }

          if (data.type === "reminders_updated") {
            console.log("got a message for me")
              data.reminders.forEach(function(updated, i) {
                var reminder = self.pluginSettings.reminders()[i];
                reminder.count(updated.count);
                reminder.interval(updated.interval);
                reminder.message(updated.message);
              });
          }
        };
    }

    OCTOPRINT_VIEWMODELS.push([
        MaintenanceReminderSettingsViewModel,
        ["settingsViewModel"],
        [
            "#settings_plugin_maintenance_reminder",
            "#navbar_plugin_maintenance_reminder"
        ]
    ]);

});
