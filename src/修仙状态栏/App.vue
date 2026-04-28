<template>
  <div v-if="store.data" class="xy-app">
    <!-- 装饰背景：远山 + 仙鹤 + 印章 -->
    <div class="xy-bg" aria-hidden="true">
      <svg class="xy-bg-mountain" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(110,124,124,0.32)" />
            <stop offset="100%" stop-color="rgba(110,124,124,0.04)" />
          </linearGradient>
          <linearGradient id="mtGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(42,37,32,0.22)" />
            <stop offset="100%" stop-color="rgba(42,37,32,0.02)" />
          </linearGradient>
        </defs>
        <path d="M0,200 Q120,80 220,140 T420,120 T620,160 T840,100 T1060,150 T1200,130 L1200,240 L0,240 Z" fill="url(#mtGrad)" />
        <path d="M0,220 Q150,150 280,200 T520,180 T780,210 T1020,170 T1200,200 L1200,240 L0,240 Z" fill="url(#mtGrad2)" />
      </svg>
      <svg class="xy-crane xy-crane-1" viewBox="0 0 80 60">
        <path
          d="M5,40 Q15,28 28,30 Q34,22 42,26 Q50,20 56,28 Q62,26 70,32 Q66,38 58,38 Q52,44 44,42 Q38,48 30,44 Q22,48 14,44 Q8,46 5,40 Z"
          fill="rgba(42,37,32,0.55)"
        />
        <circle cx="62" cy="29" r="1.2" fill="#b13a3a" />
        <path d="M64,28 L72,24" stroke="rgba(42,37,32,0.55)" stroke-width="1" fill="none" />
      </svg>
      <svg class="xy-crane xy-crane-2" viewBox="0 0 80 60">
        <path
          d="M5,40 Q15,28 28,30 Q34,22 42,26 Q50,20 56,28 Q62,26 70,32 Q66,38 58,38 Q52,44 44,42 Q38,48 30,44 Q22,48 14,44 Q8,46 5,40 Z"
          fill="rgba(42,37,32,0.4)"
        />
      </svg>
    </div>

    <!-- 主体卷轴 -->
    <div class="xy-scroll">
      <!-- ============ 头部 · 道号 / 境界 / 资源 ============ -->
      <header class="xy-hero">
        <div class="xy-hero-top">
          <div class="xy-name-block">
            <div class="xy-seal" :title="store.data.基本信息.修炼进度.境界">
              <span>{{ sealText }}</span>
            </div>
            <div class="xy-name-meta">
              <h1 class="xy-name">{{ store.data.基本信息.姓名 }}</h1>
              <div class="xy-realm">
                <span class="xy-realm-label">境界</span>
                <span class="xy-realm-value">{{ store.data.基本信息.修炼进度.境界 }}</span>
                <span v-if="store.data.基本信息.修炼进度.天谴 > 0" class="xy-tianqian">
                  天谴 {{ store.data.基本信息.修炼进度.天谴 }}
                </span>
              </div>
            </div>
          </div>
          <div class="xy-meta-line">
            <span class="xy-meta-item"><i>种</i>{{ store.data.基本信息.种族 }}</span>
            <span class="xy-meta-item">
              <i>寿</i>{{ store.data.基本信息.寿元.年龄 }} / {{ store.data.基本信息.寿元.寿命 }}
            </span>
            <span class="xy-meta-item">
              <i>貌</i>{{ store.data.基本信息.寿元.外观年龄 }}
            </span>
          </div>
          <div class="xy-meta-line">
            <span class="xy-meta-item xy-loc">
              <i>地</i>{{ store.data.基本信息.地点.世界 }} · {{ store.data.基本信息.地点.地域 }} · {{ store.data.基本信息.地点.具体地点 }}
            </span>
          </div>
          <div class="xy-meta-line">
            <span class="xy-meta-item xy-time">
              <i>时</i>修仙历 {{ store.data.基本信息.时间.年 }} 年 {{ store.data.基本信息.时间.月 }} 月 {{ store.data.基本信息.时间.日 }} 日 · {{ store.data.基本信息.时间.时辰 }}
            </span>
          </div>
        </div>

        <!-- 三脉资源 -->
        <div class="xy-resources">
          <ResourceBar
            label="修为"
            :current="store.data.基本信息.修炼进度.当前进度"
            :total="store.data.基本信息.修炼进度.进度上限"
            type="cultivation"
          />
          <ResourceBar
            label="气血"
            :current="store.data.基本信息.资源池.气血.现值"
            :total="store.data.基本信息.资源池.气血.上限"
            type="blood"
          />
          <ResourceBar
            label="灵力"
            :current="store.data.基本信息.资源池.灵力.现值"
            :total="store.data.基本信息.资源池.灵力.上限"
            type="spirit"
          />
          <div class="xy-resource-extra">
            <span class="xy-extra-item"><i>遁速</i>{{ store.data.基本信息.资源池.遁速 }} m/s</span>
          </div>
        </div>

        <!-- 状态效果横条 -->
        <div v-if="!_.isEmpty(store.data.基本信息.状态效果)" class="xy-buff-strip">
          <span
            v-for="(eff, name) in store.data.基本信息.状态效果"
            :key="name"
            class="xy-buff-chip"
            :class="['xy-buff-' + (eff.类型 || '特殊')]"
          >
            {{ name }}<small v-if="eff.层数 > 1">x{{ eff.层数 }}</small>
          </span>
        </div>
      </header>

      <!-- ============ Tab 导航 ============ -->
      <nav class="xy-tabs">
        <button
          v-for="(t, i) in tabs"
          :key="i"
          :class="['xy-tab', { active: state.currentTab === i }]"
          @click="state.currentTab = i"
        >
          <span class="xy-tab-icon" v-html="t.icon" />
          <span class="xy-tab-label">{{ t.label }}</span>
        </button>
      </nav>

      <!-- ============ Tab 内容 ============ -->
      <transition name="xy-fade" mode="out-in">
        <main :key="state.currentTab" class="xy-content">
          <!-- ▼ 道身 ▼ -->
          <section v-if="state.currentTab === 0" class="xy-page xy-page-persona">
            <!-- 灵根 -->
            <div class="xy-card xy-card-root">
              <div class="xy-card-title"><span>灵根</span><em>·spiritual root·</em></div>
              <div class="xy-root-name">
                <span class="xy-root-rank">{{ store.data.基本信息.灵根.品阶 }}</span>
                <span class="xy-root-fullname">{{ store.data.基本信息.灵根.名称 }}</span>
              </div>
              <div class="xy-root-elements">
                <span
                  v-for="el in store.data.基本信息.灵根.五行"
                  :key="el"
                  class="xy-element"
                  :style="{ '--el': elColor(el) }"
                >
                  {{ el }}
                </span>
              </div>
            </div>

            <!-- 体质 -->
            <div class="xy-card xy-card-body">
              <div class="xy-card-title"><span>体质</span><em>·physique·</em></div>
              <div class="xy-body-name">{{ store.data.基本信息.体质.名称 }}</div>
              <div class="xy-attr-grid">
                <div class="xy-attr">
                  <span class="xy-attr-label">悟性</span>
                  <span class="xy-attr-value">{{ store.data.基本信息.体质.悟性 }}</span>
                </div>
                <div class="xy-attr">
                  <span class="xy-attr-label">根骨</span>
                  <span class="xy-attr-value">{{ store.data.基本信息.体质.根骨 }}</span>
                </div>
                <div class="xy-attr">
                  <span class="xy-attr-label">气感</span>
                  <span class="xy-attr-value">{{ store.data.基本信息.体质.气感 }}</span>
                </div>
              </div>
              <div v-if="!_.isEmpty(store.data.基本信息.体质.效果)" class="xy-body-effects">
                <div v-for="(desc, name) in store.data.基本信息.体质.效果" :key="name" class="xy-body-effect">
                  <span class="xy-effect-name">{{ name }}</span>
                  <span class="xy-effect-desc">{{ desc }}</span>
                </div>
              </div>
            </div>

            <!-- 技艺 -->
            <div class="xy-card xy-card-skill">
              <div class="xy-card-title"><span>技艺</span><em>·skills·</em></div>
              <div class="xy-skill-group">
                <div class="xy-skill-group-title">生产</div>
                <div class="xy-skill-grid">
                  <div v-for="(v, n) in store.data.基本信息.技艺.生产类" :key="'p-'+n" class="xy-skill">
                    <span class="xy-skill-name">{{ n }}</span>
                    <span class="xy-skill-bar">
                      <span class="xy-skill-fill" :style="{ width: skillPct(v) + '%' }" />
                    </span>
                    <span class="xy-skill-num">{{ v }}</span>
                  </div>
                </div>
              </div>
              <div class="xy-skill-group">
                <div class="xy-skill-group-title">战斗</div>
                <div class="xy-skill-grid">
                  <div v-for="(v, n) in store.data.基本信息.技艺.战斗类" :key="'c-'+n" class="xy-skill">
                    <span class="xy-skill-name">{{ n }}</span>
                    <span class="xy-skill-bar">
                      <span class="xy-skill-fill" :style="{ width: skillPct(v) + '%' }" />
                    </span>
                    <span class="xy-skill-num">{{ v }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 状态效果详情 -->
            <div v-if="!_.isEmpty(store.data.基本信息.状态效果)" class="xy-card xy-card-buff">
              <div class="xy-card-title"><span>状态</span><em>·effects·</em></div>
              <div class="xy-buff-list">
                <div
                  v-for="(eff, name) in store.data.基本信息.状态效果"
                  :key="name"
                  class="xy-buff-item"
                  :class="['xy-buff-' + (eff.类型 || '特殊')]"
                >
                  <div class="xy-buff-head">
                    <span class="xy-buff-name">{{ name }}</span>
                    <span class="xy-buff-tag">{{ eff.类型 }}</span>
                    <span class="xy-buff-time">{{ eff.剩余时间 }}</span>
                  </div>
                  <div v-if="!_.isEmpty(eff.效果)" class="xy-buff-effects">
                    <span v-for="(d, n) in eff.效果" :key="n" class="xy-buff-effect">{{ n }}：{{ d }}</span>
                  </div>
                  <div v-if="eff.来源" class="xy-buff-source">来源：{{ eff.来源 }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- ▼ 功法 ▼ -->
          <section v-else-if="state.currentTab === 1" class="xy-page xy-page-arts">
            <div v-if="_.isEmpty(store.data.修炼功法.功法)" class="xy-empty">
              <div class="xy-empty-mark">空</div>
              <p>未修任何功法</p>
            </div>
            <div v-else class="xy-art-grid">
              <article
                v-for="(art, name) in store.data.修炼功法.功法"
                :key="name"
                class="xy-art"
                :class="{ 'xy-art-active': art.使用中 }"
              >
                <div class="xy-art-head">
                  <div class="xy-art-title">
                    <span class="xy-art-name">{{ name }}</span>
                    <span :class="['xy-quality', 'xy-q-' + art.品质]">{{ art.品质 }}品</span>
                  </div>
                  <button
                    class="xy-toggle"
                    :class="{ on: art.使用中 }"
                    @click="toggleArt(name as string, !art.使用中)"
                  >
                    {{ art.使用中 ? '运转中' : '凝息' }}
                  </button>
                </div>
                <div class="xy-art-meta">
                  <span class="xy-pill">{{ art.类型 }}</span>
                  <span v-if="art.境界" class="xy-pill xy-pill-soft">{{ art.境界 }}</span>
                  <span v-if="art.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(art.五行) }">{{ art.五行 }}</span>
                  <span v-if="art.消耗" class="xy-pill xy-pill-cost">耗 {{ art.消耗 }}</span>
                </div>
                <div v-if="art.描述" class="xy-art-desc">{{ art.描述 }}</div>
                <div v-if="!_.isEmpty(art.效果)" class="xy-effect-list">
                  <span v-for="(d, n) in art.效果" :key="n" class="xy-effect-line">{{ n }}：{{ d }}</span>
                </div>
                <div v-if="art.标签 && art.标签.length" class="xy-tags">
                  <span v-for="t in art.标签" :key="t" class="xy-tag">{{ t }}</span>
                </div>
              </article>
            </div>
          </section>

          <!-- ▼ 储物 ▼ -->
          <section v-else-if="state.currentTab === 2" class="xy-page xy-page-storage">
            <div class="xy-stone">
              <div class="xy-stone-label">灵石</div>
              <div class="xy-stone-value">{{ store.data.储物空间.灵石.toLocaleString() }}</div>
              <div class="xy-stone-unit">下品</div>
            </div>

            <div class="xy-storage-tabs">
              <button
                v-for="(s, i) in storageTabs"
                :key="s.key"
                :class="['xy-stab', { active: state.storageTab === i }]"
                @click="state.storageTab = i"
              >
                {{ s.label }}
                <em>{{ storageCount(s.key) }}</em>
              </button>
            </div>

            <!-- 物品 -->
            <div v-if="state.storageTab === 0" class="xy-item-grid">
              <article
                v-for="(it, name) in store.data.储物空间.物品"
                :key="name"
                class="xy-item"
                :class="['xy-q-bg-' + it.品质]"
              >
                <div class="xy-item-head">
                  <span class="xy-item-name">{{ name }}</span>
                  <span class="xy-item-qty">×{{ it.数量 }}</span>
                </div>
                <div class="xy-item-meta">
                  <span :class="['xy-quality', 'xy-q-' + it.品质]">{{ it.品质 }}</span>
                  <span class="xy-pill">{{ it.类型 }}</span>
                  <span v-if="it.境界" class="xy-pill xy-pill-soft">{{ it.境界 }}</span>
                  <span v-if="it.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(it.五行) }">{{ it.五行 }}</span>
                </div>
                <div v-if="it.描述" class="xy-item-desc">{{ it.描述 }}</div>
                <div v-if="!_.isEmpty(it.效果)" class="xy-effect-list">
                  <span v-for="(d, n) in it.效果" :key="n" class="xy-effect-line">{{ n }}：{{ d }}</span>
                </div>
              </article>
              <div v-if="_.isEmpty(store.data.储物空间.物品)" class="xy-empty">
                <div class="xy-empty-mark">无</div>
                <p>储物空间空空如也</p>
              </div>
            </div>

            <!-- 装备 -->
            <div v-else-if="state.storageTab === 1" class="xy-item-grid">
              <article
                v-for="(eq, name) in store.data.储物空间.装备"
                :key="name"
                class="xy-item xy-equipment"
                :class="['xy-q-bg-' + eq.品质]"
              >
                <div class="xy-item-head">
                  <span class="xy-item-name">{{ name }}</span>
                  <span class="xy-item-pos">{{ eq.位置 }}</span>
                </div>
                <div class="xy-item-meta">
                  <span :class="['xy-quality', 'xy-q-' + eq.品质]">{{ eq.品质 }}</span>
                  <span class="xy-pill">{{ eq.类型 }}</span>
                  <span v-if="eq.境界" class="xy-pill xy-pill-soft">{{ eq.境界 }}</span>
                  <span v-if="eq.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(eq.五行) }">{{ eq.五行 }}</span>
                </div>
                <div class="xy-eq-stats">
                  <span v-if="eq.攻击力 != null" class="xy-eq-stat xy-stat-atk">攻 {{ eq.攻击力 }}</span>
                  <span v-if="eq.防御力 != null" class="xy-eq-stat xy-stat-def">防 {{ eq.防御力 }}</span>
                </div>
                <div v-if="eq.描述" class="xy-item-desc">{{ eq.描述 }}</div>
                <div v-if="!_.isEmpty(eq.效果)" class="xy-effect-list">
                  <span v-for="(d, n) in eq.效果" :key="n" class="xy-effect-line">{{ n }}：{{ d }}</span>
                </div>
              </article>
              <div v-if="_.isEmpty(store.data.储物空间.装备)" class="xy-empty">
                <div class="xy-empty-mark">无</div>
                <p>未持任何装备</p>
              </div>
            </div>

            <!-- 傀儡 -->
            <div v-else-if="state.storageTab === 2" class="xy-item-grid">
              <CombatUnitCard
                v-for="(u, name) in store.data.储物空间.傀儡"
                :key="name"
                :unit="u"
                :name="String(name)"
                @toggle="toggleUnit('傀儡', String(name), $event)"
              />
              <div v-if="_.isEmpty(store.data.储物空间.傀儡)" class="xy-empty">
                <div class="xy-empty-mark">无</div>
                <p>暂无傀儡</p>
              </div>
            </div>

            <!-- 灵兽 -->
            <div v-else class="xy-item-grid">
              <CombatUnitCard
                v-for="(u, name) in store.data.储物空间.灵兽"
                :key="name"
                :unit="u"
                :name="String(name)"
                @toggle="toggleUnit('灵兽', String(name), $event)"
              />
              <div v-if="_.isEmpty(store.data.储物空间.灵兽)" class="xy-empty">
                <div class="xy-empty-mark">无</div>
                <p>暂无灵兽</p>
              </div>
            </div>
          </section>

          <!-- ▼ 关系 ▼ -->
          <section v-else-if="state.currentTab === 3" class="xy-page xy-page-relations">
            <div v-if="_.isEmpty(store.data.关系列表)" class="xy-empty">
              <div class="xy-empty-mark">独</div>
              <p>尚未结识任何人</p>
            </div>
            <div v-else class="xy-npc-list">
              <article
                v-for="(npc, name) in store.data.关系列表"
                :key="name"
                class="xy-npc"
                :class="{ 'xy-npc-open': state.openedNPC === name }"
                @click="state.openedNPC = state.openedNPC === name ? null : (name as string)"
              >
                <div class="xy-npc-head">
                  <div class="xy-npc-avatar" :class="{ active: npc.在场 }">
                    {{ avatarChar(name as string) }}
                  </div>
                  <div class="xy-npc-info">
                    <div class="xy-npc-line1">
                      <span class="xy-npc-name">{{ name }}</span>
                      <span class="xy-npc-realm">{{ npc.修炼进度?.境界 || '凡人' }}</span>
                      <span v-if="npc.在场" class="xy-npc-online">在场</span>
                    </div>
                    <div class="xy-npc-line2">
                      <span class="xy-npc-race">{{ npc.种族 }}</span>
                      <span v-if="npc.身份 && npc.身份.length">·</span>
                      <span v-for="id in npc.身份" :key="id" class="xy-npc-id">{{ id }}</span>
                      <span v-if="npc.道侣" class="xy-npc-couple">道侣</span>
                    </div>
                  </div>
                  <div class="xy-favor" :class="favorClass(npc.好感度)">
                    <div class="xy-favor-num">{{ npc.好感度 }}</div>
                    <div class="xy-favor-label">{{ favorLabel(npc.好感度) }}</div>
                  </div>
                </div>

                <div v-if="state.openedNPC === name" class="xy-npc-body" @click.stop>
                  <div class="xy-npc-grid">
                    <div class="xy-mini">
                      <h4>寿元</h4>
                      <p>{{ npc.寿元?.年龄 }} / {{ npc.寿元?.寿命 }}（貌 {{ npc.寿元?.外观年龄 }}）</p>
                    </div>
                    <div class="xy-mini">
                      <h4>灵根</h4>
                      <p>
                        <span>{{ npc.灵根?.名称 || '未检测' }}</span>
                        <span v-for="el in npc.灵根?.五行 || []" :key="el" class="xy-element xy-element-mini" :style="{ '--el': elColor(el) }">{{ el }}</span>
                      </p>
                    </div>
                    <div class="xy-mini">
                      <h4>体质</h4>
                      <p>{{ npc.体质?.名称 }} <small>悟{{ npc.体质?.悟性 }}/骨{{ npc.体质?.根骨 }}/感{{ npc.体质?.气感 }}</small></p>
                    </div>
                    <div class="xy-mini">
                      <h4>资源</h4>
                      <p>
                        气血 {{ npc.资源池?.气血?.现值 }}/{{ npc.资源池?.气血?.上限 }} ·
                        灵力 {{ npc.资源池?.灵力?.现值 }}/{{ npc.资源池?.灵力?.上限 }}
                      </p>
                    </div>
                  </div>
                  <div v-if="npc.性格" class="xy-mini-block"><h4>性格</h4><p>{{ npc.性格 }}</p></div>
                  <div v-if="npc.外貌" class="xy-mini-block"><h4>外貌</h4><p>{{ npc.外貌 }}</p></div>
                  <div v-if="npc.着装" class="xy-mini-block"><h4>着装</h4><p>{{ npc.着装 }}</p></div>
                </div>
              </article>
            </div>
          </section>

          <!-- ▼ 传闻 ▼ -->
          <section v-else-if="state.currentTab === 4" class="xy-page xy-page-rumors">
            <div class="xy-rumor-filter">
              <button
                :class="['xy-chip', { active: state.rumorFilter === 'all' }]"
                @click="state.rumorFilter = 'all'"
              >
                全部 <em>{{ store.data.传闻.length }}</em>
              </button>
              <button
                v-for="g in rumorGroups"
                :key="g.key"
                :class="['xy-chip', { active: state.rumorFilter === g.key }]"
                @click="state.rumorFilter = g.key"
              >
                {{ g.label }} <em>{{ countByGroup(g.types) }}</em>
              </button>
            </div>

            <div v-if="filteredRumors.length === 0" class="xy-empty">
              <div class="xy-empty-mark">寂</div>
              <p>风平浪静，未闻新事</p>
            </div>

            <div v-else class="xy-rumor-list">
              <article v-for="(r, i) in filteredRumors" :key="i" class="xy-rumor" :class="['xy-rumor-' + rumorGroup(r.类型)]">
                <div class="xy-rumor-head">
                  <div class="xy-rumor-seal">
                    <span>{{ r.类型 }}</span>
                  </div>
                  <div class="xy-rumor-meta">
                    <div class="xy-rumor-time">{{ r.时间 || '不知何时' }}</div>
                    <div class="xy-rumor-source">— {{ r.来源 || '不知何处' }}</div>
                  </div>
                </div>
                <div class="xy-rumor-body">{{ r.内容 }}</div>
              </article>
            </div>
          </section>
        </main>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, h, reactive } from 'vue';
import { useDataStore } from './store';

const store = useDataStore();

const state = reactive({
  currentTab: 0,
  storageTab: 0,
  openedNPC: null as string | null,
  rumorFilter: 'all' as string,
});

const tabs = [
  { label: '道身', icon: '☯' },
  { label: '功法', icon: '卷' },
  { label: '储物', icon: '囊' },
  { label: '关系', icon: '缘' },
  { label: '传闻', icon: '闻' },
];

const storageTabs = [
  { key: '物品', label: '物品' },
  { key: '装备', label: '装备' },
  { key: '傀儡', label: '傀儡' },
  { key: '灵兽', label: '灵兽' },
] as const;

const storageCount = (key: '物品' | '装备' | '傀儡' | '灵兽') =>
  Object.keys((store.data.储物空间 as any)[key] || {}).length;

const rumorGroups = [
  { key: 'world', label: '修仙界要闻', types: ['大派动向', '仙人行迹', '宗门战事', '灵脉异变', '道庭法令'] },
  { key: 'mystic', label: '秘境异闻', types: ['秘境传闻', '高额悬赏', '妖兽异动', '通缉魔修', '宝物现世'] },
  { key: 'jiang', label: '江湖逸闻', types: ['风流韵事', '千里同心', '缘分将至', '邂逅预兆', '恩怨流转'] },
  { key: 'sect', label: '宗门内务', types: ['同门轶事', '师长动向', '门内任务', '资源调配', '内部秘辛'] },
] as const;

const sealText = computed(() => {
  const r = store.data?.基本信息?.修炼进度?.境界 || '';
  return r.slice(0, 2) || '修';
});

const elColor = (el: string) =>
  ({
    金: 'var(--xy-el-jin)',
    木: 'var(--xy-el-mu)',
    水: 'var(--xy-el-shui)',
    火: 'var(--xy-el-huo)',
    土: 'var(--xy-el-tu)',
    阴: 'var(--xy-el-yin)',
    阳: 'var(--xy-el-yang)',
    混沌: 'var(--xy-el-hundun)',
  } as Record<string, string>)[el] || 'var(--xy-ink)';

const skillPct = (v: number) => Math.max(2, Math.min(100, v));

const avatarChar = (name: string) => {
  const m = name.match(/^([^\s【\[]+)/);
  return (m ? m[1] : name).slice(0, 1);
};

const favorLabel = (n: number) => {
  if (n >= 80) return '至交';
  if (n >= 50) return '亲密';
  if (n >= 20) return '友善';
  if (n >= -10) return '中立';
  if (n >= -50) return '提防';
  return '仇敌';
};
const favorClass = (n: number) => {
  if (n >= 50) return 'xy-favor-high';
  if (n >= 0) return 'xy-favor-mid';
  if (n >= -30) return 'xy-favor-low';
  return 'xy-favor-bad';
};

// 功法启用切换 + 互斥（心法/护体/身法）
const toggleArt = (name: string, value: boolean) => {
  const arts = store.data.修炼功法.功法 as Record<string, any>;
  const art = arts[name];
  if (!art) return;
  const exclusive = ['心法', '护体', '身法'];
  if (value && exclusive.includes(art.类型)) {
    for (const [k, v] of Object.entries(arts)) {
      if (k !== name && v.使用中 && v.类型 === art.类型) v.使用中 = false;
    }
  }
  art.使用中 = value;
};

const toggleUnit = (kind: '傀儡' | '灵兽', name: string, value: boolean) => {
  const slot = (store.data.储物空间 as any)[kind];
  if (slot && slot[name]) slot[name].使用中 = value;
};

// 传闻
const rumorGroup = (t: string) => {
  for (const g of rumorGroups) if ((g.types as readonly string[]).includes(t)) return g.key;
  return 'world';
};
const countByGroup = (types: readonly string[]) =>
  store.data.传闻.filter(r => types.includes(r.类型)).length;
const filteredRumors = computed(() => {
  const list = store.data.传闻 || [];
  if (state.rumorFilter === 'all') return list;
  const grp = rumorGroups.find(g => g.key === state.rumorFilter);
  if (!grp) return list;
  return list.filter(r => (grp.types as readonly string[]).includes(r.类型));
});

// =============== 傀儡/灵兽卡片 ===============
const CombatUnitCard = (props: { unit: any; name: string }, ctx: any) => {
  const u = props.unit;
  const hp = u?.资源池?.气血 || { 现值: 0, 上限: 1 };
  const mp = u?.资源池?.灵力 || { 现值: 0, 上限: 1 };
  const hpPct = Math.max(0, Math.min(100, (hp.现值 / Math.max(hp.上限, 1)) * 100));
  const mpPct = Math.max(0, Math.min(100, (mp.现值 / Math.max(mp.上限, 1)) * 100));

  return h(
    'article',
    { class: ['xy-item', 'xy-unit', 'xy-q-bg-' + u.品质, { 'xy-unit-active': u.使用中 }] },
    [
      h('div', { class: 'xy-item-head' }, [
        h('span', { class: 'xy-item-name' }, props.name),
        h(
          'button',
          {
            class: ['xy-toggle', { on: u.使用中 }],
            onClick: () => ctx.emit('toggle', !u.使用中),
          },
          u.使用中 ? '在身' : '入囊',
        ),
      ]),
      h('div', { class: 'xy-item-meta' }, [
        h('span', { class: ['xy-quality', 'xy-q-' + u.品质] }, u.品质),
        u.境界 ? h('span', { class: 'xy-pill xy-pill-soft' }, u.境界) : null,
        u.五行
          ? h('span', { class: 'xy-element xy-element-mini', style: { '--el': elColor(u.五行) } }, u.五行)
          : null,
      ]),
      h('div', { class: 'xy-unit-bars' }, [
        h('div', { class: 'xy-unit-bar' }, [
          h('span', { class: 'xy-unit-bar-label' }, '气血'),
          h('span', { class: 'xy-unit-bar-track' }, [
            h('span', { class: 'xy-unit-bar-fill blood', style: { width: hpPct + '%' } }),
          ]),
          h('span', { class: 'xy-unit-bar-num' }, `${hp.现值}/${hp.上限}`),
        ]),
        h('div', { class: 'xy-unit-bar' }, [
          h('span', { class: 'xy-unit-bar-label' }, '灵力'),
          h('span', { class: 'xy-unit-bar-track' }, [
            h('span', { class: 'xy-unit-bar-fill spirit', style: { width: mpPct + '%' } }),
          ]),
          h('span', { class: 'xy-unit-bar-num' }, `${mp.现值}/${mp.上限}`),
        ]),
      ]),
      h('div', { class: 'xy-unit-stats' }, [
        h('span', { class: 'xy-eq-stat xy-stat-def' }, `防 ${u.防御力 ?? 0}`),
        h('span', { class: 'xy-eq-stat' }, `遁 ${u.资源池?.遁速 ?? 0}`),
      ]),
      u.描述 ? h('div', { class: 'xy-item-desc' }, u.描述) : null,
      !_.isEmpty(u.技能)
        ? h(
            'div',
            { class: 'xy-skill-list' },
            Object.entries(u.技能 as Record<string, any>).map(([sn, sv]) =>
              h('div', { class: 'xy-skill-line', key: sn }, [
                h('span', { class: 'xy-skill-line-name' }, sn),
                h('span', { class: 'xy-skill-line-atk' }, '攻 ' + (sv.攻击力 ?? 0)),
                sv.消耗 ? h('span', { class: 'xy-pill xy-pill-cost' }, '耗 ' + sv.消耗) : null,
              ]),
            ),
          )
        : null,
    ],
  );
};
(CombatUnitCard as any).props = ['unit', 'name'];
(CombatUnitCard as any).emits = ['toggle'];

// =============== 资源条 ===============
const ResourceBar = (props: { label: string; current: number; total: number; type: string }) => {
  const pct = Math.max(0, Math.min(100, (props.current / Math.max(props.total, 1)) * 100));
  return h('div', { class: ['xy-bar', 'xy-bar-' + props.type] }, [
    h('div', { class: 'xy-bar-head' }, [
      h('span', { class: 'xy-bar-label' }, props.label),
      h('span', { class: 'xy-bar-num' }, `${props.current} / ${props.total}`),
    ]),
    h('div', { class: 'xy-bar-track' }, [
      h('div', { class: 'xy-bar-fill', style: { width: pct + '%' } }),
      h('div', { class: 'xy-bar-shimmer', style: { width: pct + '%' } }),
    ]),
  ]);
};
(ResourceBar as any).props = ['label', 'current', 'total', 'type'];

</script>

<style scoped>
/* ============ 应用容器 ============ */
.xy-app {
  width: 100%;
  max-width: 760px;
  position: relative;
  font-family: var(--xy-font-body);
  color: var(--xy-ink);
}

/* 装饰背景层 */
.xy-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.xy-bg-mountain {
  position: absolute;
  bottom: 6%;
  left: -5%;
  width: 110%;
  height: 32%;
  opacity: 0.7;
}
.xy-crane {
  position: absolute;
  width: 56px;
  height: 42px;
  opacity: 0.85;
  animation: xy-float 6s ease-in-out infinite;
}
.xy-crane-1 {
  top: 4%;
  right: 6%;
  animation-delay: 0s;
}
.xy-crane-2 {
  top: 18%;
  left: 8%;
  width: 38px;
  height: 28px;
  animation-delay: 1.6s;
  opacity: 0.55;
}

/* ============ 卷轴主体 ============ */
.xy-scroll {
  position: relative;
  z-index: 1;
  background: linear-gradient(180deg, rgba(250, 246, 238, 0.92) 0%, rgba(247, 241, 227, 0.88) 100%);
  border-radius: 14px;
  padding: 22px 18px 18px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.6) inset,
    0 12px 36px -12px rgba(42, 37, 32, 0.25),
    0 0 0 1px rgba(201, 169, 110, 0.28);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.xy-scroll::before,
.xy-scroll::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--xy-line-gold) 20%, var(--xy-line-gold) 80%, transparent);
}
.xy-scroll::before {
  top: 8px;
}
.xy-scroll::after {
  bottom: 8px;
}

/* ============ 头部 Hero ============ */
.xy-hero {
  position: relative;
  padding: 6px 4px 14px;
  border-bottom: 1px dashed var(--xy-line);
  margin-bottom: 14px;
}

.xy-hero-top {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.xy-name-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 4px;
}
.xy-seal {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--xy-cinnabar) 0%, var(--xy-cinnabar-deep) 100%);
  color: var(--xy-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--xy-font-title);
  font-size: 24px;
  letter-spacing: 1px;
  border-radius: 6px;
  position: relative;
  transform: rotate(-3deg);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.18) inset,
    0 0 0 2px rgba(177, 58, 58, 0.4),
    0 0 0 4px var(--xy-paper),
    0 0 0 5px rgba(177, 58, 58, 0.55),
    0 6px 16px -6px rgba(177, 58, 58, 0.6);
  animation: xy-seal-stamp 0.8s ease-out;
}
.xy-seal::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(247, 241, 227, 0.35);
  border-radius: 3px;
  pointer-events: none;
}
.xy-name-meta {
  flex: 1 1 auto;
  min-width: 0;
}
.xy-name {
  font-family: var(--xy-font-title);
  font-size: 38px;
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: 4px;
  color: var(--xy-ink);
  margin-bottom: 2px;
}
.xy-realm {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.xy-realm-label {
  font-size: 12px;
  color: var(--xy-ink-mute);
  letter-spacing: 4px;
}
.xy-realm-value {
  font-family: var(--xy-font-display);
  font-size: 18px;
  color: var(--xy-cinnabar);
  letter-spacing: 2px;
}
.xy-tianqian {
  font-size: 11px;
  color: var(--xy-cinnabar-deep);
  border: 1px solid var(--xy-cinnabar);
  padding: 1px 6px;
  border-radius: 2px;
  letter-spacing: 1px;
  background: rgba(177, 58, 58, 0.08);
}

.xy-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 13px;
  color: var(--xy-ink-soft);
  letter-spacing: 0.5px;
}
.xy-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.xy-meta-item i {
  display: inline-block;
  font-style: normal;
  font-family: var(--xy-font-display);
  color: var(--xy-gold-deep);
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border: 1px solid var(--xy-line-gold);
  font-size: 11px;
  border-radius: 2px;
  background: var(--xy-paper-warm);
  margin-right: 2px;
}
.xy-loc,
.xy-time {
  font-size: 12.5px;
}

/* 资源条 */
.xy-resources {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 14px;
  background: var(--xy-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--xy-line-gold);
  border-radius: 6px;
}
.xy-resource-extra {
  margin-top: 2px;
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--xy-ink-soft);
}
.xy-extra-item i {
  font-style: normal;
  color: var(--xy-gold-deep);
  margin-right: 4px;
  font-family: var(--xy-font-display);
}

.xy-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.xy-bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.xy-bar-label {
  font-family: var(--xy-font-display);
  letter-spacing: 4px;
  color: var(--xy-ink);
}
.xy-bar-num {
  color: var(--xy-ink-mute);
  font-variant-numeric: tabular-nums;
}
.xy-bar-track {
  position: relative;
  height: 8px;
  background: rgba(42, 37, 32, 0.08);
  border-radius: 4px;
  overflow: hidden;
}
.xy-bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--bar-from), var(--bar-to));
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.xy-bar-shimmer {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 4px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent 30%, rgba(255, 255, 255, 0.55), transparent 70%);
  background-size: 200% 100%;
  animation: xy-shimmer 3s linear infinite;
  mix-blend-mode: overlay;
}
.xy-bar-cultivation {
  --bar-from: var(--xy-jade-deep);
  --bar-to: var(--xy-jade);
}
.xy-bar-blood {
  --bar-from: #8a2828;
  --bar-to: #d05858;
}
.xy-bar-spirit {
  --bar-from: #3d5a8a;
  --bar-to: #6f9bd0;
}

/* 状态横条 */
.xy-buff-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.xy-buff-chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid var(--xy-line);
  background: var(--xy-glass);
  letter-spacing: 0.5px;
}
.xy-buff-chip small {
  margin-left: 3px;
  color: var(--xy-cinnabar);
}
.xy-buff-增益 {
  border-color: var(--xy-jade);
  color: var(--xy-jade-deep);
  background: rgba(91, 138, 114, 0.08);
}
.xy-buff-减益 {
  border-color: var(--xy-cinnabar);
  color: var(--xy-cinnabar-deep);
  background: rgba(177, 58, 58, 0.08);
}
.xy-buff-特殊 {
  border-color: var(--xy-gold);
  color: var(--xy-gold-deep);
  background: rgba(201, 169, 110, 0.1);
}

/* ============ Tab 导航 ============ */
.xy-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  padding: 4px;
  background: rgba(42, 37, 32, 0.05);
  border-radius: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}
.xy-tabs::-webkit-scrollbar {
  display: none;
}
.xy-tab {
  flex: 1 1 0;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  font-size: 13px;
  border-radius: 6px;
  color: var(--xy-ink-soft);
  transition: all 0.25s ease;
  position: relative;
}
.xy-tab-icon {
  font-family: var(--xy-font-display);
  font-size: 18px;
  line-height: 1;
  color: var(--xy-ink-mute);
  transition: color 0.25s;
}
.xy-tab-label {
  font-family: var(--xy-font-display);
  letter-spacing: 4px;
  font-size: 13px;
}
.xy-tab.active {
  background: linear-gradient(180deg, var(--xy-paper-soft) 0%, var(--xy-paper-warm) 100%);
  color: var(--xy-cinnabar-deep);
  box-shadow:
    0 0 0 1px var(--xy-line-gold),
    0 4px 12px -4px rgba(42, 37, 32, 0.2);
}
.xy-tab.active .xy-tab-icon {
  color: var(--xy-cinnabar);
}

/* ============ 通用 Card ============ */
.xy-content {
  position: relative;
  z-index: 1;
}
.xy-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: xy-fade-up 0.4s ease-out;
}
.xy-card {
  position: relative;
  background: var(--xy-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--xy-line-gold);
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: var(--xy-shadow);
}
.xy-card-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--xy-font-display);
  font-size: 16px;
  letter-spacing: 6px;
  color: var(--xy-ink);
  border-bottom: 1px solid var(--xy-line);
  padding-bottom: 8px;
  margin-bottom: 10px;
}
.xy-card-title em {
  font-style: italic;
  font-family: 'Georgia', serif;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--xy-ink-mute);
  font-weight: 300;
}

/* 灵根 */
.xy-root-name {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}
.xy-root-rank {
  font-family: var(--xy-font-display);
  font-size: 13px;
  padding: 2px 8px;
  background: var(--xy-paper-warm);
  border: 1px solid var(--xy-line-gold);
  color: var(--xy-gold-deep);
  border-radius: 2px;
  letter-spacing: 1px;
}
.xy-root-fullname {
  font-family: var(--xy-font-display);
  font-size: 18px;
  color: var(--xy-ink);
  letter-spacing: 2px;
}
.xy-root-elements {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.xy-element {
  --el: var(--xy-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 2px 8px;
  font-family: var(--xy-font-display);
  font-size: 13px;
  letter-spacing: 1px;
  background: color-mix(in srgb, var(--el) 15%, var(--xy-paper-soft));
  border: 1px solid color-mix(in srgb, var(--el) 50%, transparent);
  color: var(--el);
  border-radius: 50%;
  width: 28px;
  height: 28px;
}
.xy-element-mini {
  width: 22px;
  height: 22px;
  font-size: 11px;
  min-width: 22px;
  padding: 0;
}

/* 体质 */
.xy-body-name {
  font-family: var(--xy-font-display);
  font-size: 18px;
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.xy-attr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.xy-attr {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: var(--xy-paper-warm);
  border: 1px solid var(--xy-line-gold);
  border-radius: 4px;
}
.xy-attr-label {
  font-size: 11px;
  color: var(--xy-ink-mute);
  letter-spacing: 2px;
}
.xy-attr-value {
  font-family: var(--xy-font-display);
  font-size: 22px;
  color: var(--xy-cinnabar);
  margin-top: 2px;
}
.xy-body-effects {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.xy-body-effect {
  font-size: 12.5px;
  padding: 4px 8px;
  border-left: 2px solid var(--xy-gold);
  background: var(--xy-paper-warm);
}
.xy-effect-name {
  font-family: var(--xy-font-display);
  margin-right: 6px;
  color: var(--xy-cinnabar);
}
.xy-effect-desc {
  color: var(--xy-ink-soft);
}

/* 技艺 */
.xy-skill-group {
  margin-bottom: 8px;
}
.xy-skill-group:last-child {
  margin-bottom: 0;
}
.xy-skill-group-title {
  font-family: var(--xy-font-display);
  font-size: 13px;
  letter-spacing: 4px;
  color: var(--xy-ink-mute);
  margin-bottom: 6px;
  border-left: 3px solid var(--xy-cinnabar);
  padding-left: 6px;
}
.xy-skill-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 14px;
}
.xy-skill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.xy-skill-name {
  flex: 0 0 32px;
  color: var(--xy-ink-soft);
}
.xy-skill-bar {
  flex: 1 1 auto;
  height: 4px;
  background: rgba(42, 37, 32, 0.08);
  border-radius: 2px;
  overflow: hidden;
}
.xy-skill-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--xy-gold-deep), var(--xy-gold));
  transition: width 0.5s ease;
}
.xy-skill-num {
  flex: 0 0 24px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--xy-ink);
}

/* 状态详情 */
.xy-buff-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.xy-buff-item {
  padding: 8px 10px;
  border: 1px solid var(--xy-line);
  border-radius: 4px;
  background: var(--xy-paper-warm);
}
.xy-buff-item.xy-buff-增益 {
  border-left: 3px solid var(--xy-jade);
}
.xy-buff-item.xy-buff-减益 {
  border-left: 3px solid var(--xy-cinnabar);
}
.xy-buff-item.xy-buff-特殊 {
  border-left: 3px solid var(--xy-gold);
}
.xy-buff-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.xy-buff-name {
  font-family: var(--xy-font-display);
  font-size: 14px;
}
.xy-buff-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 2px;
  background: rgba(42, 37, 32, 0.06);
  color: var(--xy-ink-mute);
}
.xy-buff-time {
  margin-left: auto;
  font-size: 11px;
  color: var(--xy-ink-mute);
}
.xy-buff-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--xy-ink-soft);
}
.xy-buff-source {
  margin-top: 4px;
  font-size: 11px;
  color: var(--xy-ink-mute);
}

/* ============ 功法 ============ */
.xy-art-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 580px) {
  .xy-art-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.xy-art {
  position: relative;
  background: var(--xy-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--xy-line-gold);
  border-radius: 6px;
  padding: 12px 14px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.xy-art:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(42, 37, 32, 0.25);
}
.xy-art-active {
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.15), rgba(250, 246, 238, 0.7));
  border-color: var(--xy-gold);
  box-shadow: 0 0 0 1px rgba(201, 169, 110, 0.3), 0 4px 16px -4px rgba(201, 169, 110, 0.4);
}
.xy-art-active::after {
  content: '运';
  position: absolute;
  top: 8px;
  right: 8px;
  font-family: var(--xy-font-title);
  font-size: 28px;
  color: rgba(177, 58, 58, 0.18);
  pointer-events: none;
}
.xy-art-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.xy-art-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
}
.xy-art-name {
  font-family: var(--xy-font-display);
  font-size: 16px;
  letter-spacing: 1.5px;
  color: var(--xy-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.xy-toggle {
  flex: 0 0 auto;
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid var(--xy-line);
  border-radius: 12px;
  background: var(--xy-paper-warm);
  color: var(--xy-ink-soft);
  letter-spacing: 1px;
  font-family: var(--xy-font-display);
  transition: all 0.2s ease;
}
.xy-toggle.on {
  background: linear-gradient(135deg, var(--xy-cinnabar), var(--xy-cinnabar-deep));
  color: var(--xy-paper);
  border-color: var(--xy-cinnabar);
  box-shadow: 0 0 0 2px rgba(177, 58, 58, 0.18);
}
.xy-art-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}
.xy-art-desc {
  font-size: 12.5px;
  color: var(--xy-ink-soft);
  line-height: 1.7;
  margin-bottom: 6px;
}
.xy-effect-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
}
.xy-effect-line {
  font-size: 12px;
  color: var(--xy-ink-soft);
  padding: 2px 6px;
  border-left: 2px solid var(--xy-jade);
  background: rgba(91, 138, 114, 0.06);
}
.xy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.xy-tag {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(42, 37, 32, 0.05);
  color: var(--xy-ink-mute);
}

/* 通用 pill / 品质 */
.xy-pill {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 2px;
  background: var(--xy-paper-warm);
  border: 1px solid var(--xy-line);
  color: var(--xy-ink-soft);
  letter-spacing: 0.5px;
}
.xy-pill-soft {
  background: rgba(91, 138, 114, 0.08);
  border-color: rgba(91, 138, 114, 0.25);
  color: var(--xy-jade-deep);
}
.xy-pill-cost {
  background: rgba(177, 58, 58, 0.08);
  border-color: rgba(177, 58, 58, 0.25);
  color: var(--xy-cinnabar-deep);
}

.xy-quality {
  font-family: var(--xy-font-display);
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 2px;
  letter-spacing: 1px;
}
.xy-q-凡 {
  background: #d4cfc4;
  color: #5a5249;
}
.xy-q-黄 {
  background: linear-gradient(135deg, #d4b06a, #b58938);
  color: #fff;
}
.xy-q-玄 {
  background: linear-gradient(135deg, #5b4a72, #2e2640);
  color: #fff;
}
.xy-q-地 {
  background: linear-gradient(135deg, #8a6845, #5e4530);
  color: #fff;
}
.xy-q-天 {
  background: linear-gradient(135deg, #c9a96e, #b13a3a);
  color: #fff;
  box-shadow: 0 0 8px rgba(201, 169, 110, 0.6);
}

/* ============ 储物 ============ */
.xy-stone {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 14px 18px;
  background:
    radial-gradient(circle at 80% 50%, rgba(201, 169, 110, 0.18), transparent 60%),
    linear-gradient(135deg, var(--xy-paper-soft), var(--xy-paper-warm));
  border: 1px solid var(--xy-line-gold);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}
.xy-stone::after {
  content: '寶';
  position: absolute;
  right: -10px;
  top: -20px;
  font-family: var(--xy-font-title);
  font-size: 80px;
  color: rgba(201, 169, 110, 0.18);
}
.xy-stone-label {
  font-family: var(--xy-font-display);
  font-size: 14px;
  letter-spacing: 4px;
  color: var(--xy-ink-mute);
}
.xy-stone-value {
  font-family: var(--xy-font-title);
  font-size: 28px;
  color: var(--xy-cinnabar);
  font-variant-numeric: tabular-nums;
}
.xy-stone-unit {
  font-size: 12px;
  color: var(--xy-ink-mute);
}

.xy-storage-tabs {
  display: flex;
  gap: 4px;
  background: rgba(42, 37, 32, 0.05);
  padding: 3px;
  border-radius: 6px;
}
.xy-stab {
  flex: 1 1 0;
  padding: 6px 8px;
  font-size: 12.5px;
  font-family: var(--xy-font-display);
  letter-spacing: 2px;
  color: var(--xy-ink-soft);
  border-radius: 4px;
  transition: all 0.2s ease;
}
.xy-stab em {
  margin-left: 4px;
  font-style: normal;
  font-size: 10px;
  color: var(--xy-ink-mute);
}
.xy-stab.active {
  background: var(--xy-paper-soft);
  color: var(--xy-cinnabar-deep);
  box-shadow: 0 0 0 1px var(--xy-line-gold);
}

.xy-item-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
@media (min-width: 580px) {
  .xy-item-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.xy-item {
  background: var(--xy-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--xy-line);
  border-radius: 6px;
  padding: 10px 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.xy-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px -4px rgba(42, 37, 32, 0.2);
}
.xy-q-bg-黄 {
  border-left: 3px solid #b58938;
}
.xy-q-bg-玄 {
  border-left: 3px solid #5b4a72;
}
.xy-q-bg-地 {
  border-left: 3px solid #5e4530;
}
.xy-q-bg-天 {
  border-left: 3px solid var(--xy-gold);
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.1), var(--xy-glass));
}
.xy-item-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.xy-item-name {
  font-family: var(--xy-font-display);
  font-size: 15px;
  letter-spacing: 1px;
}
.xy-item-qty {
  font-size: 12px;
  color: var(--xy-cinnabar);
  font-variant-numeric: tabular-nums;
}
.xy-item-pos {
  font-size: 11px;
  padding: 1px 6px;
  border: 1px dashed var(--xy-line-gold);
  color: var(--xy-gold-deep);
  border-radius: 2px;
}
.xy-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}
.xy-item-desc {
  font-size: 12px;
  color: var(--xy-ink-soft);
  line-height: 1.6;
  margin-top: 4px;
}

.xy-eq-stats {
  display: flex;
  gap: 10px;
  margin: 4px 0;
}
.xy-eq-stat {
  font-size: 12px;
  font-family: var(--xy-font-display);
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 2px;
  background: rgba(42, 37, 32, 0.05);
}
.xy-stat-atk {
  color: var(--xy-cinnabar-deep);
  background: rgba(177, 58, 58, 0.1);
}
.xy-stat-def {
  color: var(--xy-jade-deep);
  background: rgba(91, 138, 114, 0.12);
}

/* 傀儡/灵兽 */
.xy-unit-active {
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.12), var(--xy-glass));
  border-color: var(--xy-gold);
}
.xy-unit-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 6px 0;
}
.xy-unit-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.xy-unit-bar-label {
  flex: 0 0 26px;
  color: var(--xy-ink-mute);
}
.xy-unit-bar-track {
  flex: 1 1 auto;
  height: 5px;
  background: rgba(42, 37, 32, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.xy-unit-bar-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s;
}
.xy-unit-bar-fill.blood {
  background: linear-gradient(90deg, #8a2828, #d05858);
}
.xy-unit-bar-fill.spirit {
  background: linear-gradient(90deg, #3d5a8a, #6f9bd0);
}
.xy-unit-bar-num {
  flex: 0 0 auto;
  font-size: 10.5px;
  color: var(--xy-ink-mute);
  font-variant-numeric: tabular-nums;
}
.xy-unit-stats {
  display: flex;
  gap: 8px;
}
.xy-skill-list {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.xy-skill-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 3px 6px;
  background: rgba(42, 37, 32, 0.04);
  border-radius: 3px;
}
.xy-skill-line-name {
  font-family: var(--xy-font-display);
  flex: 1 1 auto;
}
.xy-skill-line-atk {
  color: var(--xy-cinnabar);
  font-size: 11px;
}

/* ============ 关系 ============ */
.xy-npc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.xy-npc {
  background: var(--xy-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--xy-line-gold);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}
.xy-npc:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px -6px rgba(42, 37, 32, 0.22);
}
.xy-npc-open {
  box-shadow: 0 8px 24px -6px rgba(42, 37, 32, 0.28);
  border-color: var(--xy-gold);
}
.xy-npc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
}
.xy-npc-avatar {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--xy-font-title);
  font-size: 22px;
  background: linear-gradient(135deg, var(--xy-paper-warm), var(--xy-paper-soft));
  border: 1px solid var(--xy-line-gold);
  border-radius: 50%;
  color: var(--xy-ink);
  position: relative;
}
.xy-npc-avatar.active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: var(--xy-jade);
  border: 2px solid var(--xy-paper-soft);
  border-radius: 50%;
}
.xy-npc-info {
  flex: 1 1 auto;
  min-width: 0;
}
.xy-npc-line1 {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.xy-npc-name {
  font-family: var(--xy-font-display);
  font-size: 16px;
  letter-spacing: 1px;
}
.xy-npc-realm {
  font-size: 12px;
  color: var(--xy-cinnabar);
}
.xy-npc-online {
  font-size: 10px;
  padding: 1px 6px;
  background: rgba(91, 138, 114, 0.15);
  color: var(--xy-jade-deep);
  border-radius: 8px;
}
.xy-npc-line2 {
  font-size: 11.5px;
  color: var(--xy-ink-mute);
  margin-top: 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.xy-npc-id {
  background: rgba(42, 37, 32, 0.05);
  padding: 0 5px;
  border-radius: 2px;
}
.xy-npc-couple {
  color: var(--xy-cinnabar);
  font-family: var(--xy-font-display);
  letter-spacing: 1px;
}

.xy-favor {
  flex: 0 0 56px;
  text-align: center;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--xy-line);
}
.xy-favor-num {
  font-family: var(--xy-font-display);
  font-size: 18px;
  line-height: 1;
}
.xy-favor-label {
  font-size: 10px;
  letter-spacing: 1px;
  margin-top: 2px;
}
.xy-favor-high {
  border-color: var(--xy-cinnabar);
  background: rgba(177, 58, 58, 0.08);
}
.xy-favor-high .xy-favor-num {
  color: var(--xy-cinnabar);
}
.xy-favor-mid {
  border-color: var(--xy-gold);
}
.xy-favor-mid .xy-favor-num {
  color: var(--xy-gold-deep);
}
.xy-favor-low {
  border-color: var(--xy-line);
}
.xy-favor-low .xy-favor-num {
  color: var(--xy-ink-mute);
}
.xy-favor-bad {
  border-color: var(--xy-ink-soft);
  background: rgba(42, 37, 32, 0.08);
}
.xy-favor-bad .xy-favor-num {
  color: var(--xy-ink);
}

.xy-npc-body {
  border-top: 1px dashed var(--xy-line);
  padding: 12px 14px;
  background: var(--xy-paper-soft);
  animation: xy-fade-up 0.3s ease;
}
.xy-npc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 8px;
}
.xy-mini h4 {
  font-family: var(--xy-font-display);
  font-size: 12px;
  letter-spacing: 3px;
  color: var(--xy-ink-mute);
  margin-bottom: 2px;
  font-weight: 400;
}
.xy-mini p {
  font-size: 12.5px;
  color: var(--xy-ink);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.xy-mini p small {
  color: var(--xy-ink-mute);
  margin-left: 6px;
}
.xy-mini-block {
  margin-top: 8px;
}
.xy-mini-block h4 {
  font-family: var(--xy-font-display);
  font-size: 12px;
  letter-spacing: 3px;
  color: var(--xy-ink-mute);
  margin-bottom: 2px;
  font-weight: 400;
}
.xy-mini-block p {
  font-size: 12.5px;
  color: var(--xy-ink);
  line-height: 1.7;
}

/* ============ 传闻 ============ */
.xy-rumor-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}
.xy-chip {
  font-size: 12px;
  font-family: var(--xy-font-display);
  letter-spacing: 1.5px;
  padding: 4px 12px;
  border: 1px solid var(--xy-line);
  border-radius: 14px;
  background: var(--xy-glass);
  color: var(--xy-ink-soft);
  transition: all 0.2s ease;
}
.xy-chip em {
  font-style: normal;
  margin-left: 4px;
  font-size: 10px;
  color: var(--xy-ink-mute);
}
.xy-chip:hover {
  border-color: var(--xy-line-gold);
  color: var(--xy-ink);
}
.xy-chip.active {
  background: linear-gradient(135deg, var(--xy-cinnabar), var(--xy-cinnabar-deep));
  color: var(--xy-paper);
  border-color: var(--xy-cinnabar-deep);
}
.xy-chip.active em {
  color: rgba(247, 241, 227, 0.8);
}

.xy-rumor-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.xy-rumor {
  position: relative;
  background: var(--xy-glass-strong);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--xy-line);
  border-radius: 6px;
  padding: 14px 16px 14px 80px;
  min-height: 96px;
  box-shadow: var(--xy-shadow);
  animation: xy-fade-up 0.4s ease;
}
.xy-rumor::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 12px;
  bottom: 12px;
  width: 1px;
  background: linear-gradient(180deg, transparent, var(--xy-line-gold), transparent);
}

.xy-rumor-seal {
  position: absolute;
  left: 14px;
  top: 14px;
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, var(--xy-cinnabar) 0%, var(--xy-cinnabar-deep) 100%);
  color: var(--xy-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--xy-font-display);
  font-size: 13px;
  letter-spacing: 1px;
  border-radius: 4px;
  text-align: center;
  line-height: 1.1;
  padding: 4px;
  transform: rotate(-4deg);
  box-shadow:
    0 0 0 2px rgba(177, 58, 58, 0.4),
    0 0 0 3px var(--xy-paper-soft),
    0 0 0 4px rgba(177, 58, 58, 0.55);
  writing-mode: vertical-rl;
  text-orientation: upright;
}
.xy-rumor-seal span {
  display: inline-block;
  padding: 2px;
}

.xy-rumor-mystic .xy-rumor-seal {
  background: linear-gradient(135deg, #5b8a72, #3d6b54);
  box-shadow:
    0 0 0 2px rgba(91, 138, 114, 0.4),
    0 0 0 3px var(--xy-paper-soft),
    0 0 0 4px rgba(91, 138, 114, 0.55);
}
.xy-rumor-jiang .xy-rumor-seal {
  background: linear-gradient(135deg, #8a6845, #5e4530);
  box-shadow:
    0 0 0 2px rgba(138, 104, 69, 0.4),
    0 0 0 3px var(--xy-paper-soft),
    0 0 0 4px rgba(138, 104, 69, 0.55);
}
.xy-rumor-sect .xy-rumor-seal {
  background: linear-gradient(135deg, var(--xy-gold), var(--xy-gold-deep));
  box-shadow:
    0 0 0 2px rgba(201, 169, 110, 0.4),
    0 0 0 3px var(--xy-paper-soft),
    0 0 0 4px rgba(201, 169, 110, 0.55);
}

.xy-rumor-head {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
}
.xy-rumor-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 1 1 auto;
}
.xy-rumor-time {
  font-family: var(--xy-font-display);
  font-size: 12px;
  color: var(--xy-gold-deep);
  letter-spacing: 1px;
}
.xy-rumor-source {
  font-size: 11px;
  color: var(--xy-ink-mute);
}
.xy-rumor-body {
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--xy-ink);
  text-indent: 2em;
  letter-spacing: 0.3px;
}

/* ============ 空态 ============ */
.xy-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--xy-ink-mute);
}
.xy-empty-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-family: var(--xy-font-title);
  font-size: 32px;
  color: rgba(177, 58, 58, 0.4);
  border: 1px dashed var(--xy-line);
  border-radius: 50%;
  margin-bottom: 8px;
}
.xy-empty p {
  font-size: 13px;
  letter-spacing: 1px;
}

/* ============ Tab transition ============ */
.xy-fade-enter-active,
.xy-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.xy-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.xy-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 响应式：小屏 */
@media (max-width: 480px) {
  .xy-name {
    font-size: 32px;
  }
  .xy-seal {
    flex: 0 0 48px;
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  .xy-card {
    padding: 12px;
  }
}
</style>
