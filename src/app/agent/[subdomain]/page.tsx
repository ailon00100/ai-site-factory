import { notFound } from 'next/navigation';
import { getAgentBySubdomain } from '@/lib/agents';
import ChatInterface from '@/components/ChatInterface';
import CreativeInterface from '@/components/CreativeInterface';
import AnalystInterface from '@/components/AnalystInterface';
import IndustrySidebar from '@/components/IndustrySidebar';
import GlobalHeader from '@/components/GlobalHeader';

interface Props {
  params: { subdomain: string };
}

export default async function AgentPage({ params }: Props) {
  const { subdomain } = await params;
  const agent = await getAgentBySubdomain(subdomain);

  if (!agent) {
    notFound();
  }

  // 站点级 UI 覆写（子域名维度），优先级最高
  const SUBDOMAIN_UI_OVERRIDES: Record<string, 'creative' | 'analyst' | 'chat'> = {
    outfit: 'creative',  // 穿搭灵感 → 图像生成界面
  };

  const resolveTemplate = (): 'creative' | 'analyst' | 'chat' => {
    if (agent.ui_template) return agent.ui_template;
    if (SUBDOMAIN_UI_OVERRIDES[subdomain]) return SUBDOMAIN_UI_OVERRIDES[subdomain];
    const category = agent.category;
    if (category === 'vision') return 'creative';
    if (['code', 'pro', 'business'].includes(category)) return 'analyst';
    return 'chat';
  };

  const renderInterface = () => {
    const tmpl = resolveTemplate();

    if (tmpl === 'creative') {
      return <CreativeInterface agent={agent} />;
    }

    if (tmpl === 'analyst') {
      return <AnalystInterface agent={agent} />;
    }

    return (
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col border-r border-gray-800/50">
          <ChatInterface agent={agent} />
        </div>
        <IndustrySidebar agent={agent} />
      </div>
    );
  };

  return (
    <main className="h-screen bg-[#030712] flex flex-col overflow-hidden">
      <GlobalHeader agent={agent} />
      
      <div className="flex-1 overflow-hidden pt-16">
        {renderInterface()}
      </div>
    </main>
  );
}
