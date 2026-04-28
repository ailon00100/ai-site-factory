/**
 * AI Site Factory - Zeabur 自动化批量部署脚本
 * 作用：读取数据库中的 Agent 配置，并在 Zeabur 上自动化部署对应的子站点。
 */

import fetch from 'node-fetch';
import 'dotenv/config';

// NOTE: 请确保在 .env.local 中配置了以下变量
const ZEABUR_API_TOKEN = process.env.ZEABUR_API_TOKEN;
const ZEABUR_PROJECT_ID = process.env.ZEABUR_PROJECT_ID; // 您的项目 ID
const GITHUB_REPO_ID = process.env.GITHUB_REPO_ID;       // 您的 GitHub 仓库 ID（Zeabur 内部 ID）

const ENDPOINT = 'https://api.zeabur.com/graphql';

/**
 * 通用 GraphQL 请求函数
 */
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

/**
 * 1. 创建服务
 */
async function createService(name) {
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
    repoID: GITHUB_REPO_ID
  });
  return data.createService._id;
}

/**
 * 2. 更新环境变量
 */
async function updateEnv(serviceId, subdomain) {
  const mutation = `
    mutation updateEnvironmentVariables($serviceID: ObjectID!, $variables: [VariableInput!]!) {
      updateEnvironmentVariables(serviceID: $serviceID, variables: $variables)
    }
  `;
  
  // 注入站点专属变量和全局 API Key
  const variables = [
    { name: 'NEXT_PUBLIC_AGENT_SUBDOMAIN', value: subdomain },
    { name: 'SILICONFLOW_API_KEY', value: process.env.SILICONFLOW_API_KEY },
    { name: 'DEEPSEEK_API_KEY', value: process.env.DEEPSEEK_API_KEY },
    { name: 'ALIYUN_BAILIAN_KEY', value: process.env.ALIYUN_BAILIAN_KEY },
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
  ];

  await gqlRequest(mutation, { serviceID: serviceId, variables });
}

/**
 * 3. 自动绑定子域名 (zeabur.app)
 */
async function exposeService(serviceId, subdomain) {
  const mutation = `
    mutation exposeService($serviceID: ObjectID!, $subdomain: String!) {
      exposeService(serviceID: $serviceID, subdomain: $subdomain) {
        _id
      }
    }
  `;
  await gqlRequest(mutation, { serviceID: serviceId, subdomain: subdomain });
}

/**
 * 主执行函数
 */
async function deployAgentNode(agentName, subdomain) {
  try {
    console.log(`🚀 开始部署 Agent: ${agentName} (${subdomain}.zeabur.app)...`);
    
    // Step 1: 创建服务
    const serviceId = await createService(`${agentName}-node`);
    console.log(`✅ 服务创建成功: ${serviceId}`);

    // Step 2: 注入环境变量
    await updateEnv(serviceId, subdomain);
    console.log(`✅ 环境变量注入成功`);

    // Step 3: 绑定域名
    await exposeService(serviceId, subdomain);
    console.log(`✅ 域名绑定成功: ${subdomain}.zeabur.app`);

    console.log(`🎉 ${agentName} 部署任务完成！\n`);
  } catch (err) {
    console.error(`❌ ${agentName} 部署失败:`, err.message);
  }
}

// 示例：批量部署前 3 个站点
const AGENTS_TO_DEPLOY = [
  { name: 'Content Master', subdomain: 'content-ai' },
  { name: 'Code Auditor', subdomain: 'code-check' },
  { name: 'Design Pro', subdomain: 'design-gen' },
];

async function main() {
  if (!ZEABUR_API_TOKEN || !ZEABUR_PROJECT_ID) {
    console.error('❌ 请先在 .env.local 中配置 ZEABUR_API_TOKEN 和 ZEABUR_PROJECT_ID');
    return;
  }

  for (const agent of AGENTS_TO_DEPLOY) {
    await deployAgentNode(agent.name, agent.subdomain);
  }
}

main();
