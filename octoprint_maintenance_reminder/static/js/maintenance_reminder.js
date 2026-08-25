/*
 * View model for OctoPrint-Maintenance-Reminder
 *
 * Author: Garron Anderson
 * License: AGPL-3.0-or-later
 */
$(function () {
    function MaintenanceReminderViewModel(parameters) {
        var self = this;
        window.maintenanceReminderVM = self;

        self.settingsViewModel = parameters[0];
        self.printerStateViewModel = parameters[1];
        self.filesViewModel = parameters[2];

        self.pluginSettings = null;

        // === NATIVE HANDLERS ===

        self.onBeforeBinding = function () {
            self.pluginSettings =
                self.settingsViewModel.settings.plugins.maintenance_reminder;
        };

        self.onDataUpdaterPluginMessage = function (plugin, data) {
            if (plugin !== "maintenance_reminder") {
                return;
            }

            if (data.type === "reminders_updated") {
                data.reminders.forEach(function (updated, i) {
                    var reminder = self.pluginSettings.reminders()[i];
                    reminder.count(updated.count);
                    reminder.interval(updated.interval);
                    reminder.message(updated.message);
                });
            }
        };

        // === PRINT HANDLERS ===
        // This works by intercepting the OctoPrint call and patching it, like octoprint-spoolman does.
        // You can then reset reminders and cancel or continue prints.
		
        self.pendingPrint = false;
        self.onBeforePrintStart = function (callback, data) {
			if (!self.needsMaintenance()) {
                return;
            }

            self.pendingPrint = callback;
            if (self.needsMaintenance()) {
                $("#modal_maintenance_reminder").modal("show");
				return false;
            }
		};
		
        self.continuePrint = function () {
            $("#modal_maintenance_reminder").modal("hide");

            if (self.pendingPrint) {
                self.pendingPrint();
                self.pendingPrint = false;
            }
        };

        self.cancelPrint = function () {
            self.pendingPrint = false;
            $("#modal_maintenance_reminder").modal("hide");
        };

        // === REMINDERS ===

        self.isAlert = function (reminder) {
            return Number(reminder.count()) >= Number(reminder.interval());
        };

        self.percentage = function (reminder) {
            return Math.round(
                Math.min((reminder.count() / reminder.interval()) * 100, 100)
            );
        };

        self.barClass = function (reminder) {
            percent = self.percentage(reminder);
            if (percent <= self.pluginSettings.warning_threshold()) {
                return "bar-info";
            } else if (percent <= self.pluginSettings.danger_threshold()) {
                return "bar-warning";
            } else {
                return "bar-danger";
            }
        };

        self.addReminder = function () {
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

        self.resetReminderByIndex = function (index) {
            var reminder = self.pluginSettings.reminders()[index];

            reminder.count(0);
            self.settingsViewModel.saveData();

            $(".maintenance-popover .bar").eq(index).css("width", "0%");
            $(".maintenance-popover #count").eq(index).text("0");
            $(".maintenance-popover .maintenance-row")
                .eq(index)
                .removeClass("maintenance-alert");
        };

        self.incrementReminder = function (item) {
            item.count(item.count() + 1);
        };

        self.needsMaintenance = ko.pureComputed(function () {
            return (
                self.pluginSettings && self.pluginSettings.reminders().some(self.isAlert)
            );
        });

        $(document).on("click", ".reminder-reset", function (e) {
			e.preventDefault();
			e.stopPropagation();
			var index = $(this).data("index"); 
			window.maintenanceReminderVM.resetReminderByIndex(index);
		});
    }

    OCTOPRINT_VIEWMODELS.push([
        MaintenanceReminderViewModel,
        ["settingsViewModel", "printerStateViewModel", "filesViewModel"],
        [
            "#settings_plugin_maintenance_reminder",
            "#navbar_plugin_maintenance_reminder",
            "#modal_maintenance_reminder"
        ]
    ]);
});
