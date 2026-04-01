import TeamTab from "../components/TeamTab";
import { useData } from "../contexts/DataContext";
import { useAppStore } from "../stores/appStore";
import { LANG } from "../constants";

export default function TeamPage() {
  const { teamMembers, issues, projects } = useData();
  const lang = useAppStore((s) => s.lang);
  const t = LANG[lang];

  return <TeamTab teamMembers={teamMembers} issues={issues} projects={projects} lang={lang} t={t} />;
}
