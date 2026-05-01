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

  // 根据分类决定使用的界面模板
  const renderInterface = () => {
    const category = agent.category;
    
    if (['vision', 'multimedia', 'marketing'].includes(category)) {
      return <CreativeInterface agent={agent} />;
    }
    
    if (['code', 'pro', 'business'].includes(category)) {
      return <AnalystInterface agent={agent} />;
    }
    
    // 默认使用标准对话界面
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
