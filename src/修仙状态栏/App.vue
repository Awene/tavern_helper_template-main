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
    <div class="xy-scroll" :class="{ 'xy-scroll-collapsed': state.appCollapsed }">
      <!-- ============ 总折叠条（始终可见） ============ -->
      <div class="xy-app-collapse-bar">
        <button
          type="button"
          class="xy-app-collapse-btn"
          :title="state.appCollapsed ? '展开状态栏' : '收起状态栏'"
          @click="state.appCollapsed = !state.appCollapsed"
        >
          <span class="xy-app-collapse-caret">{{ state.appCollapsed ? '▸' : '▾' }}</span>
          <span class="xy-app-collapse-label">{{ state.appCollapsed ? '展开' : '收起' }}</span>
        </button>
        <span v-if="state.appCollapsed" class="xy-app-collapse-tag">
          {{ store.data.基本信息.姓名 }} · {{ store.data.基本信息.修炼进度.境界 }}
        </span>
      </div>

      <div v-show="!state.appCollapsed" class="xy-app-body">
      <!-- ============ 头部 · 道号 / 境界 / 资源 ============ -->
      <header class="xy-hero">
        <div class="xy-hero-top">
          <div class="xy-name-block">
            <div
              class="xy-user-avatar"
              :class="{ 'has-img': getNpcAvatar(USER_AVATAR_KEY) }"
              @click="onAvatarClick(USER_AVATAR_KEY, $event)"
            >
              <img
                v-if="getNpcAvatar(USER_AVATAR_KEY)"
                :src="getNpcAvatar(USER_AVATAR_KEY)"
                :alt="store.data.基本信息.姓名"
                class="xy-user-avatar-img"
              />
              <span v-else class="xy-user-avatar-char">{{ avatarChar(store.data.基本信息.姓名) }}</span>
              <button
                type="button"
                class="xy-user-avatar-cam"
                :title="getNpcAvatar(USER_AVATAR_KEY) ? '更换头像（右键清除）' : '上传头像'"
                @click.stop="triggerAvatarUpload(USER_AVATAR_KEY)"
                @contextmenu.prevent.stop="getNpcAvatar(USER_AVATAR_KEY) && clearNpcAvatar(USER_AVATAR_KEY)"
              >
                <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                  <path d="M9.5 4l-1.7 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.8L14.5 4h-5zm2.5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                </svg>
              </button>
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
            <span class="xy-meta-item xy-time">
              <i>时</i>{{ store.data.基本信息.时间.年 }} 年 {{ store.data.基本信息.时间.月 }} 月 {{ store.data.基本信息.时间.日 }} 日 · {{ store.data.基本信息.时间.时辰 }}
            </span>
          </div>
          <div class="xy-meta-line">
            <span class="xy-meta-item xy-loc">
              <i>地</i>{{ store.data.基本信息.地点.世界 }} · {{ store.data.基本信息.地点.地域 }} · {{ store.data.基本信息.地点.具体地点 }}
            </span>
          </div>
        </div>

        <!-- 三脉资源 -->
        <div class="xy-resources">
          <div class="xy-bar xy-bar-cultivation">
            <div class="xy-bar-head">
              <span class="xy-bar-label">修为</span>
              <span class="xy-bar-num">{{ store.data.基本信息.修炼进度.当前进度 }} / {{ store.data.基本信息.修炼进度.进度上限 }}</span>
            </div>
            <div class="xy-bar-track">
              <div class="xy-bar-fill" :style="{ width: barPct(store.data.基本信息.修炼进度.当前进度, store.data.基本信息.修炼进度.进度上限) + '%' }" />
              <div class="xy-bar-shimmer" :style="{ width: barPct(store.data.基本信息.修炼进度.当前进度, store.data.基本信息.修炼进度.进度上限) + '%' }" />
            </div>
          </div>
          <div class="xy-bar xy-bar-blood">
            <div class="xy-bar-head">
              <span class="xy-bar-label">气血</span>
              <span class="xy-bar-num">{{ store.data.基本信息.资源池.气血.现值 }} / {{ store.data.基本信息.资源池.气血.上限 }}</span>
            </div>
            <div class="xy-bar-track">
              <div class="xy-bar-fill" :style="{ width: barPct(store.data.基本信息.资源池.气血.现值, store.data.基本信息.资源池.气血.上限) + '%' }" />
              <div class="xy-bar-shimmer" :style="{ width: barPct(store.data.基本信息.资源池.气血.现值, store.data.基本信息.资源池.气血.上限) + '%' }" />
            </div>
          </div>
          <div class="xy-bar xy-bar-spirit">
            <div class="xy-bar-head">
              <span class="xy-bar-label">灵力</span>
              <span class="xy-bar-num">{{ store.data.基本信息.资源池.灵力.现值 }} / {{ store.data.基本信息.资源池.灵力.上限 }}</span>
            </div>
            <div class="xy-bar-track">
              <div class="xy-bar-fill" :style="{ width: barPct(store.data.基本信息.资源池.灵力.现值, store.data.基本信息.资源池.灵力.上限) + '%' }" />
              <div class="xy-bar-shimmer" :style="{ width: barPct(store.data.基本信息.资源池.灵力.现值, store.data.基本信息.资源池.灵力.上限) + '%' }" />
            </div>
          </div>
          <div class="xy-resource-extra">
            <span class="xy-extra-item"><i>遁速</i>{{ store.data.基本信息.资源池.遁速 }} m/s</span>
          </div>
        </div>

        <!-- 状态效果横条 -->
        <div v-if="!_.isEmpty(store.data.基本信息.状态效果)" class="xy-buff-strip">
          <button
            v-for="(eff, name) in store.data.基本信息.状态效果"
            :key="name"
            type="button"
            class="xy-buff-chip"
            :class="['xy-buff-' + (eff.类型 || '特殊'), { active: state.openedBuff === name }]"
            @click="state.openedBuff = state.openedBuff === name ? null : (name as string)"
          >
            {{ name }}<small v-if="eff.层数 > 1">x{{ eff.层数 }}</small>
          </button>
        </div>
        <transition name="xy-fade">
          <div
            v-if="openedBuffData"
            class="xy-buff-detail"
            :class="['xy-buff-' + (openedBuffData.类型 || '特殊')]"
          >
            <div class="xy-buff-detail-head">
              <span class="xy-buff-detail-name">{{ state.openedBuff }}</span>
              <span class="xy-buff-tag">{{ openedBuffData.类型 }}</span>
              <span v-if="openedBuffData.层数 > 1" class="xy-buff-detail-stack">x{{ openedBuffData.层数 }}</span>
              <span class="xy-buff-time">{{ openedBuffData.剩余时间 }}</span>
              <button type="button" class="xy-buff-detail-close" @click="state.openedBuff = null">×</button>
            </div>
            <div v-if="!_.isEmpty(openedBuffData.效果)" class="xy-buff-effects">
              <span v-for="(d, n) in openedBuffData.效果" :key="n" class="xy-buff-effect">{{ n }}：{{ d }}</span>
            </div>
            <div v-if="openedBuffData.来源" class="xy-buff-source">来源：{{ openedBuffData.来源 }}</div>
          </div>
        </transition>
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
                  {{ el === '未知' ? '未' : el }}
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
            <template v-else>
              <div class="xy-rumor-filter">
                <button
                  type="button"
                  :class="['xy-chip', { active: state.artFilter === 'all' }]"
                  @click="state.artFilter = 'all'"
                >
                  全部 <em>{{ Object.keys(store.data.修炼功法.功法).length }}</em>
                </button>
                <template v-for="t in artTypes" :key="t">
                  <button
                    v-if="countField(store.data.修炼功法.功法, '类型', t)"
                    type="button"
                    :class="['xy-chip', { active: state.artFilter === t }]"
                    @click="state.artFilter = t"
                  >
                    {{ t }} <em>{{ countField(store.data.修炼功法.功法, '类型', t) }}</em>
                  </button>
                </template>
              </div>
              <div v-if="_.isEmpty(filteredArts)" class="xy-empty xy-empty-soft">
                <div class="xy-empty-mark">·</div>
                <p>该分类下暂无功法</p>
              </div>
              <div v-else class="xy-art-grid">
                <article
                  v-for="(art, name) in filteredArts"
                  :key="name"
                  class="xy-art"
                  :class="{ 'xy-art-active': art.使用中 }"
                >
                <button
                  type="button"
                  class="xy-trash"
                  title="删除此功法"
                  @click.stop="requestDelete('art', name as string, name as string)"
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                    <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                  </svg>
                </button>
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
            </template>
          </section>

          <!-- ▼ 储物 ▼ -->
          <section v-else-if="state.currentTab === 2" class="xy-page xy-page-storage">
            <div class="xy-stone">
              <div class="xy-stone-label">灵石</div>
              <div class="xy-stone-value">{{ store.data.储物空间.灵石.toLocaleString() }}</div>
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
            <div v-if="state.storageTab === 0">
              <div v-if="_.isEmpty(store.data.储物空间.物品)" class="xy-empty">
                <div class="xy-empty-mark">无</div>
                <p>储物空间空空如也</p>
              </div>
              <template v-else>
                <div class="xy-rumor-filter">
                  <button
                    type="button"
                    :class="['xy-chip', { active: state.itemFilter === 'all' }]"
                    @click="state.itemFilter = 'all'"
                  >
                    全部 <em>{{ Object.keys(store.data.储物空间.物品).length }}</em>
                  </button>
                  <template v-for="t in itemTypes" :key="t">
                    <button
                      v-if="countField(store.data.储物空间.物品, '类型', t)"
                      type="button"
                      :class="['xy-chip', { active: state.itemFilter === t }]"
                      @click="state.itemFilter = t"
                    >
                      {{ t }} <em>{{ countField(store.data.储物空间.物品, '类型', t) }}</em>
                    </button>
                  </template>
                </div>
                <div v-if="_.isEmpty(filteredItems)" class="xy-empty xy-empty-soft">
                  <div class="xy-empty-mark">·</div>
                  <p>该分类下暂无物品</p>
                </div>
                <div v-else class="xy-item-grid">
                  <article
                    v-for="(it, name) in filteredItems"
                    :key="name"
                    class="xy-item"
                    :class="['xy-q-bg-' + it.品质]"
                  >
                    <button
                      type="button"
                      class="xy-trash"
                      title="删除此物品"
                      @click.stop="requestDelete('item', name as string, name as string)"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                        <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                      </svg>
                    </button>
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
                </div>
              </template>
            </div>

            <!-- 装备 -->
            <div v-else-if="state.storageTab === 1">
              <div v-if="_.isEmpty(store.data.储物空间.装备)" class="xy-empty">
                <div class="xy-empty-mark">无</div>
                <p>未持任何装备</p>
              </div>
              <template v-else>
                <div class="xy-rumor-filter">
                  <button
                    type="button"
                    :class="['xy-chip', { active: state.equipFilter === 'all' }]"
                    @click="state.equipFilter = 'all'"
                  >
                    全部 <em>{{ Object.keys(store.data.储物空间.装备).length }}</em>
                  </button>
                  <template v-for="t in equipTypes" :key="t">
                    <button
                      v-if="countField(store.data.储物空间.装备, '类型', t)"
                      type="button"
                      :class="['xy-chip', { active: state.equipFilter === t }]"
                      @click="state.equipFilter = t"
                    >
                      {{ t }} <em>{{ countField(store.data.储物空间.装备, '类型', t) }}</em>
                    </button>
                  </template>
                </div>
                <div v-if="_.isEmpty(filteredEquips)" class="xy-empty xy-empty-soft">
                  <div class="xy-empty-mark">·</div>
                  <p>该分类下暂无装备</p>
                </div>
                <div v-else class="xy-item-grid">
                  <article
                    v-for="(eq, name) in filteredEquips"
                    :key="name"
                    class="xy-item xy-equipment"
                    :class="['xy-q-bg-' + eq.品质]"
                  >
                    <button
                      type="button"
                      class="xy-trash"
                      title="删除此装备"
                      @click.stop="requestDelete('equip', name as string, name as string)"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                        <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                      </svg>
                    </button>
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
                </div>
              </template>
            </div>

            <!-- 傀儡 -->
            <div v-else-if="state.storageTab === 2">
              <div v-if="_.isEmpty(store.data.储物空间.傀儡)" class="xy-empty">
                <div class="xy-empty-mark">无</div>
                <p>暂无傀儡</p>
              </div>
              <template v-else>
                <div class="xy-rumor-filter">
                  <button
                    type="button"
                    :class="['xy-chip', { active: state.puppetFilter === 'all' }]"
                    @click="state.puppetFilter = 'all'"
                  >
                    全部 <em>{{ Object.keys(store.data.储物空间.傀儡).length }}</em>
                  </button>
                  <template v-for="q in qualityRanks" :key="q">
                    <button
                      v-if="countField(store.data.储物空间.傀儡, '品质', q)"
                      type="button"
                      :class="['xy-chip', { active: state.puppetFilter === q }]"
                      @click="state.puppetFilter = q"
                    >
                      {{ q }}品 <em>{{ countField(store.data.储物空间.傀儡, '品质', q) }}</em>
                    </button>
                  </template>
                </div>
                <div v-if="_.isEmpty(filteredPuppets)" class="xy-empty xy-empty-soft">
                  <div class="xy-empty-mark">·</div>
                  <p>该品阶下暂无傀儡</p>
                </div>
                <div v-else class="xy-item-grid">
                  <CombatUnitCard
                    v-for="(u, name) in filteredPuppets"
                    :key="name"
                    :unit="u"
                    :name="String(name)"
                    deletable
                    @toggle="toggleUnit('傀儡', String(name), $event)"
                    @delete="requestDelete('puppet', String(name), String(name))"
                  />
                </div>
              </template>
            </div>

            <!-- 灵兽 -->
            <div v-else>
              <div v-if="_.isEmpty(store.data.储物空间.灵兽)" class="xy-empty">
                <div class="xy-empty-mark">无</div>
                <p>暂无灵兽</p>
              </div>
              <template v-else>
                <div class="xy-rumor-filter">
                  <button
                    type="button"
                    :class="['xy-chip', { active: state.beastFilter === 'all' }]"
                    @click="state.beastFilter = 'all'"
                  >
                    全部 <em>{{ Object.keys(store.data.储物空间.灵兽).length }}</em>
                  </button>
                  <template v-for="q in qualityRanks" :key="q">
                    <button
                      v-if="countField(store.data.储物空间.灵兽, '品质', q)"
                      type="button"
                      :class="['xy-chip', { active: state.beastFilter === q }]"
                      @click="state.beastFilter = q"
                    >
                      {{ q }}品 <em>{{ countField(store.data.储物空间.灵兽, '品质', q) }}</em>
                    </button>
                  </template>
                </div>
                <div v-if="_.isEmpty(filteredBeasts)" class="xy-empty xy-empty-soft">
                  <div class="xy-empty-mark">·</div>
                  <p>该品阶下暂无灵兽</p>
                </div>
                <div v-else class="xy-item-grid">
                  <CombatUnitCard
                    v-for="(u, name) in filteredBeasts"
                    :key="name"
                    :unit="u"
                    :name="String(name)"
                    deletable
                    @toggle="toggleUnit('灵兽', String(name), $event)"
                    @delete="requestDelete('beast', String(name), String(name))"
                  />
                </div>
              </template>
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
                v-for="{ name, npc } in sortedRelations"
                :key="name"
                class="xy-npc"
                :class="{ 'xy-npc-open': state.openedNPC === name }"
                @click="state.openedNPC = state.openedNPC === name ? null : name"
              >
                <div class="xy-npc-head">
                  <div
                    class="xy-npc-avatar"
                    :class="{ active: npc.在场, 'has-img': getNpcAvatar(name as string) }"
                    @click="onAvatarClick(name as string, $event)"
                  >
                    <img
                      v-if="getNpcAvatar(name as string)"
                      :src="getNpcAvatar(name as string)"
                      :alt="String(name)"
                      class="xy-npc-avatar-img"
                    />
                    <span v-else class="xy-npc-avatar-char">{{ avatarChar(name as string) }}</span>
                    <button
                      type="button"
                      class="xy-npc-avatar-cam"
                      :title="getNpcAvatar(name as string) ? '更换头像（右键清除）' : '上传头像'"
                      @click.stop="triggerAvatarUpload(name as string)"
                      @contextmenu.prevent.stop="getNpcAvatar(name as string) && clearNpcAvatar(name as string)"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                        <path d="M9.5 4l-1.7 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.8L14.5 4h-5zm2.5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                      </svg>
                    </button>
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
                      <span v-if="npc.元阳" class="xy-npc-yang">元阳</span>
                      <span v-if="npc.元阴" class="xy-npc-yin">元阴</span>
                      <span v-if="npc.道侣" class="xy-npc-couple">道侣</span>
                    </div>
                  </div>
                  <div class="xy-favor" :class="favorClass(npc.好感度)">
                    <div class="xy-favor-num">{{ npc.好感度 }}</div>
                    <div class="xy-favor-label">{{ favorLabel(npc.好感度) }}</div>
                  </div>
                  <button
                    type="button"
                    class="xy-trash xy-trash-npc"
                    title="删除此 NPC"
                    @click.stop="requestDelete('npc', name, name)"
                  >
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                      <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                    </svg>
                  </button>
                </div>

                <div v-if="state.openedNPC === name" class="xy-npc-body" @click.stop>
                  <!-- 基础信息四宫 -->
                  <div class="xy-npc-grid">
                    <div class="xy-mini">
                      <h4>寿元</h4>
                      <p>{{ npc.寿元?.年龄 }} / {{ npc.寿元?.寿命 }}<small>貌 {{ npc.寿元?.外观年龄 }}</small></p>
                    </div>
                    <div class="xy-mini">
                      <h4>灵根</h4>
                      <p>
                        <span>{{ npc.灵根?.名称 || '未检测' }}</span>
                        <span v-for="el in npc.灵根?.五行 || []" :key="el" class="xy-element xy-element-mini" :style="{ '--el': elColor(el) }">{{ el === '未知' ? '未' : el }}</span>
                      </p>
                    </div>
                    <div class="xy-mini">
                      <h4>体质</h4>
                      <p>{{ npc.体质?.名称 }} <small>悟{{ npc.体质?.悟性 }}/骨{{ npc.体质?.根骨 }}/感{{ npc.体质?.气感 }}</small></p>
                    </div>
                    <div class="xy-mini">
                      <h4>境界</h4>
                      <p>
                        {{ npc.修炼进度?.境界 || '凡人' }}
                        <small v-if="npc.修炼进度">{{ npc.修炼进度.当前进度 }}/{{ npc.修炼进度.进度上限 }}</small>
                      </p>
                    </div>
                  </div>

                  <!-- 体质效果 -->
                  <div v-if="!_.isEmpty(npc.体质?.效果)" class="xy-effect-list xy-npc-effects">
                    <span v-for="(d, n) in npc.体质?.效果" :key="n" class="xy-effect-line">{{ n }}：{{ d }}</span>
                  </div>

                  <!-- 资源池 -->
                  <div class="xy-mini-block">
                    <h4>资源池</h4>
                    <div class="xy-npc-bars">
                      <div class="xy-unit-bar">
                        <span class="xy-unit-bar-label">气血</span>
                        <span class="xy-unit-bar-track">
                          <span class="xy-unit-bar-fill blood" :style="{ width: npcBarPct(npc.资源池?.气血) + '%' }" />
                        </span>
                        <span class="xy-unit-bar-num">{{ npc.资源池?.气血?.现值 ?? 0 }}/{{ npc.资源池?.气血?.上限 ?? 0 }}</span>
                      </div>
                      <div class="xy-unit-bar">
                        <span class="xy-unit-bar-label">灵力</span>
                        <span class="xy-unit-bar-track">
                          <span class="xy-unit-bar-fill spirit" :style="{ width: npcBarPct(npc.资源池?.灵力) + '%' }" />
                        </span>
                        <span class="xy-unit-bar-num">{{ npc.资源池?.灵力?.现值 ?? 0 }}/{{ npc.资源池?.灵力?.上限 ?? 0 }}</span>
                      </div>
                      <div class="xy-unit-bar">
                        <span class="xy-unit-bar-label">遁速</span>
                        <span class="xy-unit-bar-num xy-bar-solo">{{ npc.资源池?.遁速 ?? 0 }} m/s</span>
                      </div>
                    </div>
                  </div>

                  <!-- 技艺 -->
                  <div v-if="hasSkills(npc)" class="xy-mini-block">
                    <h4>技艺</h4>
                    <div class="xy-npc-skills">
                      <div v-if="!_.isEmpty(npc.技艺?.生产类)" class="xy-npc-skills-row">
                        <span class="xy-npc-skills-tag xy-pill-soft">生产</span>
                        <span v-for="(v, n) in npc.技艺?.生产类" :key="'p-'+n" class="xy-npc-skill" :class="{ dim: !v }">
                          {{ n }}<em>{{ v }}</em>
                        </span>
                      </div>
                      <div v-if="!_.isEmpty(npc.技艺?.战斗类)" class="xy-npc-skills-row">
                        <span class="xy-npc-skills-tag xy-pill-cost">战斗</span>
                        <span v-for="(v, n) in npc.技艺?.战斗类" :key="'c-'+n" class="xy-npc-skill" :class="{ dim: !v }">
                          {{ n }}<em>{{ v }}</em>
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 状态效果（可折叠） -->
                  <div v-if="!_.isEmpty(npc.状态效果)" class="xy-mini-block">
                    <button
                      type="button"
                      class="xy-collapse-head"
                      :class="{ open: isSectionOpen(name, '状态效果') }"
                      @click.stop="toggleSection(name, '状态效果')"
                    >
                      <span class="xy-collapse-title">状态效果</span>
                      <span class="xy-collapse-count">{{ Object.keys(npc.状态效果).length }}</span>
                      <span class="xy-collapse-caret">▾</span>
                    </button>
                    <div v-show="isSectionOpen(name, '状态效果')" class="xy-buff-list xy-collapse-body">
                      <div
                        v-for="(eff, ename) in npc.状态效果"
                        :key="ename"
                        class="xy-buff-item"
                        :class="['xy-buff-' + (eff.类型 || '特殊')]"
                      >
                        <div class="xy-buff-head">
                          <span class="xy-buff-name">{{ ename }}</span>
                          <span class="xy-buff-tag">{{ eff.类型 }}</span>
                          <span v-if="eff.层数 > 1" class="xy-buff-stack">x{{ eff.层数 }}</span>
                          <span class="xy-buff-time">{{ eff.剩余时间 }}</span>
                        </div>
                        <div v-if="!_.isEmpty(eff.效果)" class="xy-buff-effects">
                          <span v-for="(d, n) in eff.效果" :key="n" class="xy-buff-effect">{{ n }}：{{ d }}</span>
                        </div>
                        <div v-if="eff.来源" class="xy-buff-source">来源：{{ eff.来源 }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- 功法（可折叠 + 可控/自动选定标识） -->
                  <div v-if="!_.isEmpty(npc.功法)" class="xy-mini-block">
                    <button
                      type="button"
                      class="xy-collapse-head"
                      :class="{ open: isSectionOpen(name, '功法') }"
                      @click.stop="toggleSection(name, '功法')"
                    >
                      <span class="xy-collapse-title">功法</span>
                      <span class="xy-collapse-count">{{ Object.keys(npc.功法).length }}</span>
                      <span v-if="!canControlNpc(npc)" class="xy-collapse-lock" title="需道侣或好感度>80才可调整">🔒</span>
                      <span class="xy-collapse-caret">▾</span>
                    </button>
                    <div v-show="isSectionOpen(name, '功法')" class="xy-npc-arts xy-collapse-body">
                      <article
                        v-for="(art, aname) in npc.功法"
                        :key="aname"
                        class="xy-art xy-art-mini"
                        :class="{ 'xy-art-active': isArtEffectivelyActive(npc, aname as string, art) }"
                      >
                        <div class="xy-art-head">
                          <div class="xy-art-title">
                            <span class="xy-art-name">{{ aname }}</span>
                            <span :class="['xy-quality', 'xy-q-' + art.品质]">{{ art.品质 }}品</span>
                          </div>
                          <button
                            type="button"
                            class="xy-toggle xy-toggle-mini"
                            :class="{ on: isArtEffectivelyActive(npc, aname as string, art) }"
                            @click.stop="toggleNpcArt(name, aname as string, !isArtEffectivelyActive(npc, aname as string, art))"
                          >
                            {{ isArtEffectivelyActive(npc, aname as string, art) ? '运转' : '凝息' }}
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
                      </article>
                    </div>
                  </div>

                  <!-- 储物空间（灵石常驻 + 各分类独立折叠） -->
                  <div v-if="hasStorage(npc)" class="xy-mini-block">
                    <h4 class="xy-mini-block-title">储物空间</h4>
                    <div class="xy-npc-storage">
                      <div class="xy-npc-stone">
                        <span class="xy-npc-stone-label">灵石</span>
                        <span class="xy-npc-stone-value">{{ (npc.储物空间?.灵石 || 0).toLocaleString() }}</span>
                      </div>

                      <div v-if="!_.isEmpty(npc.储物空间?.物品)" class="xy-npc-sub">
                        <button
                          type="button"
                          class="xy-collapse-head xy-collapse-sub"
                          :class="{ open: isSectionOpen(name, '物品') }"
                          @click.stop="toggleSection(name, '物品')"
                        >
                          <span class="xy-collapse-title">物品</span>
                          <span class="xy-collapse-count">{{ Object.keys(npc.储物空间.物品).length }}</span>
                          <span class="xy-collapse-caret">▾</span>
                        </button>
                        <div v-show="isSectionOpen(name, '物品')" class="xy-item-grid xy-item-grid-mini xy-collapse-body">
                          <article
                            v-for="(it, iname) in npc.储物空间.物品"
                            :key="iname"
                            class="xy-item"
                            :class="['xy-q-bg-' + it.品质]"
                          >
                            <div class="xy-item-head">
                              <span class="xy-item-name">{{ iname }}</span>
                              <span class="xy-item-qty">×{{ it.数量 }}</span>
                            </div>
                            <div class="xy-item-meta">
                              <span :class="['xy-quality', 'xy-q-' + it.品质]">{{ it.品质 }}</span>
                              <span class="xy-pill">{{ it.类型 }}</span>
                              <span v-if="it.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(it.五行) }">{{ it.五行 }}</span>
                            </div>
                            <div v-if="it.描述" class="xy-item-desc">{{ it.描述 }}</div>
                          </article>
                        </div>
                      </div>

                      <div v-if="!_.isEmpty(npc.储物空间?.装备)" class="xy-npc-sub">
                        <button
                          type="button"
                          class="xy-collapse-head xy-collapse-sub"
                          :class="{ open: isSectionOpen(name, '装备') }"
                          @click.stop="toggleSection(name, '装备')"
                        >
                          <span class="xy-collapse-title">装备</span>
                          <span class="xy-collapse-count">{{ Object.keys(npc.储物空间.装备).length }}</span>
                          <span class="xy-collapse-caret">▾</span>
                        </button>
                        <div v-show="isSectionOpen(name, '装备')" class="xy-item-grid xy-item-grid-mini xy-collapse-body">
                          <article
                            v-for="(eq, ename2) in npc.储物空间.装备"
                            :key="ename2"
                            class="xy-item xy-equipment"
                            :class="['xy-q-bg-' + eq.品质]"
                          >
                            <div class="xy-item-head">
                              <span class="xy-item-name">{{ ename2 }}</span>
                              <span class="xy-item-pos">{{ eq.位置 }}</span>
                            </div>
                            <div class="xy-item-meta">
                              <span :class="['xy-quality', 'xy-q-' + eq.品质]">{{ eq.品质 }}</span>
                              <span class="xy-pill">{{ eq.类型 }}</span>
                              <span v-if="eq.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(eq.五行) }">{{ eq.五行 }}</span>
                            </div>
                            <div class="xy-eq-stats">
                              <span v-if="eq.攻击力 != null" class="xy-eq-stat xy-stat-atk">攻 {{ eq.攻击力 }}</span>
                              <span v-if="eq.防御力 != null" class="xy-eq-stat xy-stat-def">防 {{ eq.防御力 }}</span>
                            </div>
                            <div v-if="eq.描述" class="xy-item-desc">{{ eq.描述 }}</div>
                          </article>
                        </div>
                      </div>

                      <div v-if="!_.isEmpty(npc.储物空间?.傀儡)" class="xy-npc-sub">
                        <button
                          type="button"
                          class="xy-collapse-head xy-collapse-sub"
                          :class="{ open: isSectionOpen(name, '傀儡') }"
                          @click.stop="toggleSection(name, '傀儡')"
                        >
                          <span class="xy-collapse-title">傀儡</span>
                          <span class="xy-collapse-count">{{ Object.keys(npc.储物空间.傀儡).length }}</span>
                          <span class="xy-collapse-caret">▾</span>
                        </button>
                        <div v-show="isSectionOpen(name, '傀儡')" class="xy-item-grid xy-item-grid-mini xy-collapse-body">
                          <CombatUnitCard
                            v-for="(u, uname) in npc.储物空间.傀儡"
                            :key="uname"
                            :unit="u"
                            :name="String(uname)"
                            compact
                          />
                        </div>
                      </div>

                      <div v-if="!_.isEmpty(npc.储物空间?.灵兽)" class="xy-npc-sub">
                        <button
                          type="button"
                          class="xy-collapse-head xy-collapse-sub"
                          :class="{ open: isSectionOpen(name, '灵兽') }"
                          @click.stop="toggleSection(name, '灵兽')"
                        >
                          <span class="xy-collapse-title">灵兽</span>
                          <span class="xy-collapse-count">{{ Object.keys(npc.储物空间.灵兽).length }}</span>
                          <span class="xy-collapse-caret">▾</span>
                        </button>
                        <div v-show="isSectionOpen(name, '灵兽')" class="xy-item-grid xy-item-grid-mini xy-collapse-body">
                          <CombatUnitCard
                            v-for="(u, uname) in npc.储物空间.灵兽"
                            :key="uname"
                            :unit="u"
                            :name="String(uname)"
                            compact
                          />
                        </div>
                      </div>
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

    <!-- 全局头像上传 input（始终挂载，避免在道身页面无法触发） -->
    <input
      ref="avatarFileInput"
      type="file"
      accept="image/*"
      class="xy-avatar-file"
      @change="onAvatarFileChange"
    />

    <!-- ============ 头像放大查看 ============ -->
    <transition name="xy-fade">
      <div
        v-if="state.lightboxImage"
        class="xy-lightbox"
        @click="closeLightbox"
        @contextmenu.prevent
      >
        <img :src="state.lightboxImage" class="xy-lightbox-img" alt="头像大图" @click.stop />
        <button
          type="button"
          class="xy-lightbox-close"
          aria-label="关闭"
          @click.stop="closeLightbox"
        >
          ×
        </button>
      </div>
    </transition>

    <!-- ============ 删除确认 ============ -->
    <transition name="xy-fade">
      <div
        v-if="state.confirmDelete"
        class="xy-confirm-overlay"
        @click="cancelDelete"
        @contextmenu.prevent
      >
        <div class="xy-confirm-box" @click.stop>
          <div class="xy-confirm-title">确认删除</div>
          <div class="xy-confirm-msg">
            是否删除「<strong>{{ state.confirmDelete.label }}</strong>」？此操作无法撤销。
          </div>
          <div class="xy-confirm-actions">
            <button type="button" class="xy-btn xy-btn-cancel" @click.stop="cancelDelete">取消</button>
            <button type="button" class="xy-btn xy-btn-danger" @click.stop="performDelete">确认删除</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============ Toast 提示 ============ -->
    <transition name="xy-toast">
      <div v-if="state.toast" class="xy-toast" @click="state.toast = ''">
        {{ state.toast }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, reactive, ref } from 'vue';
import CombatUnitCard from './CombatUnitCard.vue';
import { useDataStore } from './store';

const store = useDataStore();

const state = reactive({
  currentTab: 0,
  storageTab: 0,
  openedNPC: null as string | null,
  openedBuff: null as string | null,
  rumorFilter: 'all' as string,
  artFilter: 'all' as string,
  itemFilter: 'all' as string,
  equipFilter: 'all' as string,
  puppetFilter: 'all' as string,
  beastFilter: 'all' as string,
  lightboxImage: null as string | null,
  toast: '' as string,
  appCollapsed: false,
  confirmDelete: null as null | { kind: string; key: string; label: string },
});

// =============== 删除确认 ===============
const requestDelete = (kind: string, key: string, label?: string) => {
  state.confirmDelete = { kind, key, label: label || key };
};
const cancelDelete = () => {
  state.confirmDelete = null;
};
const performDelete = () => {
  const c = state.confirmDelete;
  if (!c || !store.data) return;
  const data = store.data as any;
  switch (c.kind) {
    case 'art':
      if (data.修炼功法?.功法) delete data.修炼功法.功法[c.key];
      break;
    case 'item':
      if (data.储物空间?.物品) delete data.储物空间.物品[c.key];
      break;
    case 'equip':
      if (data.储物空间?.装备) delete data.储物空间.装备[c.key];
      break;
    case 'puppet':
      if (data.储物空间?.傀儡) delete data.储物空间.傀儡[c.key];
      break;
    case 'beast':
      if (data.储物空间?.灵兽) delete data.储物空间.灵兽[c.key];
      break;
    case 'npc':
      if (data.关系列表) delete data.关系列表[c.key];
      // 顺手清理这个 NPC 的本地头像缓存
      clearNpcAvatar(c.key);
      if (state.openedNPC === c.key) state.openedNPC = null;
      break;
  }
  state.confirmDelete = null;
};

// =============== NPC 详情区折叠 ===============
const npcSectionOpen = reactive<Record<string, Record<string, boolean>>>({});
const isSectionOpen = (name: string, section: string): boolean =>
  !!npcSectionOpen[name]?.[section];
const toggleSection = (name: string, section: string) => {
  if (!npcSectionOpen[name]) npcSectionOpen[name] = {};
  npcSectionOpen[name][section] = !npcSectionOpen[name][section];
};

// =============== Toast 提示 ===============
let toastTimer: ReturnType<typeof setTimeout> | null = null;
const showToast = (msg: string) => {
  state.toast = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (state.toast === msg) state.toast = '';
  }, 2800);
};

// =============== 境界排序（依《核心系数总表》） ===============
// 主境界等级：炼气=1 → 渡劫=9；凡人=0 作保底；同义异写映射到同一等级
const MAJOR_RANKS: Record<string, number> = {
  凡人: 0,
  炼气: 1,
  练气: 1,
  筑基: 2,
  金丹: 3,
  元婴: 4,
  化神: 5,
  返虚: 6,
  炼虚: 6,
  合体: 7,
  大乘: 8,
  渡劫: 9,
  飞升: 9,
};
// 小境界：初期/中期/后期
const SUB_RANKS: Record<string, number> = {
  初期: 0,
  中期: 1,
  后期: 2,
};
const realmScore = (realm: string): number => {
  if (!realm) return 0;
  let major = -1;
  let prefixLen = 0;
  for (const k of Object.keys(MAJOR_RANKS)) {
    if (realm.startsWith(k) && k.length > prefixLen) {
      major = MAJOR_RANKS[k];
      prefixLen = k.length;
    }
  }
  if (major < 0) major = 0; // 保底：未知主境界视为凡人
  const subPart = realm.slice(prefixLen);
  let sub = 0;
  for (const k of Object.keys(SUB_RANKS)) {
    if (subPart.includes(k)) {
      sub = SUB_RANKS[k];
      break;
    }
  }
  return major * 10 + sub;
};

// =============== NPC 功法控制 ===============
const EXCLUSIVE_ART_TYPES = ['心法', '护体', '身法'] as const;

const canControlNpc = (npc: any): boolean =>
  !!npc?.道侣 || (npc?.好感度 ?? 0) > 80;

// 对不可控 NPC，按 境界 > 品质 自动挑选 心法/护体/身法 各一
const isArtEffectivelyActive = (npc: any, artName: string, art: any): boolean => {
  if (canControlNpc(npc)) return !!art?.使用中;
  if (!EXCLUSIVE_ART_TYPES.includes(art?.类型)) return !!art?.使用中;
  const arts = npc?.功法 || {};
  let bestName = '';
  let bestRealm = -2;
  let bestQuality = -2;
  for (const [n, a] of Object.entries(arts) as [string, any][]) {
    if (a?.类型 !== art.类型) continue;
    const rs = realmScore(a.境界 || '');
    const qs = qualityRanks.indexOf(a.品质);
    if (rs > bestRealm || (rs === bestRealm && qs > bestQuality)) {
      bestRealm = rs;
      bestQuality = qs;
      bestName = n;
    }
  }
  return bestName === artName;
};

const toggleNpcArt = (npcName: string, artName: string, value: boolean) => {
  const list = store.data?.关系列表 as Record<string, any> | undefined;
  const npc = list?.[npcName];
  if (!npc) return;
  if (!canControlNpc(npc)) {
    showToast(`需与「${npcName}」结为道侣或好感度大于 80，方可调整其功法`);
    return;
  }
  const arts = npc.功法 as Record<string, any> | undefined;
  const art = arts?.[artName];
  if (!arts || !art) return;
  if (value && (EXCLUSIVE_ART_TYPES as readonly string[]).includes(art.类型)) {
    for (const [k, v] of Object.entries(arts)) {
      if (k !== artName && v.使用中 && v.类型 === art.类型) v.使用中 = false;
    }
  }
  art.使用中 = value;
};

const artTypes = ['心法', '攻击', '咒法', '身法', '护体', '幻术', '神识', '其他'] as const;
const itemTypes = ['秘籍', '配方', '符箓', '丹药', '素材', '工具', '其他'] as const;
const equipTypes = ['法宝', '护甲', '饰品'] as const;
const qualityRanks = ['凡', '黄', '玄', '地', '天'] as const;

const countField = (rec: Record<string, any> | undefined, field: string, value: string): number => {
  if (!rec) return 0;
  let n = 0;
  for (const v of Object.values(rec)) if (v?.[field] === value) n++;
  return n;
};

const filterRecord = <T extends Record<string, any>>(
  rec: T | undefined,
  field: string,
  value: string,
): Record<string, any> => {
  if (!rec) return {};
  if (value === 'all') return rec;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(rec)) {
    if ((v as any)?.[field] === value) out[k] = v;
  }
  return out;
};

const filteredArts = computed(() =>
  filterRecord(store.data?.修炼功法?.功法, '类型', state.artFilter),
);
const filteredItems = computed(() =>
  filterRecord(store.data?.储物空间?.物品, '类型', state.itemFilter),
);
const filteredEquips = computed(() =>
  filterRecord(store.data?.储物空间?.装备, '类型', state.equipFilter),
);
const filteredPuppets = computed(() =>
  filterRecord(store.data?.储物空间?.傀儡, '品质', state.puppetFilter),
);
const filteredBeasts = computed(() =>
  filterRecord(store.data?.储物空间?.灵兽, '品质', state.beastFilter),
);

const USER_AVATAR_KEY = '__user__';

const openLightbox = (url: string) => {
  if (url) state.lightboxImage = url;
};
const closeLightbox = () => {
  state.lightboxImage = null;
};
const onAvatarClick = (key: string, ev: MouseEvent) => {
  const thumb = getNpcAvatar(key);
  if (thumb) {
    ev.stopPropagation();
    openLightbox(getNpcAvatarHi(key) || thumb);
  }
};

const sortedRelations = computed(() => {
  const list = store.data?.关系列表;
  if (!list) return [] as { name: string; npc: any; idx: number }[];
  return Object.entries(list)
    .map(([name, npc], idx) => ({ name, npc: npc as any, idx }))
    .sort((a, b) => {
      const pa = a.npc?.在场 ? 0 : a.npc?.道侣 ? 1 : 2;
      const pb = b.npc?.在场 ? 0 : b.npc?.道侣 ? 1 : 2;
      if (pa !== pb) return pa - pb;
      return a.idx - b.idx;
    });
});

const openedBuffData = computed(() => {
  if (!state.openedBuff) return null;
  const buffs = store.data?.基本信息?.状态效果 as Record<string, any> | undefined;
  return buffs?.[state.openedBuff] || null;
});

const barPct = (cur: number, total: number) =>
  Math.max(0, Math.min(100, (cur / Math.max(total, 1)) * 100));

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

const npcBarPct = (pool?: { 现值?: number; 上限?: number }) => {
  if (!pool) return 0;
  const cur = pool.现值 ?? 0;
  const max = Math.max(pool.上限 ?? 1, 1);
  return Math.max(0, Math.min(100, (cur / max) * 100));
};

const hasSkills = (npc: any) =>
  !_.isEmpty(npc?.技艺?.生产类) || !_.isEmpty(npc?.技艺?.战斗类);

const hasStorage = (npc: any) => {
  const s = npc?.储物空间;
  if (!s) return false;
  return (
    (s.灵石 ?? 0) > 0 ||
    !_.isEmpty(s.物品) ||
    !_.isEmpty(s.装备) ||
    !_.isEmpty(s.傀儡) ||
    !_.isEmpty(s.灵兽)
  );
};

// =============== NPC 头像（玩家本地上传） ===============
const NPC_AVATAR_KEY = (name: string) => `xy-npc-avatar::${name}`;
const NPC_AVATAR_HI_KEY = (name: string) => `xy-npc-avatar-hi::${name}`;
const npcAvatars = reactive<Record<string, string>>({});

const getNpcAvatar = (name: string): string => {
  if (name in npcAvatars) return npcAvatars[name];
  let v = '';
  try {
    v = localStorage.getItem(NPC_AVATAR_KEY(name)) || '';
  } catch {
    /* localStorage 不可用 */
  }
  npcAvatars[name] = v;
  return v;
};

const getNpcAvatarHi = (name: string): string => {
  try {
    const hi = localStorage.getItem(NPC_AVATAR_HI_KEY(name));
    if (hi) return hi;
  } catch {
    /* ignore */
  }
  return getNpcAvatar(name);
};

const avatarFileInput = ref<HTMLInputElement | null>(null);
const pendingAvatarFor = ref<string | null>(null);

const triggerAvatarUpload = (name: string) => {
  pendingAvatarFor.value = name;
  avatarFileInput.value?.click();
};

const resizeImageToDataUrl = (file: File, maxSize: number, quality = 0.85): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas context unavailable'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('file read failed'));
    reader.readAsDataURL(file);
  });

const onAvatarFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  const name = pendingAvatarFor.value;
  input.value = '';
  pendingAvatarFor.value = null;
  if (!file || !name) return;
  try {
    const [thumb, hi] = await Promise.all([
      resizeImageToDataUrl(file, 192, 0.85),
      resizeImageToDataUrl(file, 2048, 0.92),
    ]);
    localStorage.setItem(NPC_AVATAR_KEY(name), thumb);
    try {
      localStorage.setItem(NPC_AVATAR_HI_KEY(name), hi);
    } catch (quotaErr) {
      // 高清图过大，删除遗留并仅保留缩略图
      try { localStorage.removeItem(NPC_AVATAR_HI_KEY(name)); } catch { /* */ }
      console.warn('[修仙状态栏] 高清头像存储失败（容量不足），仅保留缩略图', quotaErr);
    }
    npcAvatars[name] = thumb;
  } catch (err) {
    console.error('[修仙状态栏] 头像上传失败', err);
  }
};

const clearNpcAvatar = (name: string) => {
  try {
    localStorage.removeItem(NPC_AVATAR_KEY(name));
    localStorage.removeItem(NPC_AVATAR_HI_KEY(name));
  } catch {
    /* ignore */
  }
  npcAvatars[name] = '';
};

const avatarChar = (name: string) => {
  const m = name.match(/^([^\s【[]+)/);
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
  transition: padding 0.25s ease;
}
.xy-scroll-collapsed {
  padding: 8px 14px;
}

/* 总折叠条 */
.xy-app-collapse-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--xy-line);
}
.xy-scroll-collapsed .xy-app-collapse-bar {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: 0;
}
.xy-app-collapse-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border: 1px solid var(--xy-line-gold);
  border-radius: 12px;
  background: var(--xy-paper-warm);
  color: var(--xy-ink-soft);
  font-family: var(--xy-font-display);
  font-size: 11px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.18s ease;
}
.xy-app-collapse-btn:hover {
  background: rgba(201, 169, 110, 0.12);
  color: var(--xy-ink);
}
.xy-app-collapse-caret {
  font-size: 10px;
  color: var(--xy-cinnabar);
}
.xy-app-collapse-tag {
  font-size: 12px;
  color: var(--xy-ink-mute);
  letter-spacing: 1px;
}
/* 通用垃圾桶按钮 */
.xy-trash {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: var(--xy-paper);
  color: var(--xy-ink-mute);
  border: 1px solid var(--xy-line);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: all 0.18s ease;
  z-index: 4;
}
.xy-art:hover > .xy-trash,
.xy-item:hover > .xy-trash,
.xy-npc:hover > .xy-npc-head > .xy-trash,
.xy-trash:focus-visible {
  opacity: 1;
}
.xy-trash:hover {
  color: var(--xy-cinnabar);
  border-color: var(--xy-cinnabar);
  background: rgba(177, 58, 58, 0.08);
}
.xy-trash-npc {
  top: 4px;
  right: 4px;
  transform: none;
}
.xy-art,
.xy-item {
  position: relative;
}

/* 为带垃圾桶的卡片右上预留空间，避免与切换按钮 / 数量 / 好感度圈重叠 */
.xy-page-arts .xy-art-grid > .xy-art > .xy-art-head {
  padding-right: 24px;
}
.xy-page-storage .xy-item-grid > .xy-item > .xy-item-head {
  padding-right: 24px;
}
.xy-page-relations > .xy-npc-list > .xy-npc > .xy-npc-head {
  padding-right: 28px;
}

/* 删除确认弹窗 */
.xy-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 17, 14, 0.62);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
  padding: 20px;
}
.xy-confirm-box {
  background: var(--xy-paper);
  border: 1px solid var(--xy-line-gold);
  border-radius: 8px;
  padding: 18px 20px 14px;
  min-width: 280px;
  max-width: 92vw;
  box-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.45);
}
.xy-confirm-title {
  font-family: var(--xy-font-display);
  font-size: 16px;
  letter-spacing: 3px;
  color: var(--xy-cinnabar-deep);
  margin-bottom: 10px;
  border-left: 3px solid var(--xy-cinnabar);
  padding-left: 8px;
}
.xy-confirm-msg {
  font-size: 13px;
  color: var(--xy-ink);
  line-height: 1.7;
  margin-bottom: 14px;
}
.xy-confirm-msg strong {
  color: var(--xy-cinnabar-deep);
  font-weight: 600;
}
.xy-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.xy-btn {
  font-family: var(--xy-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid var(--xy-line);
  background: var(--xy-paper-warm);
  color: var(--xy-ink-soft);
  cursor: pointer;
  transition: all 0.18s ease;
}
.xy-btn:hover {
  border-color: var(--xy-line-gold);
  color: var(--xy-ink);
}
.xy-btn-danger {
  background: linear-gradient(135deg, var(--xy-cinnabar), var(--xy-cinnabar-deep));
  border-color: var(--xy-cinnabar-deep);
  color: var(--xy-paper);
}
.xy-btn-danger:hover {
  background: var(--xy-cinnabar-deep);
  color: var(--xy-paper);
  border-color: var(--xy-cinnabar-deep);
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
  gap: 5px;
}

.xy-name-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 2px;
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
  gap: 10px 14px;
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
}

/* 玩家头像（占据原印章位置） */
.xy-user-avatar {
  flex: 0 0 72px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--xy-font-title);
  font-size: 34px;
  background: linear-gradient(135deg, var(--xy-paper-warm), var(--xy-paper-soft));
  border: 2px solid var(--xy-line-gold);
  border-radius: 50%;
  color: var(--xy-ink);
  position: relative;
  cursor: default;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 3px 10px -4px rgba(42, 37, 32, 0.22);
}
.xy-user-avatar.has-img {
  cursor: zoom-in;
}
.xy-user-avatar.has-img:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px -6px rgba(42, 37, 32, 0.32);
}
.xy-user-avatar-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.xy-user-avatar-char {
  position: relative;
  z-index: 1;
  letter-spacing: 0;
}
.xy-user-avatar-cam {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: var(--xy-paper);
  color: var(--xy-ink-mute);
  border: 1.5px solid var(--xy-line-gold);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 3;
  box-shadow: 0 2px 5px rgba(42, 37, 32, 0.22);
}
.xy-user-avatar:hover .xy-user-avatar-cam,
.xy-user-avatar-cam:focus-visible {
  opacity: 1;
}
.xy-user-avatar-cam:hover {
  color: var(--xy-cinnabar);
  border-color: var(--xy-cinnabar);
}

/* 头像放大查看（lightbox） */
.xy-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(20, 17, 14, 0.78);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  cursor: zoom-out;
}
.xy-lightbox-img {
  max-width: min(90vw, 640px);
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.6);
  cursor: default;
  border: 2px solid var(--xy-paper);
}
.xy-lightbox-close {
  position: fixed;
  top: 18px;
  right: 18px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
  background: var(--xy-paper);
  color: var(--xy-ink);
  border: 1px solid var(--xy-line-gold);
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  z-index: 10000;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.xy-lightbox-close:hover {
  background: var(--xy-cinnabar);
  color: var(--xy-paper);
  border-color: var(--xy-cinnabar);
  transform: rotate(90deg);
}

.xy-loc,
.xy-time {
  font-size: 12.5px;
}

/* 资源条 */
.xy-resources {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 12px;
  background: var(--xy-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--xy-line-gold);
  border-radius: 6px;
}
.xy-resource-extra {
  margin-top: 0;
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
  gap: 2px;
}
.xy-bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
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
  height: 6px;
  background: rgba(42, 37, 32, 0.08);
  border-radius: 3px;
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
  margin-top: 8px;
}
.xy-buff-chip {
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 10px;
  border: 1px solid var(--xy-line);
  background: var(--xy-glass);
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: inherit;
  color: inherit;
}
.xy-buff-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px -3px rgba(42, 37, 32, 0.22);
}
.xy-buff-chip.active {
  box-shadow: 0 0 0 2px rgba(201, 169, 110, 0.32);
}
.xy-buff-chip small {
  margin-left: 3px;
  color: var(--xy-cinnabar);
}

/* 状态详情面板 */
.xy-buff-detail {
  margin-top: 6px;
  padding: 8px 10px;
  background: var(--xy-paper-soft);
  border: 1px solid var(--xy-line);
  border-radius: 4px;
  border-left-width: 3px;
  font-size: 12px;
}
.xy-buff-detail.xy-buff-增益 {
  border-left-color: var(--xy-jade);
  background: rgba(91, 138, 114, 0.06);
}
.xy-buff-detail.xy-buff-减益 {
  border-left-color: var(--xy-cinnabar);
  background: rgba(177, 58, 58, 0.06);
}
.xy-buff-detail.xy-buff-特殊 {
  border-left-color: var(--xy-gold);
  background: rgba(201, 169, 110, 0.07);
}
.xy-buff-detail-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}
.xy-buff-detail-name {
  font-family: var(--xy-font-display);
  font-size: 13px;
  letter-spacing: 1px;
}
.xy-buff-detail-stack {
  font-size: 11px;
  color: var(--xy-cinnabar);
  font-variant-numeric: tabular-nums;
}
.xy-buff-detail-close {
  margin-left: auto;
  font-size: 16px;
  line-height: 1;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--xy-line);
  background: transparent;
  color: var(--xy-ink-mute);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}
.xy-buff-detail-close:hover {
  color: var(--xy-cinnabar);
  border-color: var(--xy-cinnabar);
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
  z-index: 2;
}
.xy-npc-avatar.has-img {
  background: var(--xy-paper-soft);
}
.xy-npc-avatar-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.xy-npc-avatar-char {
  position: relative;
  z-index: 1;
}
.xy-npc-avatar-cam {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: var(--xy-paper);
  color: var(--xy-ink-mute);
  border: 1px solid var(--xy-line-gold);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 3;
  box-shadow: 0 1px 3px rgba(42, 37, 32, 0.18);
}
.xy-npc-avatar:hover .xy-npc-avatar-cam,
.xy-npc-avatar-cam:focus-visible {
  opacity: 1;
}
.xy-npc-avatar-cam:hover {
  color: var(--xy-cinnabar);
  border-color: var(--xy-cinnabar);
}
.xy-avatar-file {
  display: none;
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
.xy-npc-yang,
.xy-npc-yin {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 8px;
  letter-spacing: 1px;
  font-family: var(--xy-font-display);
  border: 1px solid;
}
.xy-npc-yang {
  color: #b85a3a;
  border-color: rgba(184, 90, 58, 0.45);
  background: rgba(184, 90, 58, 0.08);
}
.xy-npc-yin {
  color: #6b3c8a;
  border-color: rgba(107, 60, 138, 0.4);
  background: rgba(107, 60, 138, 0.08);
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
  margin-top: 6px;
}
.xy-mini-block h4,
.xy-mini-block-title {
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

/* 折叠头 */
.xy-collapse-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 5px 8px;
  margin: 0;
  border: 1px solid var(--xy-line);
  border-radius: 4px;
  background: rgba(42, 37, 32, 0.04);
  cursor: pointer;
  font-family: inherit;
  color: var(--xy-ink);
  transition: all 0.18s ease;
  text-align: left;
}
.xy-collapse-head:hover {
  background: rgba(42, 37, 32, 0.08);
  border-color: var(--xy-line-gold);
}
.xy-collapse-head.open {
  background: rgba(201, 169, 110, 0.08);
  border-color: var(--xy-line-gold);
}
.xy-collapse-title {
  font-family: var(--xy-font-display);
  font-size: 12px;
  letter-spacing: 3px;
  color: var(--xy-ink);
}
.xy-collapse-count {
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: var(--xy-cinnabar);
  padding: 0 6px;
  border-radius: 6px;
  background: rgba(177, 58, 58, 0.08);
}
.xy-collapse-lock {
  margin-left: 2px;
  font-size: 11px;
  filter: grayscale(0.3);
}
.xy-collapse-caret {
  margin-left: auto;
  font-size: 11px;
  color: var(--xy-ink-mute);
  transition: transform 0.2s ease;
}
.xy-collapse-head.open .xy-collapse-caret {
  transform: rotate(-180deg);
}
.xy-collapse-body {
  margin-top: 4px;
  animation: xy-collapse-in 0.22s ease-out;
}
@keyframes xy-collapse-in {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.xy-collapse-sub {
  padding: 3px 8px;
  background: transparent;
  border: 1px dashed var(--xy-line);
}
.xy-collapse-sub .xy-collapse-title {
  font-size: 11.5px;
  letter-spacing: 2px;
  color: var(--xy-ink-mute);
}
.xy-collapse-sub.open {
  background: rgba(201, 169, 110, 0.05);
}

/* 状态层数小标 */
.xy-buff-stack {
  font-size: 10.5px;
  color: var(--xy-cinnabar);
  font-variant-numeric: tabular-nums;
  margin-left: 2px;
}

/* 紧凑切换按钮（NPC 功法用） */
.xy-toggle-mini {
  font-size: 10.5px;
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 1px;
}

/* Toast 提示条 */
.xy-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 18px;
  background: rgba(42, 37, 32, 0.92);
  color: var(--xy-paper);
  border-radius: 22px;
  font-size: 12.5px;
  letter-spacing: 1px;
  z-index: 10001;
  cursor: pointer;
  box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.4);
  max-width: 80vw;
  text-align: center;
}
.xy-toast-enter-active,
.xy-toast-leave-active {
  transition: all 0.25s ease;
}
.xy-toast-enter-from,
.xy-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

/* NPC 详情：资源池条 */
.xy-npc-bars {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 4px;
}
.xy-npc-bars .xy-unit-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
}
.xy-npc-bars .xy-unit-bar-label {
  flex: 0 0 32px;
  color: var(--xy-ink-mute);
  letter-spacing: 1px;
}
.xy-npc-bars .xy-unit-bar-track {
  flex: 1 1 auto;
  height: 6px;
  background: rgba(42, 37, 32, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.xy-npc-bars .xy-unit-bar-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s;
}
.xy-npc-bars .xy-unit-bar-fill.blood {
  background: linear-gradient(90deg, #8a2828, #d05858);
}
.xy-npc-bars .xy-unit-bar-fill.spirit {
  background: linear-gradient(90deg, #3d5a8a, #6f9bd0);
}
.xy-npc-bars .xy-unit-bar-num {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--xy-ink-mute);
  font-variant-numeric: tabular-nums;
}
.xy-npc-bars .xy-bar-solo {
  flex: 1 1 auto;
  text-align: left;
  color: var(--xy-ink);
}

.xy-npc-effects {
  margin-top: 8px;
}

/* NPC 详情：技艺 */
.xy-npc-skills {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.xy-npc-skills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.xy-npc-skills-tag {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 2px;
  letter-spacing: 1px;
  font-family: var(--xy-font-display);
}
.xy-npc-skill {
  font-size: 11.5px;
  padding: 2px 7px;
  border-radius: 8px;
  background: rgba(42, 37, 32, 0.05);
  color: var(--xy-ink);
  letter-spacing: 0.5px;
}
.xy-npc-skill em {
  font-style: normal;
  margin-left: 4px;
  color: var(--xy-cinnabar);
  font-variant-numeric: tabular-nums;
}
.xy-npc-skill.dim {
  opacity: 0.45;
}
.xy-npc-skill.dim em {
  color: var(--xy-ink-mute);
}

/* NPC 详情：功法迷你卡 */
.xy-npc-arts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.xy-art-mini {
  background: var(--xy-glass);
  border: 1px solid var(--xy-line-gold);
  border-left-width: 3px;
  border-radius: 3px;
  padding: 6px 8px;
}
.xy-art-mini.xy-art-active {
  border-left-color: var(--xy-cinnabar);
  background: linear-gradient(135deg, rgba(177, 58, 58, 0.06), var(--xy-glass));
}
.xy-art-mini .xy-art-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.xy-art-mini .xy-art-title {
  display: flex;
  align-items: center;
  gap: 6px;
}
.xy-art-mini .xy-art-name {
  font-family: var(--xy-font-display);
  font-size: 13.5px;
  letter-spacing: 1px;
}
.xy-art-mini .xy-art-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}
.xy-art-mini .xy-art-desc {
  font-size: 12px;
  color: var(--xy-ink-soft);
  line-height: 1.6;
}

/* NPC 详情：储物空间 */
.xy-npc-storage {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}
.xy-npc-stone {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 10px;
  background: rgba(212, 176, 106, 0.08);
  border-left: 2px solid var(--xy-gold);
  border-radius: 3px;
}
.xy-npc-stone-label {
  font-size: 11px;
  color: var(--xy-ink-mute);
  letter-spacing: 2px;
}
.xy-npc-stone-value {
  font-family: var(--xy-font-title);
  font-size: 16px;
  color: var(--xy-cinnabar);
  font-variant-numeric: tabular-nums;
}
.xy-npc-sub h5 {
  font-family: var(--xy-font-display);
  font-size: 11.5px;
  letter-spacing: 2px;
  color: var(--xy-ink-mute);
  margin-bottom: 4px;
  font-weight: 400;
  border-left: 2px solid var(--xy-line-gold);
  padding-left: 6px;
}
.xy-item-grid-mini {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}
@media (min-width: 520px) {
  .xy-item-grid-mini {
    grid-template-columns: repeat(2, 1fr);
  }
}
.xy-item-grid-mini .xy-item {
  padding: 6px 8px;
}
.xy-item-grid-mini .xy-item-name {
  font-size: 13px;
}
.xy-item-grid-mini .xy-item-desc {
  font-size: 11.5px;
  line-height: 1.5;
  margin-top: 3px;
}
.xy-item-grid-mini .xy-item-meta {
  gap: 3px;
  margin-bottom: 2px;
}

.xy-unit-badge {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(177, 58, 58, 0.1);
  color: var(--xy-cinnabar-deep);
  border: 1px solid rgba(177, 58, 58, 0.25);
  letter-spacing: 1px;
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
.xy-empty-soft {
  padding: 18px 12px;
}
.xy-empty-soft .xy-empty-mark {
  width: 36px;
  height: 36px;
  font-size: 18px;
  margin-bottom: 4px;
}
.xy-empty-soft p {
  font-size: 12px;
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
  .xy-user-avatar {
    flex: 0 0 62px;
    width: 62px;
    height: 62px;
    font-size: 28px;
  }
  .xy-card {
    padding: 12px;
  }
}
</style>
