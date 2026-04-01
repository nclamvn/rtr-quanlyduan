import { lazy, Suspense } from "react";
import { Settings, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAppStore } from "../stores/appStore";
import { useData } from "../contexts/DataContext";
import { LANG } from "../constants";
import { Section } from "../components/ui";
import WebhookSettings from "../components/WebhookSettings";
import ReportBuilder from "../components/ReportBuilder";

const EmailPreferences = lazy(() => import("../components/EmailNotifications"));

export default function SettingsPage() {
  const { user: currentUser } = useAuth();
  const lang = useAppStore((s) => s.lang);
  const { projects, issues, teamMembers, activeGateConfig } = useData();
  const t = LANG[lang];

  return (
    <Suspense fallback={null}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
          <Settings size={16} />
          {t.tabs.settings}
        </div>
        <ReportBuilder
          projects={projects}
          issues={issues}
          teamMembers={teamMembers}
          gateConfig={activeGateConfig}
          lang={lang}
        />
        <Section
          title={
            <>
              <Mail size={14} /> {t.email?.preferences || "Email Preferences"}
            </>
          }
        >
          <EmailPreferences lang={lang} currentUser={currentUser} />
        </Section>
        <WebhookSettings lang={lang} />
      </div>
    </Suspense>
  );
}
