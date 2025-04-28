import { Metadata } from "next";

export const metadata: Metadata = {
  title: "マイ本棚 | DevLibro",
  description: "あなたの技術書コレクションを管理しましょう",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6 pb-8 pt-2">
      <h1 className="text-2xl font-bold">マイ本棚</h1>
      <p>Coming soon... (開発中)</p>
    </div>
  );
}
