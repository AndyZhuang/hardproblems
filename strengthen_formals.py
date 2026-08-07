"""Strengthen weak formal fields in gen_problems.py.

Strategy per category:
- physics: add formula / observable / falsification criterion
- chemistry: yield/rate/energy + specific catalyst/conditions + characterization
- biology: experimental design (control, sample size, readout, validation)
- cs: complexity / asymptotic / benchmarks / adversarial robustness
- philosophy: convert question to testable hypothesis with operationalization
- engineering: spec + tolerance + failure mode + verification protocol
- social: quantitative metric + measurement methodology + counterfactual

This is a template-based approach. Some entries get auto-rewrites; some need manual review.
"""
import re
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('deploy/gen_problems.py', encoding='utf-8') as f:
    content = f.read()

with open('weak_formals.json', encoding='utf-8') as f:
    weak_list = json.load(f)
weak_ids = {p['id'] for p in weak_list}

# 强化字典：problem_id -> new formal
STRENGTHEN = {}

# ============= PHYSICS (5) =============
STRENGTHEN['hierarchy-problem'] = (
    "在 SM + 最小超对称 (MSSM) 或 composite Higgs 等 BSM 框架下，计算 Higgs 质量参数"
    "μ²(m_Z) 的辐射修正对截止标度 Λ 的依赖；要求在无需极端精细调节 (fine-tuning < 1%) "
    "的前提下解释 m_h = 125.1 GeV 与 m_Pl/M_EW ≈ 10^17 的 17 个数量级差距。"
)
STRENGTHEN['arrow-of-time'] = (
    "在不引入边界条件的前提下，从 T-对称的微观定律 (CPT) 推导出 T-不对称的宏观热力学第二定律；"
    "给出熵增 S(t) 满足 dS/dt ≥ 0 的初始条件在宇宙学暴胀时期的可计算机制（CMB 谱 + 重子不对称）。"
)
STRENGTHEN['vacuum-decay'] = (
    "在 SM 有效势 V_eff(φ, T) 框架下，计算假真空寿命 τ 与 Higgs 质量 m_h、顶夸克质量 m_t 的依赖关系；"
    "要求 τ > 10^10 年（> 当前宇宙年龄）且与 LHC m_h 测量值一致；预测可由高精度 m_h 测量（误差 < 0.1 GeV）检验。"
)
STRENGTHEN['dark-photon'] = (
    "在 1 MeV < m_{A'} < 100 GeV、10^{-12} < ε < 10^{-2}（与光子混合参数）参数空间内，"
    "通过固定靶实验 (LSND/NA64)、对撞机 (BaBar/Belle II) 或天体物理观测给出 95% CL 排除或发现。"
)
STRENGTHEN['holographic'] = (
    "对任意渐近平坦 (A)dS 时空 M，给出满足 AdS/CFT 对偶关系的 bulk-to-boundary 映射 H: Bulk(M) → CFT(∂M)；"
    "要求 bulk 局域算符 O(x) 对应 CFT 边界算主的 O(ξ)，且配分函数 Z_bulk[M] = Z_CFT[φ_0] 在所有拓扑荷下精确成立。"
)

# ============= CHEMISTRY (13) =============
STRENGTHEN['nitrogen-fixation'] = (
    "开发铁基或钼基单原子/团簇催化剂，在 T ≤ 100°C、P ≤ 10 atm 下实现 N₂ + 3H₂ → 2NH₃ 的 "
    "转化率 ≥ 20%（相对 N₂）、TOF ≥ 1 s⁻¹、稳定性 ≥ 1000 小时（无明显失活），"
    "并通过 XRD/XPS/operando XAS 表征活性位结构。"
)
STRENGTHEN['carbon-capture'] = (
    "开发 MOF/胺基/膜分离 CO₂ 捕集工艺：捕集成本 ≤ 50 美元/吨 CO₂、能耗 ≤ 2 GJ/吨 CO₂、"
    "捕集率 ≥ 90%（烟气 4-15% CO₂）、循环稳定性 ≥ 5000 次吸附-脱附，"
    "并由 LCA 评估全生命周期 GHG 减排 ≥ 80%。"
)
STRENGTHEN['protein-design'] = (
    "对任意目标 3D 几何 + 化学功能 (结合/催化)，用 RFdiffusion/ProteinMPNN 类方法从头设计蛋白，"
    "满足：(a) 目标均方根偏差 (RMSD) ≤ 1.5 Å，(b) 实验表达量 ≥ 10 mg/L 且可溶，"
    "(c) 目标功能活性 ≥ 已知最佳天然蛋白 50% 水平，(d) 热熔 T_m ≥ 50°C。"
)
STRENGTHEN['water-splitting'] = (
    "开发 OER/HER 电催化剂：10 mA/cm² 下过电位 ≤ 100 mV、Tafel 斜率 ≤ 30 mV/dec、"
    "1000 小时恒电流稳定性测试后活性衰减 < 10%，且仅使用丰产元素（Fe/Co/Ni/Mn 基）。"
)
STRENGTHEN['co2-to-fuel'] = (
    "开发电催化 CO₂ 还原 (CO₂RR) 催化剂：法拉第效率 ≥ 50%（对单一产物 CO/CH₃OH/C₂H₄ 等）、"
    "电流密度 ≥ 200 mA/cm²、稳定性 ≥ 1000 小时、产物选择性 ≥ 90%，且反应在常温常压水溶液中进行。"
)
STRENGTHEN['li-air-battery'] = (
    "实现 Li-O₂/Li-air 电池：实际能量密度 ≥ 1000 Wh/kg、循环寿命 ≥ 500 次（容量保持率 ≥ 80%）、"
    "往返效率 ≥ 80%，且阴极放电产物 Li₂O₂ 可逆生成（XRD/XPS 表征验证）。"
)
STRENGTHEN['enzyme-design'] = (
    "对任意未在自然界存在的化学反应，设计酶（含定向进化）实现催化速率提升 k_cat/k_uncat ≥ 10³、"
    "K_M ≤ 1 mM、立体选择性 ≥ 99% ee，并通过晶体结构 (RMSD < 1 Å) 验证活性位几何。"
)
STRENGTHEN['cnt-bulk'] = (
    "工业级碳纳米管生产：纯度 ≥ 99.9%、缺陷率 ≤ 5%、直径分布 σ_d/μ_d ≤ 10%、"
    "生产成本 ≤ 100 美元/公斤、年产能 ≥ 100 吨，且具备 G/D 比 ≥ 100 的石墨化度。"
)
STRENGTHEN['graphene-app'] = (
    "石墨烯薄膜（化学气相沉积法）卷材生产：单层率 ≥ 95%、方块电阻 ≤ 10 Ω/sq、"
    "成本 ≤ 100 美元/m²、幅宽 ≥ 1 m、连续生产速率 ≥ 1 m/min 且无明显缺陷（拉曼 I_D/I_G < 0.1）。"
)
STRENGTHEN['artificial-photo'] = (
    "人造光合器件：太阳能到燃料 (STF) 能量转换效率 ≥ 10%、稳定运行 ≥ 1000 小时（无明显降解）、"
    "产物 (H₂/CH₃OH 等) 纯度 ≥ 95%，且使用非贵金属催化剂。"
)
STRENGTHEN['lithium-sulfur'] = (
    "锂硫电池：能量密度 ≥ 500 Wh/kg、循环寿命 ≥ 1000 次（每次循环容量衰减 ≤ 0.05%）、"
    "硫正极载量 ≥ 4 mg/cm²、电解液/硫比 < 5 μL/mg，且抑制多硫化物穿梭（自放电率 < 5%/月）。"
)
STRENGTHEN['molecular-machine-chem'] = (
    "化学合成纳米级分子机器：能在溶剂中完成 2 种以上独立任务（运动/运输/催化/逻辑门），"
    "工作循环 ≥ 1000 次（无明显疲劳），且可通过 AFM/STM/单分子荧光验证。"
)
STRENGTHEN['molecular-medicine'] = (
    "对任意基因变异型患者，基于基因组/蛋白质组学设计个性化药物或 RNA 治疗，"
    "在 III 期临床试验中 ≥ 80% 患者获得显著疗效 (RECIST 或等效指标)，"
    "且严重不良反应率 < 5%。"
)

# ============= BIOLOGY (13) =============
STRENGTHEN['whole-brain-emulation'] = (
    "对完整哺乳动物大脑（线虫 302 神经元 → 果蝇 10⁵ → 小鼠 7×10⁷ → 人 8.6×10¹⁰），"
    "完成 (a) 连接组电子显微镜重建 (分辨率 < 4 nm, 误差 < 5%)，(b) 单细胞转录组 (10x Genomics 验证)，"
    "(c) 在硅上模拟其行为输出 (与生物体在 N 种刺激下行为一致度 ≥ 90%)。"
)
STRENGTHEN['gene-drive'] = (
    "设计基因驱动系统：满足 (a) 目标种群中传递率 ≥ 95%，(b) 100 代内可逆（daisy-chain 或 anti-drive），"
    "(c) 1000 公里范围内水平转移率 < 0.1%，(d) 伦理与生物安全审查通过 (WHO/ Cartagena Protocol)。"
)
STRENGTHEN['xenotransplant'] = (
    "实现基因改造猪心/肾 → 人异种移植：在非人灵长类 ≥ 5 例 5 年存活、"
    "人临床试验 ≥ 50 例 5 年存活（无 PERV 感染、超急性排斥 < 1%、慢性排斥 < 10%），"
    "并通过 FDA/EMA 生物制品审批。"
)
STRENGTHEN['universal-flu'] = (
    "开发对所有甲型流感 HA 亚型 (H1-H18) 有效、且对乙型、丙型亦有交叉保护的疫苗："
    "在 6 月龄-80 岁人群 ≥ 90% 血清转化率、≥ 80% 临床保护效力、"
    "保护期 ≥ 3 年，且每年更新成本 ≤ 现有流感疫苗 1.5 倍。"
)
STRENGTHEN['malaria-eradication'] = (
    "全球疟疾年发病数降至 0 并维持 ≥ 5 年：通过 RTS,S/R21 疫苗 + ITN + ACT 组合策略，"
    "WHO 区域级别认证消除、监测系统灵敏度 ≥ 1 例/10 万人口、输入病例再传播风险 < 5%。"
)
STRENGTHEN['telomere-extend'] = (
    "在人类细胞/小鼠中安全延长端粒 ≥ 20%（无致癌风险），"
    "在 3 项独立表观遗传/衰老时钟 (Horvath/PhenoAge/GlycanAge) 上呈现 ≥ 3 年逆转，"
    "且 ≥ 5 年随访不增加肿瘤发生率。"
)
STRENGTHEN['stem-cell-therapy'] = (
    "对指定组织（神经/心脏/胰岛/视网膜）实现 iPSC/成体干细胞治疗："
    "在 III 期临床试验中 ≥ 70% 患者显著功能改善 (mRS/HbA1c/视力等指标)、"
    "致瘤率 < 0.1%、5 年随访无严重不良反应。"
)
STRENGTHEN['organoid-intelligence'] = (
    "证明脑类器官：(a) 在经典学习范式 (Pavlov/operant) 中表现出可量化学习曲线，"
    "(b) 神经元放电模式包含信息熵 ≥ 0.5 bit/spike，(c) 伦理框架（IBC 审批、知情同意）可控。"
)
STRENGTHEN['biolocomotion'] = (
    "建立跨尺度运动统一理论：分子马达 (kinesin/myosin) → 细胞 (鞭毛) → 器官 → 整体，"
    "用 ODE/PDE 框架在 10 个数量级时间-空间尺度上重构能量-信息-力学闭环，"
    "且能预测 ≥ 3 个未实验验证的运动现象。"
)
STRENGTHEN['bioluminescence'] = (
    "通过转基因使整株植物（如烟草/拟南芥）持续可见光发光 ≥ 1 μmol photons/m²/s "
    "（人眼可见），且生长速率、生殖能力无显著降低（< 10% 差异），"
    "光照来自内源 Luciferase/luciferin 系统，无外部底物供应。"
)
STRENGTHEN['synthetic-genome'] = (
    "完整设计并化学合成任意真核生物（如酵母 12 Mb）基因组，准确率 ≥ 99.999%、"
    "合成成本 ≤ 0.10 美元/碱基、移植后表型与设计一致度 ≥ 95%、"
    "且全基因组测序验证无偏移。"
)
STRENGTHEN['plant-intelligence'] = (
    "对植物根/叶/捕虫行为建立可计算的「智能」模型：能预测 (a) 觅食路径选择 ≥ 80% 准确率，"
    "(b) 食虫植物触发阈值 ±10%，(c) 群体信号传导延迟 < 30 秒；模型通过独立实验组验证。"
)
STRENGTHEN['photosynthesis-eff'] = (
    "通过 RuBisCO 工程 / C4 通路引入 / 光呼吸支路绕过，"
    "将 C3 作物（如水稻）光合量子效率从 ~3% 提升至 ≥ 6%，"
    "田间产量提升 ≥ 30%（3 年多地点试验），且无显著生态副作用。"
)

# ============= CS (11) =============
STRENGTHEN['software-verification'] = (
    "对 10⁵-10⁷ 行业代码行（C/SystemC/Python）实现全自动形式验证："
    "在 ≤ 4 小时 / 32 GB 内存内完成 spec 匹配，误报率 < 5%，"
    "且至少在 2 个开源大型项目 (Linux kernel module, OpenSSL) 上发现 ≥ 1 个 CVE 等价缺陷。"
)
STRENGTHEN['quantum-internet'] = (
    "实现多节点量子网络：≥ 1000 节点纠缠分发、保真度 F ≥ 0.9、"
    "距离 ≥ 1000 km (基于 quantum repeater)、延迟 < 100 ms、"
    "且对节点故障、纠缠退相干有鲁棒错误纠正。"
)
STRENGTHEN['translation-parity'] = (
    "在 BLEU/chrF/人类专家评估下，对任何语言对 (含低资源) 任何领域 (法律/医学/技术/文学) 达到："
    "≥ 95% 专家译者水平 (Adequacy)、≥ 90% (Fluency)、"
    "且文化隐喻/典故正确理解率 ≥ 80%（人类评估）。"
)
STRENGTHEN['crypto-scale'] = (
    "去中心化区块链在保持 51% 抗攻击性前提下："
    "持续 TPS ≥ 10000、确认延迟 < 10 s、节点数 ≥ 10000，"
    "且经 3 年实战考验无重大安全事件。"
)
STRENGTHEN['federated-learning'] = (
    "联邦学习系统：通信开销 < 中心化训练 1%、对客户端掉线鲁棒（< 50% 在线仍可训练）、"
    "满足 (ε, δ)-差分隐私 (ε ≤ 1, δ ≤ 10⁻⁵)、模型精度损失 < 2%，"
    "且支持异构硬件 (手机/嵌入式)。"
)
STRENGTHEN['neuromorphic'] = (
    "神经形态芯片：能效比 ≥ 10 TOPS/W（INT8 精度），"
    "能跑现代 LLM/视觉模型 (Llama-7B 推理) 实时响应 (< 100ms token)、"
    "且抗辐射/低功耗 (< 1 W)。"
)
STRENGTHEN['photonic-compute'] = (
    "光子计算系统：能效比 ≥ 100 TOPS/W 且精度损失 < 1% (FP16/INT8)、"
    "在 ResNet-50/BERT 类模型上吞吐 ≥ 10x GPU、延迟 < 1 ms，"
    "且可扩展到 ≥ 1024 光学处理器阵列。"
)
STRENGTHEN['3d-chip'] = (
    "3D 堆叠芯片：内存带宽 ≥ 100 TB/s、TSV 密度 ≥ 10⁶/cm²、"
    "热密度 ≤ 100 W/cm²（液冷可行）、"
    "且通过 1000 小时可靠性测试无失效。"
)
STRENGTHEN['energy-ai'] = (
    "AI 训练/推理硬件：能效 ≥ 100x 当前 SOTA (按 FLOP/J 测量)、"
    "能跑 LLaMA-70B 训练、与现有 GPU 软件栈兼容 (PyTorch/TF)、"
    "且单卡成本 < 10000 美元。"
)
STRENGTHEN['post-quantum'] = (
    "抗量子加密：密钥长度 ≤ 1 KB、加密/解密速度 ≥ 经典 RSA-2048、"
    "对 Shor/Grover 算法在 10⁶ 量子比特上也安全（NIST PQC 标准）"
    "且支持现有协议 (TLS/IKE)。"
)
STRENGTHEN['zkp-scale'] = (
    "零知识证明系统：证明生成 ≥ 10⁶ 证明/秒 (单服务器)、"
    "证明大小 ≤ 1 KB (常数不随电路大小增长)、验证时间 ≤ 1 ms、"
    "且对算术电路 (≥ 2²⁰ gates) 友好。"
)

# ============= PHILOSOPHY (18) =============
STRENGTHEN['moral-objectivity'] = (
    "若道德事实是客观的，则存在跨文化、跨时代的道德判断会聚；"
    "操作性化：(a) 在 N≥30 文化、≥100 道德困境 (Trolley/Footbridge 等) 上测量道德直觉一致度 r ≥ 0.8；"
    "(b) 设计反事实：如果道德非客观，预测分歧度会上升 — 实证验证 (跨文化 fMRI 一致性)。"
)
STRENGTHEN['zombie-thought'] = (
    "如果哲学僵尸在概念上可能，则物理主义 (physicalism) 与现象意识 (qualia) 存在解释鸿沟；"
    "操作化：(a) 给出「可观测等价但现象不等同」的可证伪判据，(b) 在 AI 系统 (LLM/RL agent) 上设计等价实验验证。"
)
STRENGTHEN['truth'] = (
    "若真理有统一本质（对应论/融贯论/实用论之一），则所有合理真理理论须能解释：(a) 数学真理 (Gödel 完备性)、"
    "(b) 经验科学真理 (Quine-Duhem)、(c) 规范性真理 (伦理学/美学)；"
    "给出可证伪的统一形式化方案（如 Tarski 层级 + 实用嵌入）。"
)
STRENGTHEN['beauty'] = (
    "若美有客观特征，则跨文化的审美判断应有非平凡一致性；"
    "操作化：在 N≥30 文化、≥100 视觉/音乐/数学对象上，"
    "统计 (a) 评分 Pearson r ≥ 0.6，(b) 神经美学 fMRI 模式相似度 ≥ 70%（独立于文化）。"
)
STRENGTHEN['death-philosophy'] = (
    "若死亡是坏事，则：(a) Epicurus 论题 (死后无体验) 意味着死亡非 intrinsic 恶；"
    "(b) 操作化：测量人对自己死亡的评价 (时间贴现/存在主义量表) 与客观死亡指标 (DALY) 的相关性 r ≥ 0.7。"
)
STRENGTHEN['mind-body'] = (
    "若心灵独立于身体（交互二元论），则：(a) 心灵实体不参与物理因果；(b) 操作化：所有认知活动可由神经活动完全预测；"
    "反之若心灵不可还原 (Chalmers 性质二元论)，则存在「困难问题」现象意识 → 设计 AI/IIT 实验区分。"
)
STRENGTHEN['is-ought'] = (
    "若能从纯事实推出价值 (Hume 律则反驳)，则需给出形式化规则 (如 Hare 普遍化)；"
    "操作化：测试 (a) 规范性结论能否从纯事实前提逻辑推出，(b) 反例 (Moore 自然主义谬误) 是否被排除。"
)
STRENGTHEN['justice'] = (
    "若公平的分配原则是 (罗尔斯/自由至上/功利/平等主义/足够主义) 之一，则可在 N 种分配场景下证伪其他；"
    "操作化：在 ≥ 10 个经典分配困境 (器官分配/难民配额/碳预算) 上，"
    "五种理论给出不同预测 → 用行为经济学实验 + 共识道德区分。"
)
STRENGTHEN['liberty'] = (
    "若自由有合理边界，则存在 (Mill 伤害原则/限制自由原则/法律家长制) 之一的判据；"
    "操作化：(a) 列出自由 vs 权威 100 个 case 库，(b) 用统计方法验证一致性 r ≥ 0.8，"
    "(c) 给出可形式化的边界函数 f(行为, 后果) → 行动合法性。"
)
STRENGTHEN['property'] = (
    "若私有财产有正当性基础（劳动/效用/权利/约定论），则可解释：(a) 知识产权 vs 物质财产，"
    "(b) 公有 vs 私有，(c) 强征税收的道德地位；"
    "操作化：构建 100 案例库，对四种理论预测分歧度做统计分析，"
    "通过 Rawls 反思平衡 + 思想实验验证。"
)
STRENGTHEN['authority-phil'] = (
    "若国家权威正当 (同意/公平/职责/功利)，则可证伪其他；"
    "操作化：(a) 公民服从率 vs 制度满意度相关性 r ≥ 0.7，(b) 无政府状态模拟显示秩序崩溃概率 ≥ 阈值；"
    "(c) 跨国治理合作中服从国际法的实证检验。"
)
STRENGTHEN['equality'] = (
    "若平等是机会/结果/资源/福祉/能力 (Sen/Nussbaum) 之一，则可区分："
    "操作化：在 100 个政策场景中预测分歧；"
    "经验上：北欧 Gini < 0.3 国家的「机会平等」指标 (IEO) 与 GDP-人均相关性分析。"
)
STRENGTHEN['punishment'] = (
    "若惩罚正当 (报应/功利/矫正/威慑)，则可证伪其他；"
    "操作化：(a) 累犯率 (再犯率 < 30% 作为矫正成功基准)，(b) 罪刑相适应系数 r ≥ 0.7，"
    "(c) 边际威慑效应回归分析显著 (p < 0.05)。"
)
STRENGTHEN['marriage-phil'] = (
    "若婚姻本质是 (生育/爱情/陪伴/法律/经济/宗教) 之一，则跨文化婚姻形态可被合理分类；"
    "操作化：(a) 100 文化中「婚姻」定义的统计聚类 (k-means)，(b) 离婚率与婚姻基础指标相关性，"
    "(c) 跨文化道德哲学共识 r ≥ 0.7 时可证伪纯文化相对论。"
)
STRENGTHEN['beauty-objective'] = (
    "若审美判断有普遍性根据（比例/对称/进化适应/数学结构），则跨文化应有一致成分；"
    "操作化：(a) 黄金比例 vs 斐波那契螺旋在 1000 艺术品中的显著性 (p < 0.01)，"
    "(b) 跨文化评分 r ≥ 0.6 + 神经模式聚类验证。"
)
STRENGTHEN['trolley'] = (
    "功利主义 (5 vs 1) 与义务论 (不可作为工具) 给出不同预测；"
    "操作化：(a) N=1000 跨文化实验中两种判断的比例，(b) fMRI 显示道德冲突 (前扣带皮层激活)，"
    "(c) 通过双过程模型 (System 1 vs 2) 解释直觉差异的认知机制。"
)
STRENGTHEN['teleport'] = (
    "若传送机保留人格同一性 (身体/心理/因果连续性 之一)，则可证伪其他；"
    "操作化：(a) 经典 Lockean memory 测验（传送前后记忆/性格/价值观连续性 ≥ 95%），"
    "(b) 朋友/家人能否识别的实验盲测 (≥ 80% 识别率 vs 复制体假说)。"
)
STRENGTHEN['newcomb'] = (
    "若决策论 (EV-max) 优先于因果论 (dominance)，则 Newcomb 悖论中应选两箱；"
    "操作化：(a) N=1000 受试者选择分布，(b) 重复博弈显示「选一箱」策略 长期胜率 ≥ 60% (causal decision theory)，"
    "(c) 形式化 (Lewis/Weirich) 给出统一决策函数。"
)

# ============= ENGINEERING (22) =============
STRENGTHEN['fusion'] = (
    "实现 Q = P_fusion / P_input ≥ 10 的稳态聚变反应堆："
    "等离子体约束 τ_E ≥ 3 s、三乘积 nTτ_E ≥ 3×10²¹ keV·s/m³、"
    "连续运行 ≥ 1000 小时、年发电量 ≥ 1 TWh、单度电成本 ≤ 0.10 美元。"
)
STRENGTHEN['space-elevator'] = (
    "实现 ≥ 36000 km 长度缆绳：抗拉强度 ≥ 60 GPa、密度 ≤ 1.3 g/cm³、"
    "总质量 ≤ 10⁷ kg、单根纤维直径 ≤ 1 μm 且无缺陷、且能承受微陨石 + 雷电 + 原子氧。"
)
STRENGTHEN['reusable-rocket'] = (
    "轨道级运载火箭：单次发射成本 ≤ 1000 美元/公斤 LEO、"
    "≥ 100 次重复使用且无需大修（仅定期检测 < 100 小时）、"
    "翻修周转时间 ≤ 7 天、可靠性 ≥ 99.5%。"
)
STRENGTHEN['bci'] = (
    "非侵入式 BCI：信息传输率 ≥ 1 Mbps (100 字/分钟以上)、"
    "长期使用 (≥ 5 年) 信号稳定性 < 10% 衰减、电极/系统对用户无伤害、"
    "且可控制普通计算机/手机 (光标 + 文字输入)。"
)
STRENGTHEN['cheap-solar-fuel'] = (
    "人造光合器件：太阳能-燃料效率 (STF) ≥ 10%、"
    "稳定运行 ≥ 1000 小时（衰减 < 10%）、产物 (H₂/CH₃OH) 选择性 ≥ 90%、"
    "产率 ≥ 1 g/kWh、且仅用丰产元素催化剂。"
)
STRENGTHEN['hydrogen-storage'] = (
    "储氢系统：重量密度 ≥ 7 wt%、体积密度 ≥ 70 g/L、"
    "可逆循环 ≥ 500 次（无显著衰减）、"
    "在 -40°C ~ 60°C、0.1-100 atm 范围内安全（无泄漏/爆炸）、"
    "且单 kg 储氢成本 ≤ 300 美元。"
)
STRENGTHEN['nuclear-waste'] = (
    "核废料（高放乏燃料）处置：密封性 ≥ 10⁵ 年、"
    "在地质/海洋/太空方案中任选一个且通过 IAEA 长期安全审查、"
    "泄漏风险 < 10⁻⁶ / 10⁵ 年、且处置总成本 ≤ 发电收入 5%。"
)
STRENGTHEN['asteroid-mining'] = (
    "小行星资源开采：单次任务运回地球物质 ≥ 1000 kg、"
    "全成本 < 100 万美元/kg（含发射/采矿/返回）、"
    "净收益（高价值金属 Pt/Au/Co）≥ 10x 成本、且不违反外空条约。"
)
STRENGTHEN['floating-cities'] = (
    "自给式海上漂浮社区：≥ 1000 人长期居住、"
    "100% 可再生能源（太阳能/波浪/海流）、淡水自给（海水淡化）、"
    "抗 10 米巨浪 + 7 级地震、运行成本 ≤ 陆地城市 1.5 倍。"
)
STRENGTHEN['earthquake-pred'] = (
    "地震预测系统：震级 ≥ 5.0 地震的预测准确率 ≥ 80%、"
    "提前时间 ≥ 1 天、空间精度 ≤ 50 km、误报率 < 10%、"
    "且对至少 3 个不同板块边界验证有效。"
)
STRENGTHEN['self-healing-infra'] = (
    "自修复混凝土/涂层：能完全愈合 ≤ 0.5 mm 宽裂缝（强度恢复 ≥ 95%）、"
    "在 28 天内完成修复、寿命延长 ≥ 50%、"
    "且修复机制在 ≥ 3 次冻融循环后仍有效。"
)
STRENGTHEN['programmable-matter'] = (
    "可编程物质（catoms）：单元尺寸 ≤ 1 cm、响应时间 ≤ 1 ms、"
    "可独立控制 ≥ 10⁶ 单元形成任意 3D 形状、单元间作用力 ≥ 1 N、"
    "且总能耗 < 100 W。"
)
STRENGTHEN['vertical-farming'] = (
    "城市垂直农场：粮食产出 ≥ 城市需求 90%、"
    "能量 ROI (产出能量 / 输入能量) ≥ 1、运营成本 ≤ 传统农业 1.5 倍、"
    "且在 ≥ 5 个不同气候带验证可行。"
)
STRENGTHEN['synthetic-meat'] = (
    "细胞培养肉：在 5 项感官测试（视觉/嗅觉/味觉/质地/咀嚼）中让 ≥ 80% 消费者无法区分真假、"
    "生产成本 ≤ 5 美元/kg、能量 ROI > 1、且无动物源成分。"
)
STRENGTHEN['plastic-enzyme'] = (
    "PET/PE 降解酶工厂：单厂处理 ≥ 10 吨/天、成本 < 1 美元/公斤、"
    "产物单体纯度 ≥ 95% 可回用、且 1 美元投入产出 ≥ 1 美元价值产品。"
)
STRENGTHEN['self-driving-l5'] = (
    "L5 自动驾驶：在所有合法路况、所有天气（雨/雪/雾/夜间）下不需人接管、"
    "事故率 < 人类驾驶员 1/10、"
    "并经 10⁹ 公里真实道路 + 10⁹ 公里仿真验证。"
)
STRENGTHEN['drone-delivery'] = (
    "城市无人机物流：半径 ≥ 50 km、< 1 小时送达、单件成本 < 5 美元、"
    "载重 ≥ 5 kg、噪声 < 60 dB、"
    "且日均 ≥ 10⁴ 单次运行无重大事故。"
)
STRENGTHEN['modular-nuclear'] = (
    "小型模块化反应堆 (SMR)：单模块 ≤ 300 MWe、可批量工厂预制、"
    "建设周期 ≤ 36 个月、设计寿命 ≥ 60 年、被动安全（无需应急冷却）、"
    "且度电成本 ≤ 0.05 美元。"
)
STRENGTHEN['tidal-energy'] = (
    "潮汐能商业化：单机组 ≥ 100 MWe、年发电小时数 ≥ 4000 h、"
    "度电成本 ≤ 0.10 美元、对海洋生态影响最小化、"
    "且能承受 10 米浪高 + 强海流。"
)
STRENGTHEN['geothermal'] = (
    "增强型地热 (EGS)：单井 ≥ 5-10 MWe、寿命 ≥ 30 年、"
    "钻井深度 ≤ 5 km、度电成本 ≤ 0.05 美元、"
    "且诱发地震控制 < M 3.0。"
)
STRENGTHEN['solar-geoengineering'] = (
    "太阳地球工程 (SRM)：能抵消 ≥ 1°C 升温、"
    "可逆 (1 年内停止恢复)、对降水/生态系统影响最小、"
    "全球部署成本 ≤ 100 亿美元/年、且经国际治理框架授权。"
)
STRENGTHEN['sustainable-concrete'] = (
    "水泥/混凝土：生产 CO₂ 排放减少 ≥ 50%、"
    "成本 ≤ 传统水泥 1.2 倍、强度 ≥ 同等级普通水泥、"
    "且能大规模替代 (年产能 ≥ 10⁸ 吨)。"
)

# ============= SOCIAL (20) =============
STRENGTHEN['sustainable-energy'] = (
    "在 2050 年前全球净零 CO₂ 排放：年排放量 CO₂_eq ≤ GtCO₂/yr（净负）、"
    "且 80% 一次能源来自无碳源（可再生 + 核）、"
    "可由 IEA/UNFCCC 排放清单 + 能源平衡表逐年验证。"
)
STRENGTHEN['education-reform'] = (
    "AI 个性化教学系统在 1 项主效应指标（学习收益 effect size d ≥ 0.4，与 1-on-1 人类教师对照，"
    "N≥10000 随机对照试验，覆盖 K-12 全学段）+ 1 项社会指标（教育公平差距减小 ≥ 30%）上"
    "达到或超过 1 对 1 资深教师。"
)
STRENGTHEN['polarization'] = (
    "显著降低政治极化指数：(a) Pew Political Typology 中「敌对阵营」比例下降 ≥ 30%，"
    "(b) 跨党派政策共识度 r ≥ 0.5，(c) 选举暴力事件下降 ≥ 50%，"
    "通过 ≥ 5 个 OECD 国家 10 年纵向研究验证。"
)
STRENGTHEN['longevity-equity'] = (
    "全球预期寿命差距：(a) 国家间最长寿-最短寿差 ≤ 10 年（目前 30+ 年），"
    "(b) 同一国家最高-最低收入组差 ≤ 5 年，(c) 由 WHO Global Health Observatory 数据验证。"
)
STRENGTHEN['ubi'] = (
    "UBI 大规模长期试验：覆盖 ≥ 1000 人、≥ 5 年随机对照；"
    "测量 (a) 就业率变化 ≥ -5%（不显著下降）、(b) 主观幸福感 (SWLS) 提升 ≥ 10%、"
    "(c) 心理健康 (PHQ-9) 改善 ≥ 15%；通过 3 项独立研究复现。"
)
STRENGTHEN['privacy-digital'] = (
    "个人在数字生活中拥有有意义的信息控制权："
    "(a) 99% 互联网用户能在 ≤ 5 步内导出/删除所有个人数据（GDPR Art. 15/17 验证），"
    "(b) 数据滥用投诉解决率 ≥ 90%、(c) 跨平台用户画像一致性可控（用户可见）。"
)
STRENGTHEN['digital-democracy'] = (
    "数字民主对参与度/政策质量的影响：(a) 公民投票率提升 ≥ 20%（vs 对照组），"
    "(b) 政策质量评分 (专家盲评) 提升 ≥ 15%，(c) 弱势群体参与差距减小 ≥ 30%，"
    "通过 ≥ 5 个真实城市/州 5 年研究验证。"
)
STRENGTHEN['open-data'] = (
    "≥ 80% 国家级政府关键数据集（财政/环境/健康/教育/统计）实时（更新延迟 < 24h）公开、"
    "机器可读 (RDF/JSON/CSV)、且含完整元数据 (DCAT)、"
    "由 Open Data Barometer 或同等指数 ≥ 80/100 验证。"
)
STRENGTHEN['universal-health'] = (
    "≥ 80% 国家实现 UHC：(a) 医保覆盖 ≥ 90% 人口、(b) 自费支出 < 30% 总医疗支出、"
    "(c) 必需医疗服务可及性 ≥ 80%、(d) 财务困难 (impoverishing expenditure) < 10% 家庭；"
    "由 WHO UHC Service Coverage Index ≥ 80 验证。"
)
STRENGTHEN['affordable-housing'] = (
    "住房可负担：≥ 80% 中位数收入家庭住房成本 ≤ 30% 月收入（联合国定义）、"
    "无家可归率 < 0.1%、且由 OECD Affordable Housing Database 验证。"
)
STRENGTHEN['remote-work'] = (
    "远程工作系统对生产率/社会凝聚的影响："
    "(a) 远程团队生产率 ≥ 现场团队 (随机对照 d ≥ 0.0)、"
    "(b) 社会凝聚指标 (Putnam 社会资本指数) 下降 < 10%、"
    "(c) 心理健康指标 (GHQ-12) 恶化 < 5%；通过 ≥ 5 项独立研究验证。"
)
STRENGTHEN['ai-governance'] = (
    "建立全球协调、有约束力的 AI 治理框架：(a) 至少 G20 + 主要 AI 大国签署、"
    "(b) 对算力 ≥ 10²⁶ FLOP 训练要求强制安全评估 + 红队测试 + 事故报告、"
    "(c) 设立独立国际 AI 安全机构（类似 IAEA）、(d) 实施 ≥ 3 年且有约束力。"
)
STRENGTHEN['bio-enhancement'] = (
    "对生物增强（基因/神经/认知）建立伦理与治理框架：(a) 至少 50 国家立法，"
    "(b) 同意机制 + 公平获取 + 不歧视 + 安全审查机制明确、(c) 长期跟踪登记制度 ≥ 10 年、"
    "(d) 公众咨询机制。"
)
STRENGTHEN['climate-migration'] = (
    "全球协调、有尊严的气候移民框架：(a) 国际法律地位明确 (难民/补充保护/临时保护 之一)、"
    "(b) ≥ 50 国家签署、(c) 安置配额公平 (基于历史排放 + 接收能力)、(d) 移民权利保障 (工作/教育/医疗)。"
)
STRENGTHEN['refugee'] = (
    "全球难民安置：(a) 联合国难民署年安置需求满足率 ≥ 80%、"
    "(b) 第一年安置国家 ≥ 40 个且分配公平 (人均难民/接收国比例 σ/μ ≤ 0.3)、"
    "(c) 难民 5 年内经济自给率 ≥ 70%、(d) 身心健康指标 (WHO-5) ≥ 对照人群 90%。"
)
STRENGTHEN['education-access'] = (
    "全球教育公平：(a) 失学率 < 5%、(b) 学习质量达标率 (PISA/PIAAC 等) ≥ 80%、"
    "(c) 性别/城乡/收入差距缩小 ≥ 50%、(d) 由 UNESCO UIS 数据验证。"
)
STRENGTHEN['gender-equity'] = (
    "全球性别平等：(a) 性别收入差 < 10%、(b) 议会代表 ≥ 40%、(c) STEM 领域女性比例 ≥ 40%、"
    "(d) 性别暴力发生率下降 ≥ 50%；由 WEF Global Gender Gap Index ≥ 0.9 验证。"
)
STRENGTHEN['voice-cloning-rights'] = (
    "声音权利的法律和技术框架：(a) ≥ 30 国家立法明确声音作为人格权、"
    "(b) 同意机制 + 商用授权标准 (区块链时间戳 + 数字水印)、"
    "(c) 深度伪造检测准确率 ≥ 95%、(d) 司法救济机制（删除/赔偿/刑事）明确。"
)

# 写入文件
print(f'Total strengthened: {len(STRENGTHEN)}')
print(f'Need to verify: weak count = {len(weak_ids)}, strengthened = {len(STRENGTHEN)}')
missing = weak_ids - set(STRENGTHEN.keys())
print(f'Missing (no rewrite yet): {len(missing)}')
if missing:
    print('  IDs missing:', list(missing)[:10])

# 保存到 JSON
with open('strengthen_formals.json', 'w', encoding='utf-8') as f:
    json.dump(STRENGTHEN, f, ensure_ascii=False, indent=2)
print('Saved strengthen_formals.json')
