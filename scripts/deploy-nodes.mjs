/**
 * AI Site Factory - Zeabur 自动化批量部署脚本
 * 从 Supabase 数据库读取全部活跃 Agent，在 Zeabur 上自动化部署对应子站点。
 *
 * 用法: node scripts/deploy-nodes.mjs [--dry-run] [--limit N]
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('.env.local') });

const ZEABUR_API_TOKEN = process.env.ZEABUR_API_TOKEN;
const ZEABUR_PROJECT_ID = process.env.ZEABUR_PROJECT_ID;
const ZEABUR_REPO_ID = process.env.ZEABUR_REPO_ID;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ENDPOINT = 'https://api.zeabur.com/graphql';
const DEPLOY_DELAY_MS = 3000;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) || 10 : 0;

async function gqlRequest(query, variables = {}) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZEABUR_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors) {
    console.error('GraphQL Errors:', JSON.stringify(json.errors, null, 2));
    throw new Error('API Request Failed');
  }
  return json.data;
}

async function listExistingServices() {
  const query = `
    query listServices($projectID: ObjectID!) {
      services(projectID: $projectID) {
        _id
        name
        subdomain
      }
    }
  `;
  const data = await gqlRequest(query, { projectID: ZEABUR_PROJECT_ID });
  return data.services || [];
}

async function createService(name) {
  if (DRY_RUN) {
    console.log(`   [DRY RUN] 将创建服务: ${name}`);
    return 'fake-service-id';
  }
  const mutation = `
    mutation createService($projectID: ObjectID!, $name: String!, $repoID: Long!) {
      createService(projectID: $projectID, name: $name, repoID: $repoID) {
        _id
      }
    }
  `;
  const data = await gqlRequest(mutation, {
    projectID: ZEABUR_PROJECT_ID,
    name: name,
    repoID: ZEABUR_REPO_ID
  });
  return data.createService._id;
}

async function updateEnv(serviceId, subdomain) {
  if (DRY_RUN) {
    console.log(`   [DRY RUN] 将注入环境变量: NEXT_PUBLIC_AGENT_SUBDOMAIN=${subdomain}`);
    return;
  }
  const mutation = `
    mutation updateEnvironmentVariables($serviceID: ObjectID!, $variables: [VariableInput!]!) {
      updateEnvironmentVariables(serviceID: $serviceID, variables: $variables)
    }
  `;

  const variables = [
    { name: 'NEXT_PUBLIC_AGENT_SUBDOMAIN', value: subdomain },
    { name: 'SILICONFLOW_API_KEY', value: process.env.SILICONFLOW_API_KEY || '' },
    { name: 'DEEPSEEK_API_KEY', value: process.env.DEEPSEEK_API_KEY || '' },
    { name: 'ALIYUN_BAILIAN_KEY', value: process.env.ALIYUN_BAILIAN_KEY || '' },
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL || '' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY || '' },
  ];

  await gqlRequest(mutation, { serviceID: serviceId, variables });
}

async function exposeService(serviceId, subdomain) {
  if (DRY_RUN) {
    console.log(`   [DRY RUN] 将绑定域名: ${subdomain}.zeabur.app`);
    return;
  }
  const mutation = `
    mutation exposeService($serviceID: ObjectID!, $subdomain: String!) {
      exposeService(serviceID: $serviceID, subdomain: $subdomain) {
        _id
      }
    }
  `;
  await gqlRequest(mutation, { serviceID: serviceId, subdomain: subdomain });
}

async function deployAgentNode(agent) {
  const { subdomain, name, category } = agent;
  try {
    console.log(`🚀 部署 ${name} (${subdomain}.zeabur.app) [${category}]...`);

    const serviceId = await createService(`${subdomain}-node`);
    console.log(`   ✅ 服务创建: ${serviceId}`);

    await updateEnv(serviceId, subdomain);
    console.log(`   ✅ 环境变量注入`);

    if (!DRY_RUN) {
      await exposeService(serviceId, subdomain);
      console.log(`   ✅ 域名绑定: ${subdomain}.zeabur.app`);
    }

    console.log(`   🎉 ${name} 部署完成\n`);
    return true;
  } catch (err) {
    console.error(`   ❌ ${name} 部署失败:`, err.message, '\n');
    return false;
  }
}

async function loadAgentFromEnv() {
  const subdomain = process.env.NEXT_PUBLIC_AGENT_SUBDOMAIN;
  if (!subdomain) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await supabase
    .from('agents')
    .select('*')
    .eq('subdomain', subdomain)
    .single();

  return data;
}

async function main() {
  if (!ZEABUR_API_TOKEN || !ZEABUR_PROJECT_ID) {
    console.error('❌ 请先在 .env.local 中配置 ZEABUR_API_TOKEN 和 ZEABUR_PROJECT_ID');
    return;
  }

  if (!ZEABUR_REPO_ID) {
    console.error('❌ 请先在 .env.local 中配置 ZEABUR_REPO_ID (Zeabur 内部仓库数字 ID)');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 尝试从当前环境变量判断是否是单节点部署模式
  const singleAgent = await loadAgentFromEnv();
  if (singleAgent) {
    console.log(`📌 检测到单节点部署模式: ${singleAgent.name}\n`);
    await deployAgentNode(singleAgent);
    return;
  }

  // 批量模式: 从数据库读取全部活跃代理
  let query = supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (LIMIT > 0) {
    query = query.limit(LIMIT);
  }

  const { data: agents, error } = await query;

  if (error || !agents || agents.length === 0) {
    console.error('❌ 未找到活跃代理:', error?.message || '数据库为空');
    return;
  }

  console.log(`\n📊 共发现 ${agents.length} 个活跃代理${DRY_RUN ? ' (演练模式)' : ''}\n`);

  // 检查已存在服务，避免重复部署
  const existingServices = DRY_RUN ? [] : await listExistingServices();
  const existingNames = new Set(existingServices.map(s => s.name));
  console.log(`📋 已有 ${existingNames.size} 个服务在线\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const serviceName = `${agent.subdomain}-node`;

    if (existingNames.has(serviceName)) {
      console.log(`⏭️  跳过 ${agent.name} (${agent.subdomain}) — 服务已存在`);
      skipCount++;
      continue;
    }

    console.log(`[${i + 1}/${agents.length}]`);
    const ok = await deployAgentNode(agent);
    if (ok) successCount++;
    else failCount++;

    // 部署间隔，避免 API 限流
    if (i < agents.length - 1 && !DRY_RUN) {
      await new Promise(r => setTimeout(r, DEPLOY_DELAY_MS));
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 部署完成: 成功 ${successCount} | 跳过 ${skipCount} | 失败 ${failCount}`);
  console.log(`${'='.repeat(50)}\n`);
}

main();
