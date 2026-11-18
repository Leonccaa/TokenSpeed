'use strict';

(() => {
  const preferenceKey = 'ts3.language';
  const preferredLanguage = navigator.languages?.[0] || navigator.language || '';
  let language = /^zh(?:-|$)/i.test(preferredLanguage) ? 'zh-CN' : 'en';
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved === 'zh-CN' || saved === 'en') language = saved;
  } catch (_) {}
  const english = {
    "TokenSpeed · 测测你的大模型 API 有多快": "TokenSpeed · LLM API Benchmark",
    "一键测出大模型 API 的响应延迟、读取速度、单发峰值速度和并发生成速度": "Measure LLM API response latency, prefill throughput, single-request peak and concurrent decode speed.",
    "音效": "Sound",
    "公开榜单": "Public Rankings",
    "榜单": "Rankings",
    "历史记录": "Benchmark history",
    "历史": "History",
    "响应延迟": "Response latency",
    "读取速度": "Prefill throughput",
    "峰值速度": "Peak speed",
    "并发速度": "Concurrent throughput",
    "选择服务商": "Choose a provider",
    "接口地址": "API endpoint",
    "OpenAI 格式": "OpenAI format",
    "Anthropic 格式": "Anthropic format",
    "去获取 →": "Get a key →",
    "粘贴你的 API Key": "Paste your API key",
    "显示或隐藏 Key": "Show or hide API key",
    "模型": "Model",
    "例如 deepseek-chat": "e.g. deepseek-chat",
    "获取列表": "Get models",
    "思考模式": "Thinking mode",
    "跟随接口": "Provider default",
    "开启": "On",
    "关闭": "Off",
    "需上游模型支持思考开关。": "The model provider must support the thinking switch.",
    "开始测速": "Start benchmark",
    "没有 Key？先看演示": "No API key? Try the demo",
    "高级设置": "Advanced settings",
    "资料长度": "Input length",
    "并发请求数": "Concurrent requests",
    "并发输出上限": "Output limit per concurrent request",
    "测试项目": "Tests",
    "单发峰值": "Single-request peak",
    "并发生成": "Concurrent generation",
    "仅 vLLM / SGLang 等自部署服务支持：强制生成到最大长度": "For self-hosted services such as vLLM or SGLang. Generate up to the output limit.",
    "额外请求参数（JSON，可选）": "Extra request parameters (optional JSON)",
    "例如 {\"temperature\": 0.7}": "e.g. {\"temperature\": 0.7}",
    "Key 只在当前页面保留，刷新后需重新填写。点击「获取列表」或「开始测速」时才向所选接口发送。使用服务端代理时，Key 由本站转发。": "The API key stays in this page until you reload. It is sent to the selected API when you click Get models or Start benchmark. Server-proxied requests pass through this site.",
    "停止": "Stop",
    "各领域单路解码速度": "Decode speed by domain",
    "按各路自己的首末输出时间计算，单位 tok/s": "Measured from each request’s first to last output, in tok/s",
    "查看详细数据": "View detailed results",
    "再测一次": "Run again",
    "保存分享图": "Save share image",
    "复制结果": "Copy result",
    "提交上榜": "Submit to rankings",
    "换个模型": "Change model",
    "上榜需要完整的 Prefill、单发峰值和同时解码成绩。": "Ranking submissions need complete Prefill, single-request peak and concurrent decode scores.",
    "准备中": "Preparing",
    "生成速度": "Output speed",
    "柱条 = 数据块到达，越高表示一块里的 token 越多": "Each bar shows one output chunk. Taller bars contain more tokens.",
    "最近 15 秒": "Last 15 seconds",
    "按输出块采样": "Sampled per output chunk",
    "够了，直接出结果": "End generation and show results",
    "测试语料：": "Test inputs:",
    "编程题库，以及按模板生成的订单、新闻、数学题和客服对话 · 结果受网络和服务端负载影响，仅供参考": "coding tasks, plus generated orders, news, math exercises and support dialogs. Results vary with network and server load.",
    "清空": "Clear",
    "关闭榜单": "Close rankings",
    "成绩由访客自愿提交。设备和框架由提交者填写，网络与测速设置会影响成绩。": "Visitors submit results voluntarily and report their own hardware and engine. Network conditions and benchmark settings affect scores.",
    "排序": "Sort by",
    "综合分": "Overall score",
    "同时解码": "Concurrent decode",
    "榜单表格": "Rankings table",
    "名次": "Rank",
    "模型 / 设备 / 框架": "Model / Hardware / Engine",
    "计分与入榜": "Scoring and eligibility",
    "综合分是三项成绩分别除以 4,000、200、800 tok/s 后的几何平均值，再乘以 1,000 并四舍五入。同一模型、设备和框架组合保留最高综合分。每种排序显示前 100 条。": "The overall score is the geometric mean of the three speeds divided by 4,000, 200 and 800 tok/s respectively, multiplied by 1,000 and rounded. Each model, hardware and engine combination keeps its highest overall score. Each sort shows the top 100.",
    "确认公开成绩": "Review your public entry",
    "点「确认上榜」后，以下信息会存到本站服务器并公开展示。请勿在字段中填写 Key、接口地址或私人信息。": "Confirm submission to save and display this information publicly. Keep API keys, endpoints and personal information out of these fields.",
    "设备": "Hardware",
    "如 4× V100 32GB，或未知": "e.g. 4× V100 32GB, or Unknown",
    "推理框架": "Inference engine",
    "如 ReVolta，或未知": "e.g. ReVolta, or Unknown",
    "确认上榜": "Confirm submission",
    "暂不上榜": "Cancel",
    "自定义 / 自部署": "Self-hosted / Custom",
    "通义千问": "Qwen",
    "智谱 GLM": "Zhipu GLM",
    "硅基流动": "SiliconFlow",
    "火山方舟": "Volcano Engine",
    "不可用": "Unavailable",
    " 秒": " s",
    " 毫秒": " ms",
    "演示服务（模拟数据）": "Demo service (simulated data)",
    "音效开": "Sound on",
    "请求开启": "Request on",
    "请求关闭": "Request off",
    "适用于支持思考开关的 vLLM / SGLang 兼容接口。": "For vLLM / SGLang-compatible APIs that support a thinking switch.",
    "例如 {0}": "e.g. {0}",
    "填写模型名称，或点「获取列表」": "Enter a model name or click “Get models”",
    "浏览器要求通过 HTTPS 打开 TokenSpeed 才能访问你的本机接口": "Open TokenSpeed over HTTPS to access a local API",
    "本机直连组件加载失败": "Unable to load the local API client",
    "本次大约消耗：输入 <b>{0}</b> tokens": "Estimated usage: <b>{0}</b> input tokens",
    "（其中约 <b>{0}</b> 可命中缓存，通常更便宜）": " (about <b>{0}</b> potentially cached)",
    "，输出最多 <b>{0}</b> tokens。": " and up to <b>{0}</b> output tokens.",
    "浏览器直连你的本机接口。请允许本站访问本机，模型服务也需允许本站跨域访问。": "Your browser connects directly. Allow local network access and enable CORS on the model server.",
    "浏览器要求通过 HTTPS 打开 TokenSpeed 才能访问你的本机接口。": "Open TokenSpeed over HTTPS to access a local API.",
    "发一句话，多久开始回复": "Measure how soon a short request starts streaming.",
    "并发发送 {0} 份目标约 {1} tokens 的资料，计时至各路首包": "Send {0} concurrent inputs of about {1} tokens and time their first output.",
    "单独写一段代码，按逐块用量计算最快 2 秒": "Use a coding task and per-chunk usage to find the fastest 2 seconds.",
    "{0} 路同时写不同领域的长文": "Run {0} concurrent writing tasks across different domains.",
    "收起高级设置": "Hide advanced settings",
    "请先填写 API Key": "Enter an API key first",
    "请先填写接口地址": "Enter the API endpoint first",
    "获取中": "Fetching…",
    "· 可选 {0} 个": "· {0} available",
    "获取到 {0} 个模型，点模型输入框即可选择": "Found {0} models. Select one in the model field.",
    "获取模型列表失败：": "Could not get models: ",
    "延迟": "Latency",
    "读取": "Prefill",
    "读取速度 · 整体吞吐": "Prefill · aggregate throughput",
    "能用": "Usable",
    "流畅": "Smooth",
    "飞快": "Very fast",
    "起飞": "Excellent",
    "峰值": "Peak",
    "单发峰值速度": "Single-request peak",
    "并发": "Concurrency",
    "实时并发输出速度": "Live concurrent output",
    "强劲": "Strong",
    "爆表": "Exceptional",
    "偏慢": "Slow",
    "极快": "Excellent",
    "良好": "Good",
    "一般": "Fair",
    "测量中": "Measuring",
    "起步": "Starting",
    "毫秒": "ms",
    "测速服务异常 HTTP ": "Benchmark service returned HTTP ",
    "请填写接口地址": "Enter the API endpoint",
    "请先粘贴 API Key": "Paste your API key first",
    "请填写模型名称": "Enter the model name",
    "额外请求参数不是合法的 JSON": "Extra request parameters are invalid JSON",
    "请至少开启一个测试项目": "Enable at least one test",
    "请通过 HTTPS 打开 TokenSpeed，再测速你的本机接口": "Open TokenSpeed over HTTPS before testing a local API",
    "{0} · {1}{2} 资料 · {3} 并发": "{0} · {1}{2} input tokens · concurrency {3}",
    "浏览器直连 · ": "Direct browser connection · ",
    "无法连接测速服务，请确认 npm start 正在运行": "Could not connect to the benchmark service. Check that npm start is running.",
    "已停止": "Stopped",
    "正在连接…": "Connecting…",
    "正在准备测试资料…": "Preparing test inputs…",
    "已连接 · 首次握手 {0}（不计入）": "Connected · initial handshake {0} (excluded)",
    "第 {0} / 3 次": "Sample {0} of 3",
    "最快 {0} · 平均 {1} · 抖动 {2} 毫秒": "Best {0} · Mean {1} · Jitter {2} ms",
    "秒": "s",
    "{0} 路请求已发出，等第一份读完…": "Sent {0} requests. Waiting for the first response…",
    "正在读取 {0} 份资料": "Prefilling {0} inputs",
    "每份约 {0} tokens，来自不同领域": "About {0} tokens per input across different domains",
    "失败": "Failed",
    "无输入用量": "Input usage unavailable",
    "已读完 {0} / {1} 份": "Prefilled {0} of {1}",
    "整轮输入用量不完整": "Input usage is incomplete",
    "{0} 路共 {1} tokens，{2}收到全部首包": "{0} requests, {1} tokens total · all first outputs in {2}",
    "单路实时估算": "Live estimate · single request",
    "实时输出": "Live output",
    "1 路 · 写代码 · 最多 {0} tokens": "1 request · coding · up to {0} tokens",
    "短提示词 · 测速度上限": "Short prompt · measure peak speed",
    "等待第一个字…": "Waiting for first output…",
    "多路实时估算": "Live estimate · concurrent requests",
    "{0} 路 · 不同领域 · 每路最多 {1} tokens，全部写完出结果": "{0} requests across domains · up to {1} tokens each",
    "前缀复用「{0}」": "Reused prefix: {0}",
    "资料「{0}」": "Input: {0}",
    "{0} 路请求已发出…": "Sent {0} requests…",
    "等待中": "Waiting",
    "单发峰值速度 · 最快 2 秒": "Single-request peak · fastest 2 seconds",
    "解码平均 {0}{1}": "Mean decode {0}{1}",
    "（提前结束）": " (stopped early)",
    "{0} 路同时解码": "{0}-way concurrent decode",
    "共同解码窗口 {0}": "Shared decode window {0}",
    "需要共同解码窗口和逐块累计用量": "Requires an overlapping decode window and per-chunk usage",
    "已提前结束，并发吞吐成绩不可用。": "Stopped early. Concurrent throughput is unavailable.",
    "{0} / {1} 路完成，整轮用时 {2}。": "{0} of {1} requests completed in {2}.",
    " 最快的是 <b>#{0} {1}</b>，{2} tok/s。": " Fastest: <b>#{0} {1}</b> at {2} tok/s.",
    "满格 {0} tok/s": "Full scale {0} tok/s",
    "实时估算 · 最终成绩使用上游用量": "Live estimate · final scores use upstream token counts",
    "最快": "Best",
    "平均": "Mean",
    "抖动": "Jitter",
    "样本": "Samples",
    "已读完": "Prefilled",
    "份": "",
    "用时": "Elapsed",
    "已读 tokens": "Input tokens",
    "单份": "Per input",
    "首包时间": "First output",
    "解码平均": "Mean decode",
    "实时峰值估算": "Estimated peak",
    "已生成": "Generated",
    "单路平均": "Mean per request",
    "缓存命中": "Cache hits",
    "tok/s · 首包前有效输入吞吐": "tok/s · effective input before first output",
    "单发端到端": "Single E2E",
    "并发端到端": "Concurrent E2E",
    "单发端到端吞吐": "Single-request end-to-end throughput",
    "{0} 路端到端吞吐": "{0}-way end-to-end throughput",
    "端到端 tok/s": "E2E tok/s",
    "tok/s · 含首包等待": "tok/s · includes time to first output",
    "tok/s · 整轮用时": "tok/s · across the full batch",
    "精确峰值需逐块用量和完整 2 秒窗口，同时解码吞吐还需共同窗口": "The 2-second peak and shared-window decode scores require per-chunk token counts and a valid measurement window",
    "需逐块用量与完整 2 秒窗口": "Requires per-chunk usage and a full 2-second window",
    "tok/s · 固定 2 秒窗口": "tok/s · fixed 2-second window",
    "tok/s · 共同窗口 {0}": "tok/s · shared window {0}",
    "需要共同窗口和逐块用量": "Requires an overlapping window and per-chunk usage",
    "演示数据": "Demo data",
    "首次测试": "First run",
    "本机新纪录": "Personal record",
    "本机最佳 {0}": "Personal best {0}",
    "生成阶段提前结束": "Generation stopped early",
    "{0} 路共同解码期间共输出 <b>{1}</b> tokens": "{0} concurrent requests generated <b>{1}</b> tokens in their shared window",
    "读取测试平均首包 <b>{0}</b>": "Mean prefill time to first output <b>{0}</b>",
    "前缀缓存命中 {0}%": "Prefix cache hit rate {0}%",
    "测试已手动停止": "Test stopped manually",
    "服务": "Service",
    "请求路径": "Connection",
    "浏览器直连本机": "Browser to local API",
    "延迟 最快 / 平均": "Latency · best / mean",
    "{0} / {1} 毫秒": "{0} / {1} ms",
    "延迟抖动": "Latency jitter",
    "{0} 毫秒": "{0} ms",
    "读取 完成路数": "Prefill · completed requests",
    "每路输入用量范围": "Input tokens per request",
    "读取 有效输入吞吐（含缓存）": "Prefill · effective input throughput (including cached tokens)",
    "读取 已命中缓存": "Prefill · cached tokens",
    "读取 单路平均（含排队）": "Prefill · mean per request (including queue time)",
    "读取 首包平均 / 最慢": "Prefill · first output, mean / slowest",
    "读取失败": "Failed prefill requests",
    "{0} 路": "{0}",
    "单发 峰值（固定 2 秒）": "Single-request peak (fixed 2 seconds)",
    "单发 解码平均": "Single request · mean decode",
    "单发 端到端输出吞吐": "Single request · end-to-end output throughput",
    "单发 首包 / 输出用量": "Single request · first output / output tokens",
    "单发 输出块间隔 P50 / P99": "Single request · inter-chunk P50 / P99",
    "{0} 路同时解码吞吐": "{0}-way concurrent decode throughput",
    "共同解码窗口 / 输出量": "Shared decode window / output tokens",
    "并发 端到端输出吞吐": "Concurrent requests · end-to-end output throughput",
    "各路解码速率平均（最慢~最快）": "Mean decode per request (slowest–fastest)",
    "并发 平均首包": "Concurrent requests · mean time to first output",
    "缓存命中率": "Cache hit rate",
    "服务未返回": "Unavailable from provider",
    "并发 输出块间隔 P50 / P99": "Concurrent requests · inter-chunk P50 / P99",
    "并发用时 / 总生成": "Concurrent requests · elapsed / total output",
    "{0} 秒 / {1} tokens": "{0} s / {1} tokens",
    "并发失败": "Failed concurrent requests",
    "错误信息": "Error",
    "【TokenSpeed 大模型 API 测速】": "TokenSpeed LLM API benchmark",
    "模型：{0}（{1}）": "Model: {0} ({1})",
    "响应延迟：{0} 毫秒": "Response latency: {0} ms",
    "首包前有效输入吞吐：{0}": "Effective input throughput before first output: {0}",
    "单发 2 秒峰值：{0}，解码平均 {1}，端到端吞吐 {2}{3}": "Single-request 2-second peak: {0}, mean decode {1}, end-to-end {2}{3}",
    "{0} 路同时解码：{1}{2}": "{0}-way concurrent decode: {1}{2}",
    "（共同窗口 {0}）": " (shared window {0})",
    "整轮端到端输出吞吐：{0}{1}": "Batch end-to-end output throughput: {0}{1}",
    "有效输入吞吐": "Effective input throughput",
    "单发峰值（提前结束）": "Single-request peak (stopped early)",
    "单发 2 秒峰值": "Single-request 2-second peak",
    "大模型 API 测速报告": "LLM API benchmark report",
    "各领域单路速度（tok/s）": "Per-request speed by domain (tok/s)",
    "测试方法：{0} 路 × {1} 领域资料，读取后复用前缀并发生成": "Protocol: {0} requests × {1} input tokens, then concurrent generation with prefix reuse",
    "分享图已保存": "Share image saved",
    " · 思考": " · Thinking: ",
    " · 旧版统计口径": " · Legacy metrics",
    "并发整轮": "Batch throughput",
    "正在读取榜单…": "Loading rankings…",
    "还没有公开成绩。": "No public results yet.",
    "榜单暂时无法读取，请稍后重试。": "The rankings are temporarily unavailable. Try again shortly.",
    "正在提交…": "Submitting…",
    "提交失败": "Submission failed",
    "本次综合分未进入榜单。": "This score did not make the leaderboard.",
    "榜单保留该组合的更高成绩": "The leaderboard kept the higher score for this setup",
    "成绩已公开": "Result published",
    "提交失败，请稍后重试。": "Submission failed. Try again shortly.",
    "已复制，可以直接粘贴分享": "Result copied",
    "复制失败，请手动选择文字": "Could not copy. Select and copy the result manually.",
    "读取中": "Prefilling",
    "› 请求已发出，等待第一个字…": "› Request sent. Waiting for first output…",
    "最快！": "Fastest!",
    "测试未全部完成：{0}": "Test incomplete: {0}",
    "还没有测速记录": "No benchmark history yet",
    "Python 代码": "Python coding",
    "Python 题库": "Python problems",
    "前端 TS": "Frontend TypeScript",
    "前端移植题库": "Frontend porting tasks",
    "JSON 结构化": "Structured JSON",
    "电商订单表": "Order data",
    "中译英": "Chinese-to-English translation",
    "中文新闻稿": "Chinese news",
    "数学推导": "Mathematical derivation",
    "数学练习题": "Math exercises",
    "英文写作": "English writing",
    "英文需求文档": "English requirements",
    "中文长文": "Long-form Chinese writing",
    "客服对话": "Customer support",
    "客服对话记录": "Support transcripts",
    "连接超时：测速服务器连不上这个地址，请确认接口对外网开放": "Connection timed out. Check that the API is reachable from the benchmark server.",
    "请求超时：接口太久没有响应": "Request timed out. The API took too long to respond.",
    "连接被拒绝：地址或端口不对，或服务没有启动": "Connection refused. Check the address, port and service status.",
    "域名解析失败：请检查接口地址": "DNS lookup failed. Check the API endpoint.",
    "连接被重置：可能被防火墙拦截": "The connection was reset. Check the upstream firewall.",
    "无法直连你的本机。请检查模型服务和端口，允许本站的本机网络权限，并确认模型服务允许本站跨域访问（CORS）。": "Could not connect to the local API. Check the model server, port, browser local network permission and CORS configuration.",
    "接口没有返回 SSE 事件": "The API sent no SSE events",
    "输出流缺少结束事件": "The output stream did not send an end event",
    "接口没有返回文本或推理输出": "The API returned no text or reasoning output",
    "连接测试未收到文本或推理输出，无法测量首包延迟": "No text or reasoning arrived during the connection test. Latency was unavailable.",
    "没有输出": "No output",
    "这个思考模式快捷开关仅适用于兼容的 OpenAI 格式接口": "This thinking-mode shortcut requires a compatible OpenAI-format API",
    "额外请求参数不是合法 JSON": "Extra request parameters are invalid JSON",
    "额外请求参数必须是 JSON 对象": "Extra request parameters must be a JSON object",
    "Base URL 需以 http:// 或 https:// 开头": "The API endpoint must start with http:// or https://",
    "上榜数据只包含模型、设备、推理框架和三项成绩": "Submissions may include only the model, hardware, inference engine and three scores",
    "三项成绩须为有效的正数": "All three scores must be positive numbers",
    "上榜请求须为 JSON": "Ranking submissions require JSON",
    "上榜请求不是有效的 JSON": "The ranking submission contained invalid JSON",
    "榜单暂不可写入，请稍后重试": "The rankings cannot accept submissions right now. Try again shortly.",
    "出于安全考虑，这个测速服务不能访问内网或本机地址": "The benchmark server cannot access private-network or loopback addresses",
    "请求体过大": "The request body is too large",
    "JSON 解析失败": "Invalid JSON",
    "测速代理仅支持公网 HTTPS API（默认 443 端口）": "The benchmark proxy supports public HTTPS APIs on port 443",
    "上游没有可用的公网 IPv4 地址": "The upstream API does not have a public IPv4 address",
    "请求体需为 JSON 对象": "The request body must be a JSON object",
    "测速请求超时": "The benchmark request timed out",
    "测速服务暂不可用": "The benchmark service is temporarily unavailable",
    "页面不存在": "Page not found",
    "测速请求过多，请稍后再试": "Too many requests. Try again shortly.",
    "请求体需为合法 JSON": "The request body must contain valid JSON",
    "关闭历史记录": "Close history",
    "heroTitle": "How fast is your <em>LLM API</em>?",
    "heroSubtitle": "Enter an API key to measure <b>response latency</b>, <b>prefill throughput</b>, <b>peak speed</b> and <b>concurrent throughput</b>.",
  };

  function t(message, ...values) {
    if (typeof message === 'string') return language === 'zh-CN' || !Object.hasOwn(english, message) ? message : english[message];
    if (!Array.isArray(message)) return message == null ? '' : String(message);
    if (language === 'zh-CN') return message.reduce((output, part, i) => output + (i ? values[i - 1] : '') + part, '');
    const key = message.map((part, i) => i < values.length ? part + '{' + i + '}' : part).join('');
    return t(key).replace(/\{(\d+)\}/g, (_, i) => values[Number(i)]);
  }

  // Translate our diagnostics while leaving any message from the selected provider intact.
  const errorPrefixes = {
    '网络错误：': 'Network error: ',
    '流式错误：': 'Stream error: ',
    '读取流失败：': 'Could not read the stream: ',
    '接口返回错误：': 'API error: ',
    '非 SSE 响应：': 'Non-SSE response: ',
    '连接测试失败 · ': 'Connection test failed · ',
    '校准请求失败 · ': 'Calibration failed · ',
    '读取测试全部失败 · ': 'All prefill requests failed · ',
    '单发测试失败 · ': 'Single-request test failed · ',
    '并发测试全部失败 · ': 'All concurrent requests failed · ',
    '额外请求参数不能覆盖测速字段：': 'Extra request parameters cannot override benchmark field: ',
  };

  function localizeError(message) {
    if (language === 'zh-CN' || typeof message !== 'string') return message;
    if (Object.hasOwn(english, message)) return t(message);
    for (const [prefix, label] of Object.entries(errorPrefixes)) {
      if (message.startsWith(prefix)) return label + localizeError(message.slice(prefix.length));
    }
    const field = /^(模型|设备|推理框架)(须为 1–120 个可见字符|请勿包含密钥或接口地址)$/.exec(message);
    if (field) {
      return t(field[1]) + (field[2].startsWith('须为') ? ' must be 1–120 visible characters' : ' must not contain an API key or endpoint');
    }
    const missing = /^请填写(模型|设备|推理框架)$/.exec(message);
    if (missing) return 'Required field: ' + t(missing[1]);
    const extra = /^额外请求参数的 (.+) 必须是 JSON 对象$/.exec(message);
    if (extra) return 'Extra parameter ' + extra[1] + ' must be a JSON object';
    const limit = /^(\w+) 超出公开服务上限 (\d+)$/.exec(message);
    if (limit) return limit[1] + ' exceeds the limit of ' + limit[2];
    return message;
  }

  const pageTitle = document.title;
  const updatePage = [];
  const text = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (text.nextNode()) {
    const node = text.currentNode;
    if (node.parentElement?.closest('[data-i18n-html]')) continue;
    const original = node.nodeValue;
    const source = original.trim();
    if (Object.hasOwn(english, source)) {
      updatePage.push(() => { node.nodeValue = original.replace(source, () => t(source)); });
    }
  }
  for (const element of document.querySelectorAll('[title], [placeholder], [aria-label], meta[name="description"]')) {
    for (const attribute of ['title', 'placeholder', 'aria-label', 'content']) {
      const source = element.getAttribute(attribute);
      if (source && Object.hasOwn(english, source)) {
        updatePage.push(() => element.setAttribute(attribute, t(source)));
      }
    }
  }
  // These two headings need different emphasis and word order in English.
  for (const element of document.querySelectorAll('[data-i18n-html]')) {
    const chineseHTML = element.innerHTML;
    const englishHTML = english[element.dataset.i18nHtml];
    updatePage.push(() => { element.innerHTML = language === 'zh-CN' ? chineseHTML : englishHTML; });
  }

  function renderPage() {
    document.documentElement.lang = language;
    document.title = t(pageTitle);
    for (const update of updatePage) update();
  }

  function setLanguage(next) {
    if ((next !== 'zh-CN' && next !== 'en') || next === language) return;
    language = next;
    try {
      localStorage.setItem(preferenceKey, language);
    } catch (_) {}
    renderPage();
  }

  renderPage();
  window.TokenSpeedLocale = { get language() { return language; }, t, localizeError, setLanguage };
})();
