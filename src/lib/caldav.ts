import { fetch } from "@tauri-apps/plugin-http";
import { createDAVClient } from "tsdav";

const SERVER_URL = import.meta.env.VITE_CALDAV_URL;
const USERNAME = import.meta.env.VITE_CALDAV_USERNAME;
const PASSWORD = import.meta.env.VITE_CALDAV_PASSWORD;

let clientInstance: Awaited<ReturnType<typeof createDAVClient>> | null = null;

async function getClient() {
  if (clientInstance) return clientInstance;

  clientInstance = await createDAVClient({
    serverUrl: `${SERVER_URL}/remote.php/dav`,
    credentials: {
      username: USERNAME,
      password: PASSWORD,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
    fetch: fetch as unknown as typeof window.fetch,
  });

  return clientInstance;
}

export async function getTaskLists() {
  const client = await getClient();
  const calendars = await client.fetchCalendars();
  return calendars.filter((cal) => cal.components?.includes("VTODO"));
}

export async function getTasks(calendarUrl: string) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VTODO"/>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const response = await fetch(calendarUrl, {
    method: "REPORT",
    headers: {
      "Content-Type": "application/xml",
      "Depth": "1",
      "Authorization": "Basic " + btoa(`${USERNAME}:${PASSWORD}`),
    },
    body,
  });

  return await response.text();
}

export function parseTasksFromXML(xml: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const calendarDatas = doc.querySelectorAll("calendar-data");

  return Array.from(calendarDatas).map((node) => {
    const ics = node.textContent || "";
    const get = (field: string) => {
      const match = ics.match(new RegExp(`${field}:(.+)`));
      return match ? match[1].trim() : "";
    };

    return {
      uid: get("UID"),
      summary: get("SUMMARY"),
      status: get("STATUS"),
      priority: get("PRIORITY"),
      percentComplete: get("PERCENT-COMPLETE"),
      due: get("DUE"),
      created: get("CREATED"),
      icsData: ics,
    };
  });
}

export async function createTask(calendarUrl: string, summary: string) {
  const uid = crypto.randomUUID();
  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Simple-Tasks//EN
BEGIN:VTODO
UID:${uid}
DTSTAMP:${now}
CREATED:${now}
LAST-MODIFIED:${now}
SUMMARY:${summary}
STATUS:NEEDS-ACTION
PERCENT-COMPLETE:0
END:VTODO
END:VCALENDAR`;

  await fetch(`${calendarUrl}${uid}.ics`, {
    method: "PUT",
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Authorization": "Basic " + btoa(`${USERNAME}:${PASSWORD}`),
    },
    body: ics,
  });

  return { uid, summary, status: "NEEDS-ACTION", percentComplete: "0", priority: "", due: "", created: now, icsData: ics };
}

export async function completeTask(calendarUrl: string, task: { uid: string; icsData: string }) {
  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

  const updatedIcs = task.icsData
    .replace(/STATUS:.+/, "STATUS:COMPLETED")
    .replace(/PERCENT-COMPLETE:.+/, "PERCENT-COMPLETE:100")
    + (task.icsData.includes("COMPLETED:") ? "" : `\nCOMPLETED:${now}`);

  await fetch(`${calendarUrl}${task.uid}.ics`, {
    method: "PUT",
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Authorization": "Basic " + btoa(`${USERNAME}:${PASSWORD}`),
    },
    body: updatedIcs,
  });
}