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

        console.log("MaintenanceReminderSettingsViewModel");

        self.settingsViewModel = parameters[0];
        self.printerStateViewModel = parameters[1];
        self.filesViewModel = parameters[2];

        self.pluginSettings = null;

        // === NATIVE HANDLERS ===

        self.onBeforeBinding = function () {
            self.pluginSettings =
                self.settingsViewModel.settings.plugins.maintenance_reminder;
        };

        self.onStartup = function () {
            self.monkeyPatchOctoprintUI();
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

        self.pendingPrint = false;

        self.beforePrint = function (callback) {
            console.log("beforePrint called");
            callback = callback || self.originalPrint;

            if (!self.needsMaintenance()) {
                console.log("no maintenance needed, callback");
                callback();
                return;
            }

            self.pendingPrint = callback;
            if (self.needsMaintenance()) {
                $("#modal_maintenance_reminder").modal("show");
            }
        };

        self.continuePrint = function () {
            console.log("continuing print");
            $("#modal_maintenance_reminder").modal("hide");

            if (self.pendingPrint) {
                self.pendingPrint();
                self.pendingPrint = null;
            }
        };

        self.cancelPrint = function () {
            console.log("cancelling print");
            self.pendingPrint = null;
            $("#modal_maintenance_reminder").modal("hide");
        };

        self.resetAndPrint = function () {
            console.log("resetting maintenance and printing");
            self.pluginSettings.reminders().forEach(function (r) {
                if (self.isAlert(r)) {
                    r.count(0);
                }
            });

            self.settingsViewModel.saveData();

            self.continuePrint();
        };

        self.monkeyPatchOctoprintUI = function () {
            self.originalPrint = self.printerStateViewModel.print;

            self.printerStateViewModel.print = function () {
                self.beforePrint();
            };
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
            if (percent <= 50) {
                return "bar-info";
            } else if (percent < 80) {
                return "bar-warning";
            } else {
                return "bar-danger";
            }
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

        // === POPOVERS ===

        $("#navbar_maintenance_reminder").popover({
            trigger: "click",
            placement: "bottom",
            container: "body",
            html: true,

            template:
                '<div class="popover maintenance-popover">' +
                '<div class="arrow"></div>' +
                '<h3 class="popover-title"></h3>' +
                '<div class="popover-content"></div>' +
                "</div>",

            title: "Maintenance Reminder",
            content: function () {
                return self.buildPopover();
            }
        });

        self.buildPopover = function () {
            var html = `<table class="table table-striped">
			         <tbody data-bind="foreach: pluginSettings.reminders">`;

            self.pluginSettings.reminders().forEach(function (r, i) {
                var percent = self.percentage(r);

                if (self.isAlert(r)) {
                    html += '<tr class="maintenance-alert maintenance-row">';
                } else {
                    html += '<tr class="maintenance-row">';
                }
                html += `<td>${r.message()}</td>
            <td style="text-align:right"><span id='count'>${r.count()}</span> / ${r.interval()} prints
            <button class="btn btn-mini btn-warning reminder-reset" data-index='${i}'>
              <i class="fa fa-refresh"></i> Reset</button>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="progress">`;

                if (percent <= 50) {
                    html += `<div class="bar bar-info" style="width:${percent}%">${percent}%</div>`;
                } else if (percent < 80) {
                    html += `<div class="bar bar-warning" style="width:${percent}%">${percent}%</div>`;
                } else {
                    html += `<div class="bar bar-danger" style="width:${percent}%">${percent}%</div>`;
                }

                html += `
                </div>
            </td>
        </tr>
        `;
            });

            $(document).on("click", ".reminder-reset", function (e) {
                e.preventDefault();

                var index = $(this).data("index");
                window.maintenanceReminderVM.resetReminderByIndex(index);
            });

            return html;
        };
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

        console.log("MaintenanceReminderSettingsViewModel");

        self.settingsViewModel = parameters[0];
        self.printerStateViewModel = parameters[1];
        self.filesViewModel = parameters[2];

        self.pluginSettings = null;

        // === NATIVE HANDLERS ===

        self.onBeforeBinding = function () {
            self.pluginSettings =
                self.settingsViewModel.settings.plugins.maintenance_reminder;
        };

        self.onStartup = function () {
            self.monkeyPatchOctoprintUI();
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

        self.pendingPrint = false;

        self.beforePrint = function (callback) {
            console.log("beforePrint called");
            callback = callback || self.originalPrint;

            if (!self.needsMaintenance()) {
                console.log("no maintenance needed, callback");
                callback();
                return;
            }

            self.pendingPrint = callback;
            if (self.needsMaintenance()) {
                $("#modal_maintenance_reminder").modal("show");
            }
        };

        self.continuePrint = function () {
            console.log("continuing print");
            $("#modal_maintenance_reminder").modal("hide");

            if (self.pendingPrint) {
                self.pendingPrint();
                self.pendingPrint = null;
            }
        };

        self.cancelPrint = function () {
            console.log("cancelling print");
            self.pendingPrint = null;
            $("#modal_maintenance_reminder").modal("hide");
        };

        self.resetAndPrint = function () {
            console.log("resetting maintenance and printing");
            self.pluginSettings.reminders().forEach(function (r) {
                if (self.isAlert(r)) {
                    r.count(0);
                }
            });

            self.settingsViewModel.saveData();

            self.continuePrint();
        };

        self.monkeyPatchOctoprintUI = function () {
            self.originalPrint = self.printerStateViewModel.print;

            self.printerStateViewModel.print = function () {
                self.beforePrint();
            };
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
            if (percent <= 50) {
                return "bar-info";
            } else if (percent < 80) {
                return "bar-warning";
            } else {
                return "bar-danger";
            }
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

        // === POPOVERS ===

        $("#navbar_maintenance_reminder").popover({
            trigger: "click",
            placement: "bottom",
            container: "body",
            html: true,

            template:
                '<div class="popover maintenance-popover">' +
                '<div class="arrow"></div>' +
                '<h3 class="popover-title"></h3>' +
                '<div class="popover-content"></div>' +
                "</div>",

            title: "Maintenance Reminder",
            content: function () {
                return self.buildPopover();
            }
        });

        self.buildPopover = function () {
            var html = `<table class="table table-striped">
			         <tbody data-bind="foreach: pluginSettings.reminders">`;

            self.pluginSettings.reminders().forEach(function (r, i) {
                var percent = self.percentage(r);

                if (self.isAlert(r)) {
                    html += '<tr class="maintenance-alert maintenance-row">';
                } else {
                    html += '<tr class="maintenance-row">';
                }
                html += `<td>${r.message()}</td>
            <td style="text-align:right"><span id='count'>${r.count()}</span> / ${r.interval()} prints
            <button class="btn btn-mini btn-warning reminder-reset" data-index='${i}'>
              <i class="fa fa-refresh"></i> Reset</button>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="progress">`;

                if (percent <= 50) {
                    html += `<div class="bar bar-info" style="width:${percent}%">${percent}%</div>`;
                } else if (percent < 80) {
                    html += `<div class="bar bar-warning" style="width:${percent}%">${percent}%</div>`;
                } else {
                    html += `<div class="bar bar-danger" style="width:${percent}%">${percent}%</div>`;
                }

                html += `
                </div>
            </td>
        </tr>
        `;
            });

            $(document).on("click", ".reminder-reset", function (e) {
                e.preventDefault();

                var index = $(this).data("index");
                window.maintenanceReminderVM.resetReminderByIndex(index);
            });

            return html;
        };
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
