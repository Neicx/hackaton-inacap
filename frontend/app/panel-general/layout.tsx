import Sidebar from '@/components/Sidebar';

export default function PanelGeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-60 min-h-screen">{children}</div>
    </div>
  );
}
