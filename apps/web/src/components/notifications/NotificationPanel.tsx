import { NotificationTabs } from "./NotificationTabs";

export default function NotificationPanel() {
  return (
    <NotificationTabs
      locale={"en"}
      unread={{ all: 4, matches: 3, messages: 1 }}
      onTabChange={(from, to) => {
        // Telemetry (replace with your analytics client)
        window.dispatchEvent(new CustomEvent("analytics", { detail: { event: "notification.tab_changed", from, to } }));
      }}
      onRequestClose={() => {
        // if shown in a mobile sheet/modal, close it here
        document.dispatchEvent(new Event("close-notifications"));
      }}
      renderPanel={(key) => {
        if (key === "all") return <div>All notifications go here…</div>;
        if (key === "matches") return <div>Match events…</div>;
        if (key === "messages") return <div>Message threads…</div>;
        return null;
      }}
    />
  );
}

