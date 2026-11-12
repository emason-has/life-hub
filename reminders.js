// =====================================================================
// REMINDERS: notifications through your iPhone Calendar
//
// A web app on iPhone can't send its own timed notifications without a
// paid server. Your Calendar can, so this makes calendar files (.ics)
// with alerts that you add to Calendar once:
//
//   1. Repeating reminders (add once): morning check-in, Sunday reset,
//      measurements every 2 weeks, monthly backup.
//   2. This week's workouts (add each week after planning): each session
//      at your usual time, with a 30 minute heads-up.
// =====================================================================

// ---------- Times ----------
function reminderTimes() {
  const s = data.settings;
  return { weekday: s.gymWeekday || "17:00", weekend: s.gymWeekend || "08:00", morning: s.checkinTime || "07:30" };
}

// "07:30" becomes "7:30am".
function niceTime(t) { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`; }

// ---------- Building the calendar file ----------
function icsDate(key, time) { return key.replace(/-/g, "") + "T" + time.replace(":", "") + "00"; }
function icsText(t) { return String(t).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => "\\" + m); }

// One event. rule = a repeat rule like "FREQ=WEEKLY", alarm = minutes before.
function icsEvent({ uid, key, time, mins = 30, title, note = "", rule = "", alarm = 0 }) {
  const end = new Date(fromKey(key).getTime());
  const [h, m] = time.split(":").map(Number);
  end.setHours(h, m + mins);
  const endKey = toKey(end), endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
  return ["BEGIN:VEVENT", `UID:${uid}@lifehub`, `DTSTAMP:${icsDate(todayKey(), "00:00")}Z`,
    `DTSTART;TZID=Australia/Perth:${icsDate(key, time)}`, `DTEND;TZID=Australia/Perth:${icsDate(endKey, endTime)}`,
    `SUMMARY:${icsText(title)}`, note ? `DESCRIPTION:${icsText(note)}` : "", rule ? `RRULE:${rule}` : "",
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(title)}`, `TRIGGER:-PT${alarm}M`, "END:VALARM", "END:VEVENT"]
    .filter(Boolean).join("\r\n");
}

function icsFile(events) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Life Hub//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE", "TZID:Australia/Perth", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:+0800", "TZOFFSETTO:+0800", "TZNAME:AWST", "END:STANDARD", "END:VTIMEZONE",
    ...events, "END:VCALENDAR"].join("\r\n");
}

// Next date (from today) that falls on a weekday: 0 = Sunday.
function nextDay(weekday) {
  for (let i = 0; i < 7; i++) { const k = addDays(todayKey(), i); if (fromKey(k).getDay() === weekday) return k; }
  return todayKey();
}

function repeatingEvents() {
  const t = reminderTimes();
  const firstOfMonth = (() => { const d = fromKey(todayKey()); d.setMonth(d.getMonth() + 1, 1); return toKey(d); })();
  return [
    icsEvent({ uid: "checkin", key: addDays(todayKey(), 1), time: t.morning, mins: 5, rule: "FREQ=DAILY",
      title: "Life Hub check-in", note: "Paste from Health (sleep and steps), then check your Trainer card for today." }),
    icsEvent({ uid: "sunday-reset", key: nextDay(0), time: "16:00", mins: 20, rule: "FREQ=WEEKLY;BYDAY=SU",
      title: "Sunday reset", note: "Sort your brain dump, plan your week and meals, then add this week's workouts to Calendar." }),
    icsEvent({ uid: "measure", key: nextDay(0), time: "09:00", mins: 10, rule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=SU",
      title: "Measurements", note: "Waist and hips (and weight) in Life Hub: More, Body & measurements." }),
    icsEvent({ uid: "backup", key: firstOfMonth, time: "19:00", mins: 5, rule: "FREQ=MONTHLY",
      title: "Life Hub backup", note: "Settings & backup, then Export and Save to Files." })
  ];
}

// Planned sessions from today to Sunday, at your usual times.
function weekEvents() {
  const t = reminderTimes();
  const days = weekKeys(mondayOf(todayKey())).filter((k) => k >= todayKey());
  return days.flatMap((key) => sessionsOn(key).filter((s) => s.status === "planned" && s.type !== "rest").map((s) => {
    const weekend = [0, 6].includes(fromKey(key).getDay());
    const surfTime = s.type === "surf" && s.note && (s.note.match(/(\d{1,2})(am|pm)/) || null);
    const time = surfTime ? `${String(Number(surfTime[1]) % 12 + (surfTime[2] === "pm" ? 12 : 0)).padStart(2, "0")}:00` : weekend ? t.weekend : t.weekday;
    const info = typeInfo(s.type);
    const name = sessionTitle(s) || info.label;
    return icsEvent({ uid: "s-" + s.id, key, time, mins: info.mins || 30, alarm: 30,
      title: `${name}${s.optional ? " (optional)" : ""}`, note: `${info.label}${s.note ? `: ${s.note}` : ""}. Open Life Hub and tap Start.` });
  }));
}

// Hands the file to iPhone: the share sheet (pick Calendar, or Save to Files then tap it).
async function shareCalendar(name, events) {
  if (!events.length) return toast("Nothing to add. Plan your week first.");
  const file = new File([icsFile(events)], name, { type: "text/calendar" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Add to Calendar" });
    } else {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    }
    return true;
  } catch (err) {
    if (err.name !== "AbortError") toast("Couldn't make the calendar file. Try again?");
    return false;
  }
}

// ---------- Card (Settings and the Trainer screen) ----------
function remindersHTML() {
  const t = reminderTimes();
  const s = data.settings;
  return `<div class="card">
      <p class="label" style="margin-top:0">Reminders</p>
      <p class="small" style="margin:0 0 10px">Notifications come through your iPhone Calendar. Add the repeating ones once, and this week's workouts after you plan each week.</p>
      <button class="full dark" data-action="cal-repeating">${icon("bell")} Add repeating reminders${s.remindersAdded ? " again" : ""}</button>
      <p class="small muted" style="margin:-4px 0 10px">Daily check-in at ${niceTime(t.morning)}, Sunday reset 4pm, measurements every 2nd Sunday, backup monthly.${s.remindersAdded ? ` Added ${niceDate(s.remindersAdded)}: adding again makes doubles.` : ""}</p>
      <button class="full" data-action="cal-week">${icon("calendar")} Add this week's workouts</button>
      <div class="row" style="gap:8px">
        <label class="field grow">Weekday workouts<input type="time" data-setting="gymWeekday" value="${t.weekday}"></label>
        <label class="field grow">Weekend workouts<input type="time" data-setting="gymWeekend" value="${t.weekend}"></label>
      </div>
      <label class="field" style="margin-bottom:6px">Morning check-in<input type="time" data-setting="checkinTime" value="${t.morning}"></label>
      <details class="small"><summary class="muted">How to add them</summary>
        <ol style="margin:8px 0 0;padding-left:18px">
          <li>Tap a button above. The share sheet opens.</li>
          <li>If you see <b>Calendar</b>, tap it and then <b>Add All</b>.</li>
          <li>If not, tap <b>Save to Files</b>, open the Files app, tap the file, then <b>Add All</b>.</li>
          <li>Check Settings, Calendar, Default Alert Times isn't set to None.</li>
        </ol>
      </details>
    </div>`;
}

Object.assign(ACTIONS, {
  async "cal-repeating"() {
    if (data.settings.remindersAdded && !confirm("You've added these before. Adding again makes doubles in your Calendar. Go ahead?")) return;
    if (await shareCalendar("life-hub-reminders.ics", repeatingEvents())) {
      data.settings.remindersAdded = todayKey();
      saveData();
      render();
    }
  },
  async "cal-week"() {
    if (await shareCalendar(`life-hub-week-${mondayOf(todayKey())}.ics`, weekEvents())) {
      data.settings.weekInCalendar = mondayOf(todayKey());
      saveData();
      render();
    }
  }
});
