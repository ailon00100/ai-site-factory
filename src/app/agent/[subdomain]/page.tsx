import { notFound } from 'next/navigation';
import { getAgentBySubdomain } from '@/lib/agents';
import ChatInterface from '@/components/ChatInterface';
import IndustrySidebar from '@/components/IndustrySidebar';

interface Props {
  params: { subdomain: string };
}

export default async function AgentPage({ params }: Props) {
  // 注意：在 Next.js 15+ 中，params 是一个 Promise
  const { subdomain } = await params;
  const agent = await getAgentBySubdomain(subdomain);

  if (!agent) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#030712] flex flex-col">
      {/* 顶部导航 */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${agent.primary_color}20`, color: agent.primary_color }}
            >
              {agent.icon}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{agent.name}</h1>
              <p className="text-xs text-gray-400">{agent.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* 左侧聊天区域 */}
        <div className="flex-1 flex flex-col border-r border-gray-800/50">
          <ChatInterface agent={agent} />
        </div>

        {/* 右侧行业信息侧边栏 - 现在使用 Client Component */}
        <IndustrySidebar agent={agent} />
      </div>
    </main>
  );
}
