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

        self.resetReminderByIndex = function (index) {
          var reminder = self.pluginSettings.reminders()[index];

          reminder.count(0);
          self.settingsViewModel.saveData()


          $(".maintenance-popover .bar")
              .eq(index)
              .css("width", "0%");
          $(".maintenance-popover #count")
              .eq(index)
              .text("0");
        };

        self.incrementReminder = function (item) {
          item.count(item.count() + 1);
        }

        self.needsMaintenance = ko.pureComputed(function () {
            return self.pluginSettings &&
                   self.pluginSettings.reminders().some(self.isAlert);
        });

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
                '</div>',

            title: "Maintenance Reminder",
            content: function () {
                return self.buildPopover();
            }
        });

        self.buildPopover = function () {
          var html = `<table class="table table-striped">
			<tbody data-bind="foreach: pluginSettings.reminders">`
      self.pluginSettings.reminders().forEach(function(r, i) {
        var percent = Math.round(Math.min((r.count() / r.interval()) * 100, 100));

        html += `<tr>
            <td>${r.message()}</td>
            <td style="text-align:right"><span id='count'>${r.count()}</span> / ${r.interval()} prints
            <button class="btn btn-mini btn-primary reminder-reset" data-index='${i}'>
              <i class="fa fa-refresh"></i> Reset</td>
            </button>
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
        MaintenanceReminderViewModel,
        ["settingsViewModel"],
        [
            "#settings_plugin_maintenance_reminder",
            "#navbar_plugin_maintenance_reminder"
        ]
    ]);

});
