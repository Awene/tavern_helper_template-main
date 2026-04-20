<template>
  <div v-if="store.data" class="cultivation-status-bar">
    <!-- 页面导航 -->
    <div class="page-navigation">
      <button
        v-for="(page, index) in pages"
        :key="index"
        :class="['nav-button', { active: state.currentPage === index }]"
        @click="
          () => {
            state.currentPage = index;
          }
        "
      >
        {{ page }}
      </button>
    </div>

    <!-- 第一页：主角数值 -->
    <div v-if="state.currentPage === 0" class="page-content page-1">
      <!-- 顶部信息区 -->
      <div class="top-info-panel">
        <!-- 左侧：基本信息 -->
        <div class="left-column">
          <div class="character-name-large">{{ store.data.基本信息.姓名 }}</div>
          <div class="basic-info-row">
            <span class="info-label">种族:</span>
            <span class="info-value">{{ store.data.基本信息.种族 }}</span>
            <span class="info-label">寿元:</span>
            <span class="info-value">{{ store.data.基本信息.寿元.年龄 }}/{{ store.data.基本信息.寿元.寿命 }}</span>
          </div>
          <div class="basic-info-row">
            <span class="info-label">位置:</span>
            <span class="info-value"
              >{{ store.data.基本信息.地点.世界 }}-{{ store.data.基本信息.地点.地域 }}-{{
                store.data.基本信息.地点.具体地点
              }}</span
            >
          </div>
          <div class="basic-info-row">
            <span class="info-label">时间:</span>
            <span class="info-value">{{ currentTime }}</span>
          </div>
          <!-- 状态效果简化显示 -->
          <div v-if="!_.isEmpty(store.data.基本信息.状态效果)" class="status-effects-brief">
            <span
              v-for="(effect, name) in store.data.基本信息.状态效果"
              :key="name"
              class="effect-brief-tag"
              :class="effect.类型.toLowerCase()"
            >
              {{ name }}
            </span>
          </div>
        </div>

        <!-- 右侧：修为和状态 -->
        <div class="right-column">
          <div class="realm-row">
            <span class="info-label">境界:</span>
            <span class="info-value">{{ store.data.基本信息.境界.当前境界 }}</span>
            <span v-if="store.data.基本信息.境界.天谴 > 0" class="info-label danger">天谴:</span>
            <span v-if="store.data.基本信息.境界.天谴 > 0" class="info-value danger">{{
              store.data.基本信息.境界.天谴
            }}</span>
          </div>

          <!-- 三个进度条 -->
          <div class="progress-item">
            <div class="progress-header">
              <span class="progress-name">修为</span>
              <span class="progress-value">{{ cultivationProgress }}</span>
            </div>
            <div class="progress-bar-compact">
              <div class="progress-fill" :style="{ width: cultivationProgressPercent + '%' }"></div>
            </div>
          </div>

          <div class="progress-item">
            <div class="progress-header">
              <span class="progress-name">气血</span>
              <span class="progress-value"
                >{{ store.data.基本信息.状态.气血.现值 }}/{{ store.data.基本信息.状态.气血.上限 }}</span
              >
            </div>
            <div class="progress-bar-compact">
              <div
                class="progress-fill blood"
                :style="{
                  width: (store.data.基本信息.状态.气血.现值 / store.data.基本信息.状态.气血.上限) * 100 + '%',
                }"
              ></div>
            </div>
          </div>

          <div class="progress-item">
            <div class="progress-header">
              <span class="progress-name">灵力</span>
              <span class="progress-value"
                >{{ store.data.基本信息.状态.灵力.现值 }}/{{ store.data.基本信息.状态.灵力.上限 }}</span
              >
            </div>
            <div class="progress-bar-compact">
              <div
                class="progress-fill spirit"
                :style="{
                  width: (store.data.基本信息.状态.灵力.现值 / store.data.基本信息.状态.灵力.上限) * 100 + '%',
                }"
              ></div>
            </div>
          </div>

          <div class="basic-info-row">
            <span class="info-label">遁速:</span>
            <span class="info-value">{{ store.data.基本信息.状态.遁速 }} m/s</span>
          </div>
        </div>
      </div>

      <!-- 详情切换区域 -->
      <div class="detail-section">
        <!-- 标题和导航 -->
        <div class="detail-header">
          <button
            class="nav-arrow left-arrow"
            :disabled="false"
            @click="state.detailTab = (state.detailTab - 1 + 3) % 3"
          >
            ◀
          </button>
          <div class="detail-title">{{ detailTabs[state.detailTab] }}</div>
          <button class="nav-arrow right-arrow" :disabled="false" @click="state.detailTab = (state.detailTab + 1) % 3">
            ▶
          </button>
        </div>

        <!-- 灵根与体质 -->
        <div v-if="state.detailTab === 0" class="detail-content">
          <div class="root-constitution-compact">
            <div class="root-info-compact">
              <span class="label">灵根:</span>
              <span class="value">{{ store.data.基本信息.灵根.名称 }}</span>
              <span v-for="element in store.data.基本信息.灵根.灵根五行" :key="element" class="element-tag-compact">{{
                element
              }}</span>
            </div>
            <div class="constitution-info-compact">
              <span class="label">体质:</span>
              <span class="value">{{ store.data.基本信息.体质.名称 }}</span>
              <span class="attr-compact">悟性:{{ store.data.基本信息.体质.悟性 }}</span>
              <span class="attr-compact">根骨:{{ store.data.基本信息.体质.根骨 }}</span>
              <span class="attr-compact">气感:{{ store.data.基本信息.体质.气感 }}</span>
            </div>
          </div>
        </div>

        <!-- 技艺 -->
        <div v-if="state.detailTab === 1" class="detail-content">
          <div class="skills-compact">
            <div v-if="store.data.基本信息.技艺?.生产类" class="skill-row">
              <span class="skill-category-label">生产:</span>
              <span v-for="(value, name) in store.data.基本信息.技艺.生产类" :key="name" class="skill-compact"
                >{{ name }}{{ value }}</span
              >
            </div>
            <div v-if="store.data.基本信息.技艺?.战斗类" class="skill-row">
              <span class="skill-category-label">战斗:</span>
              <span v-for="(value, name) in store.data.基本信息.技艺.战斗类" :key="name" class="skill-compact"
                >{{ name }}{{ value }}</span
              >
            </div>
          </div>
        </div>

        <!-- 状态效果 -->
        <div v-if="state.detailTab === 2" class="detail-content">
          <div v-if="!_.isEmpty(store.data.基本信息.状态效果)" class="effects-detailed">
            <div
              v-for="(effect, name) in store.data.基本信息.状态效果"
              :key="name"
              class="effect-detailed-card"
              :class="effect.类型.toLowerCase()"
            >
              <div class="effect-header">
                <span class="effect-name">{{ name }}</span>
                <span class="effect-type-badge">{{ effect.类型 }}</span>
              </div>
              <div class="effect-body">
                <div class="effect-row">
                  <span class="effect-label">效果:</span>
                  <span class="effect-value">{{ effect.效果 }}</span>
                </div>
                <div class="effect-row">
                  <span class="effect-label">层数:</span>
                  <span class="effect-value">{{ effect.层数 }}</span>
                </div>
                <div class="effect-row">
                  <span class="effect-label">时间:</span>
                  <span class="effect-value">{{ effect.剩余时间 }}</span>
                </div>
                <div class="effect-row">
                  <span class="effect-label">来源:</span>
                  <span class="effect-value">{{ effect.来源 }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-effects">暂无状态效果</div>
        </div>
      </div>
    </div>

    <!-- 第二页：储物空间与功法 -->
    <div v-if="state.currentPage === 1" class="page-content page-2">
      <div class="storage-layout">
        <!-- 左侧：物品网格 -->
        <div class="inventory-panel">
          <div class="inventory-title">
            <span>背包</span>
            <span class="spirit-stone-badge">💎 {{ store.data.储物空间.灵石 }}</span>
          </div>
          <div class="inventory-grid">
            <!-- 法宝 -->
            <div class="inventory-category">
              <div class="category-label">⚔️ 法宝</div>
              <div class="item-icons">
                <div
                  v-for="(treasure, name) in store.data.储物空间?.法宝 || {}"
                  :key="`treasure-${name}`"
                  class="item-icon"
                  :class="{
                    selected: state.selectedItem?.type === 'treasure' && state.selectedItem?.name === name,
                    active: treasure.使用中,
                  }"
                  :title="name"
                  @click="state.selectedItem = { type: 'treasure', name }"
                >
                  <div class="icon-symbol">⚔️</div>
                  <div class="icon-label">{{ name }}</div>
                </div>
              </div>
            </div>

            <!-- 灵兽 -->
            <div class="inventory-category">
              <div class="category-label">🐉 灵兽</div>
              <div class="item-icons">
                <div
                  v-for="(beast, name) in store.data.储物空间?.灵兽 || {}"
                  :key="`beast-${name}`"
                  class="item-icon"
                  :class="{
                    selected: state.selectedItem?.type === 'beast' && state.selectedItem?.name === name,
                    active: beast.使用中,
                  }"
                  :title="name"
                  @click="state.selectedItem = { type: 'beast', name }"
                >
                  <div class="icon-symbol">🐉</div>
                  <div class="icon-label">{{ name }}</div>
                </div>
              </div>
            </div>

            <!-- 傀儡 -->
            <div class="inventory-category">
              <div class="category-label">🤖 傀儡</div>
              <div class="item-icons">
                <div
                  v-for="(puppet, name) in store.data.储物空间?.傀儡 || {}"
                  :key="`puppet-${name}`"
                  class="item-icon"
                  :class="{
                    selected: state.selectedItem?.type === 'puppet' && state.selectedItem?.name === name,
                    active: puppet.使用中,
                  }"
                  :title="name"
                  @click="state.selectedItem = { type: 'puppet', name }"
                >
                  <div class="icon-symbol">🤖</div>
                  <div class="icon-label">{{ name }}</div>
                </div>
              </div>
            </div>

            <!-- 修炼功法 -->
            <div class="inventory-category">
              <div class="category-label">📚 功法</div>
              <div class="item-icons">
                <div
                  v-for="(art, name) in store.data.修炼功法 || {}"
                  :key="`art-${name}`"
                  class="item-icon"
                  :class="{
                    selected: state.selectedItem?.type === 'art' && state.selectedItem?.name === name,
                    active: art.使用中,
                  }"
                  :title="name"
                  @click="state.selectedItem = { type: 'art', name }"
                >
                  <div class="icon-symbol">📚</div>
                  <div class="icon-label">{{ name }}</div>
                </div>
              </div>
            </div>

            <!-- 物品 -->
            <div class="inventory-category">
              <div class="category-label">📦 物品</div>
              <div class="item-icons">
                <div
                  v-for="name in Object.keys(store.data.储物空间?.物品 || {})"
                  :key="`item-${name}`"
                  class="item-icon"
                  :class="{ selected: state.selectedItem?.type === 'item' && state.selectedItem?.name === name }"
                  :title="name"
                  @click="state.selectedItem = { type: 'item', name }"
                >
                  <div class="icon-symbol">📦</div>
                  <div class="icon-label">{{ name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间和右侧：详情面板 -->
        <div class="detail-panel">
          <div
            v-if="state.selectedItem"
            :key="`${state.selectedItem.type}-${state.selectedItem.name}`"
            class="item-detail"
          >
            <!-- 法宝详情 -->
            <template
              v-if="state.selectedItem.type === 'treasure' && store.data.储物空间.法宝[state.selectedItem.name]"
            >
              <div class="detail-header">
                <div class="detail-title-row">
                  <div class="detail-title">
                    <span
                      >{{ store.data.储物空间.法宝[state.selectedItem.name].品质 }}品
                      {{ state.selectedItem.name }}</span
                    >
                    <div v-if="store.data.储物空间.法宝[state.selectedItem.name].标签?.length" class="tags-inline">
                      <span
                        v-for="tag in store.data.储物空间.法宝[state.selectedItem.name].标签"
                        :key="tag"
                        class="tag-inline"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                  <div class="detail-actions">
                    <button
                      title="删除"
                      class="delete-btn"
                      @click="showDeleteConfirm('treasure', state.selectedItem.name)"
                    >
                      🗑️
                    </button>
                    <label class="toggle-switch-compact">
                      <input
                        type="checkbox"
                        :checked="getItemUsageState('treasure', state.selectedItem.name)"
                        @change="
                          setItemUsageState(
                            'treasure',
                            state.selectedItem.name,
                            ($event.target as HTMLInputElement).checked,
                          )
                        "
                      />
                      <span class="slider-compact"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="detail-content">
                <div class="info-section">
                  <div class="info-row">
                    <span class="label">境界:</span>
                    <span class="value">{{ store.data.储物空间.法宝[state.selectedItem.name].境界 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">五行:</span>
                    <span class="value">{{ store.data.储物空间.法宝[state.selectedItem.name].五行 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">攻击力:</span>
                    <span class="value">{{ store.data.储物空间.法宝[state.selectedItem.name].攻击力 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">防御力:</span>
                    <span class="value">{{ store.data.储物空间.法宝[state.selectedItem.name].防御力 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">灵气:</span>
                    <span class="value"
                      >{{ store.data.储物空间.法宝[state.selectedItem.name].灵气?.现值 ?? 0 }}/{{
                        store.data.储物空间.法宝[state.selectedItem.name].灵气?.上限 ?? 0
                      }}</span
                    >
                  </div>
                </div>
                <!-- 效果 -->
                <div
                  v-if="
                    store.data.储物空间.法宝[state.selectedItem.name].效果 &&
                    Object.keys(store.data.储物空间.法宝[state.selectedItem.name].效果).length
                  "
                  class="info-section"
                >
                  <div class="section-label">效果</div>
                  <div
                    v-for="(effectDesc, effectName) in store.data.储物空间.法宝[state.selectedItem.name].效果"
                    :key="effectName"
                    class="effect-row"
                  >
                    <span class="effect-name">{{ effectName }}:</span>
                    <span class="effect-desc">{{ effectDesc }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 灵兽详情 -->
            <template v-if="state.selectedItem.type === 'beast' && store.data.储物空间.灵兽[state.selectedItem.name]">
              <div class="detail-header">
                <div class="detail-title-row">
                  <div class="detail-title">
                    <span
                      >{{ store.data.储物空间.灵兽[state.selectedItem.name].品质 }}品
                      {{ state.selectedItem.name }}</span
                    >
                    <div v-if="store.data.储物空间.灵兽[state.selectedItem.name].标签?.length" class="tags-inline">
                      <span
                        v-for="tag in store.data.储物空间.灵兽[state.selectedItem.name].标签"
                        :key="tag"
                        class="tag-inline"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                  <div class="detail-actions">
                    <button
                      title="删除"
                      class="delete-btn"
                      @click="showDeleteConfirm('beast', state.selectedItem.name)"
                    >
                      🗑️
                    </button>
                    <label class="toggle-switch-compact">
                      <input
                        type="checkbox"
                        :checked="getItemUsageState('beast', state.selectedItem.name)"
                        @change="
                          setItemUsageState(
                            'beast',
                            state.selectedItem.name,
                            ($event.target as HTMLInputElement).checked,
                          )
                        "
                      />
                      <span class="slider-compact"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="detail-content">
                <div class="info-section">
                  <div class="info-row">
                    <span class="label">境界:</span>
                    <span class="value">{{ store.data.储物空间.灵兽[state.selectedItem.name].境界 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">五行:</span>
                    <span class="value">{{ store.data.储物空间.灵兽[state.selectedItem.name].五行 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">气血:</span>
                    <span class="value"
                      >{{ store.data.储物空间.灵兽[state.selectedItem.name].气血?.现值 ?? 0 }}/{{
                        store.data.储物空间.灵兽[state.selectedItem.name].气血?.上限 ?? 0
                      }}</span
                    >
                  </div>
                  <div class="info-row">
                    <span class="label">攻击力:</span>
                    <span class="value">{{ store.data.储物空间.灵兽[state.selectedItem.name].攻击力 }}</span>
                  </div>
                </div>
                <!-- 效果 -->
                <div
                  v-if="
                    store.data.储物空间.灵兽[state.selectedItem.name].效果 &&
                    Object.keys(store.data.储物空间.灵兽[state.selectedItem.name].效果).length
                  "
                  class="info-section"
                >
                  <div class="section-label">效果</div>
                  <div
                    v-for="(effectDesc, effectName) in store.data.储物空间.灵兽[state.selectedItem.name].效果"
                    :key="effectName"
                    class="effect-row"
                  >
                    <span class="effect-name">{{ effectName }}:</span>
                    <span class="effect-desc">{{ effectDesc }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 傀儡详情 -->
            <template v-if="state.selectedItem.type === 'puppet' && store.data.储物空间.傀儡[state.selectedItem.name]">
              <div class="detail-header">
                <div class="detail-title-row">
                  <div class="detail-title">
                    <span
                      >{{ store.data.储物空间.傀儡[state.selectedItem.name].品质 }}品
                      {{ state.selectedItem.name }}</span
                    >
                    <div v-if="store.data.储物空间.傀儡[state.selectedItem.name].标签?.length" class="tags-inline">
                      <span
                        v-for="tag in store.data.储物空间.傀儡[state.selectedItem.name].标签"
                        :key="tag"
                        class="tag-inline"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                  <div class="detail-actions">
                    <button
                      title="删除"
                      class="delete-btn"
                      @click="showDeleteConfirm('puppet', state.selectedItem.name)"
                    >
                      🗑️
                    </button>
                    <label class="toggle-switch-compact">
                      <input
                        type="checkbox"
                        :checked="getItemUsageState('puppet', state.selectedItem.name)"
                        @change="
                          setItemUsageState(
                            'puppet',
                            state.selectedItem.name,
                            ($event.target as HTMLInputElement).checked,
                          )
                        "
                      />
                      <span class="slider-compact"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="detail-content">
                <div class="info-section">
                  <div class="info-row">
                    <span class="label">境界:</span>
                    <span class="value">{{ store.data.储物空间.傀儡[state.selectedItem.name].境界 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">气血:</span>
                    <span class="value"
                      >{{ store.data.储物空间.傀儡[state.selectedItem.name].气血?.现值 ?? 0 }}/{{
                        store.data.储物空间.傀儡[state.selectedItem.name].气血?.上限 ?? 0
                      }}</span
                    >
                  </div>
                  <div class="info-row">
                    <span class="label">攻击力:</span>
                    <span class="value">{{ store.data.储物空间.傀儡[state.selectedItem.name].攻击力 }}</span>
                  </div>
                </div>
                <!-- 效果 -->
                <div
                  v-if="
                    store.data.储物空间.傀儡[state.selectedItem.name].效果 &&
                    Object.keys(store.data.储物空间.傀儡[state.selectedItem.name].效果).length
                  "
                  class="info-section"
                >
                  <div class="section-label">效果</div>
                  <div
                    v-for="(effectDesc, effectName) in store.data.储物空间.傀儡[state.selectedItem.name].效果"
                    :key="effectName"
                    class="effect-row"
                  >
                    <span class="effect-name">{{ effectName }}:</span>
                    <span class="effect-desc">{{ effectDesc }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 功法详情 -->
            <template v-if="state.selectedItem.type === 'art' && store.data.修炼功法[state.selectedItem.name]">
              <div class="detail-header">
                <div class="detail-title-row">
                  <div class="detail-title">
                    <span>{{ store.data.修炼功法[state.selectedItem.name].品质 }}品 {{ state.selectedItem.name }}</span>
                    <div v-if="store.data.修炼功法[state.selectedItem.name].标签?.length" class="tags-inline">
                      <span
                        v-for="tag in store.data.修炼功法[state.selectedItem.name].标签"
                        :key="tag"
                        class="tag-inline"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                  <label class="toggle-switch-compact">
                    <input
                      type="checkbox"
                      :checked="getItemUsageState('art', state.selectedItem.name)"
                      @change="
                        setItemUsageState('art', state.selectedItem.name, ($event.target as HTMLInputElement).checked)
                      "
                    />
                    <span class="slider-compact"></span>
                  </label>
                </div>
              </div>
              <div class="detail-content">
                <div class="info-section">
                  <div class="info-row">
                    <span class="label">境界:</span>
                    <span class="value">{{ store.data.修炼功法[state.selectedItem.name].境界 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">五行:</span>
                    <span class="value">{{ store.data.修炼功法[state.selectedItem.name].五行 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">类型:</span>
                    <span class="value">{{ store.data.修炼功法[state.selectedItem.name].类型 }}</span>
                  </div>
                </div>
                <!-- 效果 -->
                <div
                  v-if="
                    store.data.修炼功法[state.selectedItem.name].效果 &&
                    Object.keys(store.data.修炼功法[state.selectedItem.name].效果).length
                  "
                  class="info-section"
                >
                  <div class="section-label">效果</div>
                  <div
                    v-for="(effectDesc, effectName) in store.data.修炼功法[state.selectedItem.name].效果"
                    :key="effectName"
                    class="effect-row"
                  >
                    <span class="effect-name">{{ effectName }}:</span>
                    <span class="effect-desc">{{ effectDesc }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 物品详情 -->
            <template v-if="state.selectedItem.type === 'item' && store.data.储物空间.物品[state.selectedItem.name]">
              <div class="detail-header">
                <div class="detail-title-row">
                  <div class="detail-title">
                    <span
                      >{{ store.data.储物空间.物品[state.selectedItem.name].品质 }}品
                      {{ state.selectedItem.name }}</span
                    >
                    <div v-if="store.data.储物空间.物品[state.selectedItem.name].标签?.length" class="tags-inline">
                      <span
                        v-for="tag in store.data.储物空间.物品[state.selectedItem.name].标签"
                        :key="tag"
                        class="tag-inline"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                  <div class="detail-actions">
                    <button title="删除" class="delete-btn" @click="showDeleteConfirm('item', state.selectedItem.name)">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              <div class="detail-content">
                <div class="info-section">
                  <div class="info-row">
                    <span class="label">类型:</span>
                    <span class="value">{{ store.data.储物空间.物品[state.selectedItem.name].类型 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">数量:</span>
                    <span class="value">{{ store.data.储物空间.物品[state.selectedItem.name].数量 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">境界:</span>
                    <span class="value">{{ store.data.储物空间.物品[state.selectedItem.name].境界 }}</span>
                  </div>
                </div>
                <!-- 效果 -->
                <div
                  v-if="
                    store.data.储物空间.物品[state.selectedItem.name].效果 &&
                    Object.keys(store.data.储物空间.物品[state.selectedItem.name].效果).length
                  "
                  class="info-section"
                >
                  <div class="section-label">效果</div>
                  <div
                    v-for="(effectDesc, effectName) in store.data.储物空间.物品[state.selectedItem.name].效果"
                    :key="effectName"
                    class="effect-row"
                  >
                    <span class="effect-name">{{ effectName }}:</span>
                    <span class="effect-desc">{{ effectDesc }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div v-else class="no-selection">
            <div class="no-selection-text">点击左侧物品查看详情</div>
          </div>
        </div>

        <!-- 装备栏已移除 -->
        <div class="equipment-panel" style="display: none">
          <div class="equipment-title">装备</div>
          <div class="equipment-body">
            <!-- 上半部分：头部、上装、下装、外搭 -->
            <div class="equipment-top">
              <!-- 头部 -->
              <div class="slot-row">
                <div class="slot-label">头</div>
                <div
                  class="slot-box"
                  :class="{ equipped: state.equipmentSlots.头部 }"
                  @click="
                    state.equipmentSlots.头部 = state.selectedItem?.type === 'item' ? state.selectedItem.name : null
                  "
                >
                  <div v-if="state.equipmentSlots.头部" class="slot-content">
                    {{ state.equipmentSlots.头部.substring(0, 2) }}
                  </div>
                  <div v-else class="slot-empty">-</div>
                </div>
              </div>

              <!-- 上装 -->
              <div class="slot-row">
                <div class="slot-label">上</div>
                <div
                  class="slot-box"
                  :class="{ equipped: state.equipmentSlots.上装 }"
                  @click="
                    state.equipmentSlots.上装 = state.selectedItem?.type === 'item' ? state.selectedItem.name : null
                  "
                >
                  <div v-if="state.equipmentSlots.上装" class="slot-content">
                    {{ state.equipmentSlots.上装.substring(0, 2) }}
                  </div>
                  <div v-else class="slot-empty">-</div>
                </div>
              </div>
              <!-- 下装 -->
              <div class="slot-row">
                <div class="slot-label">下</div>
                <div
                  class="slot-box"
                  :class="{ equipped: state.equipmentSlots.下装 }"
                  @click="
                    state.equipmentSlots.下装 = state.selectedItem?.type === 'item' ? state.selectedItem.name : null
                  "
                >
                  <div v-if="state.equipmentSlots.下装" class="slot-content">
                    {{ state.equipmentSlots.下装.substring(0, 2) }}
                  </div>
                  <div v-else class="slot-empty">-</div>
                </div>
              </div>

              <!-- 外搭 -->
              <div class="slot-row">
                <div class="slot-label">外</div>
                <div
                  class="slot-box"
                  :class="{ equipped: state.equipmentSlots.外搭 }"
                  @click="
                    state.equipmentSlots.外搭 = state.selectedItem?.type === 'item' ? state.selectedItem.name : null
                  "
                >
                  <div v-if="state.equipmentSlots.外搭" class="slot-content">
                    {{ state.equipmentSlots.外搭.substring(0, 2) }}
                  </div>
                  <div v-else class="slot-empty">-</div>
                </div>
              </div>
            </div>

            <!-- 中间部分：足部、手部、腰带 -->
            <div class="equipment-middle">
              <!-- 足部 -->
              <div class="slot-row">
                <div class="slot-label">足</div>
                <div
                  class="slot-box"
                  :class="{ equipped: state.equipmentSlots.足部 }"
                  @click="
                    state.equipmentSlots.足部 = state.selectedItem?.type === 'item' ? state.selectedItem.name : null
                  "
                >
                  <div v-if="state.equipmentSlots.足部" class="slot-content">
                    {{ state.equipmentSlots.足部.substring(0, 2) }}
                  </div>
                  <div v-else class="slot-empty">-</div>
                </div>
              </div>

              <!-- 手部 -->
              <div class="slot-row">
                <div class="slot-label">手</div>
                <div
                  class="slot-box"
                  :class="{ equipped: state.equipmentSlots.手部 }"
                  @click="
                    state.equipmentSlots.手部 = state.selectedItem?.type === 'item' ? state.selectedItem.name : null
                  "
                >
                  <div v-if="state.equipmentSlots.手部" class="slot-content">
                    {{ state.equipmentSlots.手部.substring(0, 2) }}
                  </div>
                  <div v-else class="slot-empty">-</div>
                </div>
              </div>

              <!-- 腰带 -->
              <div class="slot-row">
                <div class="slot-label">腰</div>
                <div
                  class="slot-box"
                  :class="{ equipped: state.equipmentSlots.腰带 }"
                  @click="
                    state.equipmentSlots.腰带 = state.selectedItem?.type === 'item' ? state.selectedItem.name : null
                  "
                >
                  <div v-if="state.equipmentSlots.腰带" class="slot-content">
                    {{ state.equipmentSlots.腰带.substring(0, 2) }}
                  </div>
                  <div v-else class="slot-empty">-</div>
                </div>
              </div>
            </div>

            <!-- 下半部分：配饰1、配饰2 -->
            <div class="equipment-bottom">
              <!-- 配饰1 -->
              <div class="slot-row">
                <div class="slot-label">饰1</div>
                <div
                  class="slot-box"
                  :class="{ equipped: state.equipmentSlots.配饰1 }"
                  @click="
                    state.equipmentSlots.配饰1 = state.selectedItem?.type === 'item' ? state.selectedItem.name : null
                  "
                >
                  <div v-if="state.equipmentSlots.配饰1" class="slot-content">
                    {{ state.equipmentSlots.配饰1.substring(0, 2) }}
                  </div>
                  <div v-else class="slot-empty">-</div>
                </div>
              </div>

              <!-- 配饰2 -->
              <div class="slot-row">
                <div class="slot-label">饰2</div>
                <div
                  class="slot-box"
                  :class="{ equipped: state.equipmentSlots.配饰2 }"
                  @click="
                    state.equipmentSlots.配饰2 = state.selectedItem?.type === 'item' ? state.selectedItem.name : null
                  "
                >
                  <div v-if="state.equipmentSlots.配饰2" class="slot-content">
                    {{ state.equipmentSlots.配饰2.substring(0, 2) }}
                  </div>
                  <div v-else class="slot-empty">-</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第三页：关系列表 -->
    <div v-if="state.currentPage === 2" class="page-content page-3">
      <div class="relationships-container">
        <!-- 左侧：人物列表 -->
        <div class="npc-list-panel">
          <div class="list-header">
            <h3>人物列表</h3>
            <span class="count">{{ store.data.关系列表 ? Object.keys(store.data.关系列表).length : 0 }}</span>
          </div>
          <div class="npc-list">
            <div
              v-for="(npc, name) in store.data.关系列表"
              :key="name"
              class="npc-list-item"
              :class="{ active: state.selectedNPC === name, present: npc.在场 }"
              @click="state.selectedNPC = name"
            >
              <div class="npc-list-name">{{ name }}</div>
              <div class="npc-list-status">{{ npc.在场 ? '在场' : '离场' }}</div>
            </div>
          </div>
        </div>

        <!-- 右侧：人物详情 -->
        <div class="npc-detail-panel">
          <template v-if="state.selectedNPC && store.data.关系列表[state.selectedNPC]">
            <div class="detail-header">
              <div class="detail-title-row">
                <div class="detail-title">
                  <span>{{ state.selectedNPC }}</span>
                </div>
              </div>
              <div class="detail-actions">
                <button title="删除" class="delete-btn" @click="showDeleteConfirm('npc', state.selectedNPC)">🗑️</button>
              </div>
            </div>

            <div class="detail-content">
              <!-- 基本信息 + 关系信息 -->
              <div class="info-section compact">
                <div class="compact-grid">
                  <div class="info-row">
                    <span class="label">种族:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].种族 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">身份:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].身份?.join(', ') || '未知' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">境界:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].境界 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">好感度:</span>
                    <span
                      class="value"
                      :class="{
                        positive: store.data.关系列表[state.selectedNPC].好感度 > 0,
                        negative: store.data.关系列表[state.selectedNPC].好感度 < 0,
                      }"
                    >
                      {{ store.data.关系列表[state.selectedNPC].好感度 > 0 ? '+' : ''
                      }}{{ store.data.关系列表[state.selectedNPC].好感度 }}
                    </span>
                  </div>
                  <div class="info-row full-width">
                    <span class="label">性格:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].性格 || '-' }}</span>
                  </div>
                  <div class="info-row full-width">
                    <span class="label">外貌:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].外貌 || '-' }}</span>
                  </div>
                  <div class="info-row full-width">
                    <span class="label">着装:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].着装 || '-' }}</span>
                  </div>
                  <div v-if="store.data.关系列表[state.selectedNPC].道侣" class="info-row highlight">
                    <span class="label">道侣:</span>
                    <span class="value">✓</span>
                  </div>
                  <div v-if="store.data.关系列表[state.selectedNPC].元阴" class="info-row">
                    <span class="label">元阴:</span>
                    <span class="value">✓</span>
                  </div>
                  <div v-if="store.data.关系列表[state.selectedNPC].元阳" class="info-row">
                    <span class="label">元阳:</span>
                    <span class="value">✓</span>
                  </div>
                </div>
              </div>

              <!-- 寿元 + 灵根 + 体质 -->
              <div class="info-section compact">
                <div class="subsection-title">寿元</div>
                <div class="compact-grid">
                  <div class="info-row">
                    <span class="label">年龄:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].寿元?.年龄 ?? 0 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">寿命:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].寿元?.寿命 ?? 0 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">外观:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].寿元?.外观年龄 ?? 0 }}</span>
                  </div>
                </div>

                <div class="subsection-title">灵根</div>
                <div class="compact-grid">
                  <div class="info-row">
                    <span class="label">名称:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].灵根?.名称 || '凡品灵根' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">五行:</span>
                    <span class="value">{{
                      store.data.关系列表[state.selectedNPC].灵根?.灵根五行?.join('/') || '无'
                    }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">品阶:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].灵根?.灵根品阶 || '无灵根' }}</span>
                  </div>
                </div>

                <div class="subsection-title">体质</div>
                <div class="compact-grid">
                  <div class="info-row">
                    <span class="label">名称:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].体质?.名称 || '凡体' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">悟性:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].体质?.悟性 ?? 0 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">根骨:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].体质?.根骨 ?? 0 }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">气感:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].体质?.气感 ?? 0 }}</span>
                  </div>
                  <div v-if="store.data.关系列表[state.selectedNPC].体质?.描述" class="info-row full-width">
                    <span class="label">描述:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].体质?.描述 }}</span>
                  </div>
                </div>
              </div>

              <!-- 状态信息 -->
              <div class="info-section compact">
                <div class="subsection-title">状态</div>
                <div class="compact-grid">
                  <div class="info-row">
                    <span class="label">气血:</span>
                    <span class="value"
                      >{{ store.data.关系列表[state.selectedNPC].状态?.气血?.现值 ?? 0 }}/{{
                        store.data.关系列表[state.selectedNPC].状态?.气血?.上限 ?? 0
                      }}</span
                    >
                  </div>
                  <div class="info-row">
                    <span class="label">灵力:</span>
                    <span class="value"
                      >{{ store.data.关系列表[state.selectedNPC].状态?.灵力?.现值 ?? 0 }}/{{
                        store.data.关系列表[state.selectedNPC].状态?.灵力?.上限 ?? 0
                      }}</span
                    >
                  </div>
                  <div class="info-row">
                    <span class="label">遁速:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].状态?.遁速 ?? 0 }}</span>
                  </div>
                </div>
              </div>

              <!-- 技艺信息 -->
              <div v-if="store.data.关系列表[state.selectedNPC].技艺" class="info-section compact">
                <div class="subsection-title">技艺</div>
                <div class="compact-grid">
                  <template v-if="store.data.关系列表[state.selectedNPC].技艺?.生产类">
                    <div class="info-row">
                      <span class="label">炼器:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.生产类.炼器 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">驯兽:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.生产类.驯兽 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">培育:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.生产类.培育 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">卜卦:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.生产类.卜卦 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">炼丹:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.生产类.炼丹 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">制符:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.生产类.制符 ?? 0 }}</span>
                    </div>
                  </template>
                  <template v-if="store.data.关系列表[state.selectedNPC].技艺?.战斗类">
                    <div class="info-row">
                      <span class="label">御物:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.战斗类.御物 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">咒法:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.战斗类.咒法 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">幻术:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.战斗类.幻术 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">阵法:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.战斗类.阵法 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">神识:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.战斗类.神识 ?? 0 }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">炼体:</span>
                      <span class="value">{{ store.data.关系列表[state.selectedNPC].技艺.战斗类.炼体 ?? 0 }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 状态效果 -->
              <div v-if="!_.isEmpty(store.data.关系列表[state.selectedNPC].状态效果)" class="info-section compact">
                <div class="subsection-title">状态效果</div>
                <div class="effects-compact">
                  <div
                    v-for="(effect, effectName) in store.data.关系列表[state.selectedNPC].状态效果"
                    :key="effectName"
                    class="effect-compact"
                    :class="effect.类型.toLowerCase()"
                  >
                    <span class="effect-name">{{ effectName }}</span>
                    <span class="effect-type">{{ effect.类型 }}</span>
                    <span class="effect-info">{{ effect.效果 }}</span>
                    <span class="effect-meta">{{ effect.层数 }}层 {{ effect.剩余时间 }}</span>
                  </div>
                </div>
              </div>

              <!-- 功法 -->
              <div v-if="!_.isEmpty(store.data.关系列表[state.selectedNPC].功法)" class="info-section compact">
                <div class="subsection-title">功法</div>
                <div class="arts-compact">
                  <div
                    v-for="(art, artName) in store.data.关系列表[state.selectedNPC].功法"
                    :key="artName"
                    class="art-compact"
                  >
                    <div class="art-compact-header">
                      <span class="art-name">{{ artName }}</span>
                      <span class="art-type" :class="art.类型.toLowerCase()">{{ art.类型 }}</span>
                      <span class="art-quality">{{ art.品质 }}</span>
                    </div>
                    <div class="art-compact-info">
                      <span>{{ art.境界 }}</span>
                      <span>{{ art.五行 }}</span>
                      <span>{{ art.消耗 }}</span>
                      <span v-if="art.标签?.length">{{ art.标签.join('/') }}</span>
                    </div>
                    <div v-if="art.描述" class="art-compact-desc">{{ art.描述 }}</div>
                  </div>
                </div>
              </div>

              <!-- 储物空间 -->
              <div v-if="store.data.关系列表[state.selectedNPC].储物空间" class="info-section compact">
                <div class="subsection-title">储物空间</div>

                <!-- 灵石 -->
                <div class="compact-grid">
                  <div class="info-row">
                    <span class="label">灵石:</span>
                    <span class="value">{{ store.data.关系列表[state.selectedNPC].储物空间?.灵石 ?? 0 }}</span>
                  </div>
                </div>

                <!-- 物品 -->
                <div
                  v-if="!_.isEmpty(store.data.关系列表[state.selectedNPC].储物空间?.物品)"
                  class="storage-subsection"
                >
                  <div class="storage-subsection-title">
                    物品 ({{ Object.keys(store.data.关系列表[state.selectedNPC].储物空间?.物品 || {}).length }})
                  </div>
                  <div class="items-compact">
                    <div
                      v-for="(item, itemName) in store.data.关系列表[state.selectedNPC].储物空间?.物品"
                      :key="itemName"
                      class="item-compact"
                    >
                      <div class="item-compact-header">
                        <span class="item-name">{{ itemName }}</span>
                        <span class="item-quantity">×{{ item.数量 ?? 1 }}</span>
                      </div>
                      <div v-if="item.品质" class="item-compact-info">
                        <span>{{ item.品质 }}</span>
                      </div>
                      <div v-if="item.描述" class="item-compact-desc">{{ item.描述 }}</div>
                    </div>
                  </div>
                </div>

                <!-- 法宝 -->
                <div
                  v-if="!_.isEmpty(store.data.关系列表[state.selectedNPC].储物空间?.法宝)"
                  class="storage-subsection"
                >
                  <div class="storage-subsection-title">
                    法宝 ({{ Object.keys(store.data.关系列表[state.selectedNPC].储物空间?.法宝 || {}).length }})
                  </div>
                  <div class="treasures-compact">
                    <div
                      v-for="(treasure, treasureName) in store.data.关系列表[state.selectedNPC].储物空间?.法宝 as any"
                      :key="treasureName"
                      class="treasure-compact"
                    >
                      <div class="treasure-compact-header">
                        <span class="treasure-name">{{ treasureName }}</span>
                        <span class="treasure-quality">{{ treasure.品质 }}</span>
                      </div>
                      <div class="treasure-compact-info">
                        <span v-if="treasure.五行">{{ treasure.五行 }}</span>
                        <span v-if="treasure.消耗">{{ treasure.消耗 }}</span>
                        <span v-if="treasure.标签?.length">{{ treasure.标签.join('/') }}</span>
                      </div>
                      <div v-if="treasure.描述" class="treasure-compact-desc">{{ treasure.描述 }}</div>
                    </div>
                  </div>
                </div>

                <!-- 傀儡 -->
                <div
                  v-if="!_.isEmpty(store.data.关系列表[state.selectedNPC].储物空间?.傀儡)"
                  class="storage-subsection"
                >
                  <div class="storage-subsection-title">
                    傀儡 ({{ Object.keys(store.data.关系列表[state.selectedNPC].储物空间?.傀儡 || {}).length }})
                  </div>
                  <div class="puppets-compact">
                    <div
                      v-for="(puppet, puppetName) in store.data.关系列表[state.selectedNPC].储物空间?.傀儡 as any"
                      :key="puppetName"
                      class="puppet-compact"
                    >
                      <div class="puppet-compact-header">
                        <span class="puppet-name">{{ puppetName }}</span>
                        <span class="puppet-quality">{{ puppet.品质 }}</span>
                      </div>
                      <div class="puppet-compact-info">
                        <span v-if="puppet.五行">{{ puppet.五行 }}</span>
                        <span v-if="puppet.消耗">{{ puppet.消耗 }}</span>
                        <span v-if="puppet.标签?.length">{{ puppet.标签.join('/') }}</span>
                      </div>
                      <div v-if="puppet.描述" class="puppet-compact-desc">{{ puppet.描述 }}</div>
                    </div>
                  </div>
                </div>

                <!-- 灵兽 -->
                <div
                  v-if="!_.isEmpty(store.data.关系列表[state.selectedNPC].储物空间?.灵兽)"
                  class="storage-subsection"
                >
                  <div class="storage-subsection-title">
                    灵兽 ({{ Object.keys(store.data.关系列表[state.selectedNPC].储物空间?.灵兽 || {}).length }})
                  </div>
                  <div class="beasts-compact">
                    <div
                      v-for="(beast, beastName) in store.data.关系列表[state.selectedNPC].储物空间?.灵兽 as any"
                      :key="beastName"
                      class="beast-compact"
                    >
                      <div class="beast-compact-header">
                        <span class="beast-name">{{ beastName }}</span>
                        <span class="beast-quality">{{ beast.品质 }}</span>
                      </div>
                      <div class="beast-compact-info">
                        <span v-if="beast.五行">{{ beast.五行 }}</span>
                        <span v-if="beast.消耗">{{ beast.消耗 }}</span>
                        <span v-if="beast.标签?.length">{{ beast.标签.join('/') }}</span>
                      </div>
                      <div v-if="beast.描述" class="beast-compact-desc">{{ beast.描述 }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="empty-state">
            <div class="empty-icon">👤</div>
            <div class="empty-text">选择一个人物查看详情</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="state.deleteConfirm" class="delete-confirm-overlay">
      <div class="delete-confirm-modal">
        <div class="confirm-header">
          <span class="confirm-title">确认删除</span>
        </div>
        <div class="confirm-body">
          <p>
            确定要删除 <strong>{{ state.deleteConfirm.name }}</strong> 吗？
          </p>
          <p class="confirm-warning">此操作无法撤销</p>
        </div>
        <div class="confirm-footer">
          <button class="btn-cancel" @click="cancelDelete">取消</button>
          <button class="btn-confirm" @click="confirmDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, reactive } from 'vue';
import { useDataStore } from './store';

const store = useDataStore();
const state = reactive({
  currentPage: 0,
  effectsExpanded: false,
  detailTab: 0, // 0: 灵根与体质, 1: 技艺, 2: 状态效果
  selectedItem: null as { type: string; name: string } | null, // 选中的物品
  selectedNPC: null as string | null, // 选中的NPC
  deleteConfirm: null as { type: string; name: string } | null, // 删除确认状态
  equipmentSlots: {
    头部: null as string | null,
    上装: null as string | null,
    下装: null as string | null,
    外搭: null as string | null,
    足部: null as string | null,
    手部: null as string | null,
    腰带: null as string | null,
    配饰1: null as string | null,
    配饰2: null as string | null,
  },
});
const pages = ['主角数值', '储物装备', '关系列表'];
const detailTabs = ['灵根与体质', '技艺', '状态效果'];

// 物品类型和图标映射（暂未使用）
// const itemTypeIcons: Record<string, string> = {
//   法宝: '⚔️',
//   灵兽: '🐉',
//   傀儡: '🤖',
//   物品: '📦',
//   灵石: '💎',
// };

// 计算修为进度百分比
const cultivationProgressPercent = computed(() => {
  const current = store.data.基本信息.境界.修为进度;
  const total = store.data.基本信息.境界.修为上限;
  if (!total || total === 0) return 0;

  return (current / total) * 100;
});

// 格式化修为进度显示
const cultivationProgress = computed(() => {
  const current = store.data.基本信息.境界.修为进度;
  const total = store.data.基本信息.境界.修为上限;
  return `${current}/${total}`;
});

// 格式化时间显示
const currentTime = computed(() => {
  const time = store.data.基本信息.时间;
  if (!time) return '';

  return `${time.年}年${time.月}月${time.日}日 ${time.时辰}`;
});

// 处理物品使用中状态的getter和setter
const getItemUsageState = (type: string, name: string) => {
  if (type === 'treasure') return store.data.储物空间.法宝[name]?.使用中 ?? false;
  if (type === 'beast') return store.data.储物空间.灵兽[name]?.使用中 ?? false;
  if (type === 'puppet') return store.data.储物空间.傀儡[name]?.使用中 ?? false;
  if (type === 'art') return store.data.修炼功法[name]?.使用中 ?? false;
  return false;
};

const setItemUsageState = (type: string, name: string, value: boolean) => {
  if (type === 'treasure' && store.data.储物空间.法宝[name]) {
    store.data.储物空间.法宝[name].使用中 = value;
  } else if (type === 'beast' && store.data.储物空间.灵兽[name]) {
    store.data.储物空间.灵兽[name].使用中 = value;
  } else if (type === 'puppet' && store.data.储物空间.傀儡[name]) {
    store.data.储物空间.傀儡[name].使用中 = value;
  } else if (type === 'art' && store.data.修炼功法[name]) {
    // 功法互斥逻辑：只有心法、护体、身法三类互斥，攻击、咒法、其他不互斥
    const art = store.data.修炼功法[name];
    const artType = art.类型;
    const exclusiveTypes = ['心法', '护体', '身法']; // 互斥的类型

    if (value && exclusiveTypes.includes(artType)) {
      // 启用互斥类型的功法时，自动关闭同类型的其他功法
      for (const [otherName, otherArt] of Object.entries(store.data.修炼功法)) {
        if (otherName !== name && otherArt.使用中 && otherArt.类型 === artType) {
          otherArt.使用中 = false;
        }
      }
    }

    store.data.修炼功法[name].使用中 = value;
  }
};

// 显示删除确认对话框
const showDeleteConfirm = (type: string, name: string) => {
  state.deleteConfirm = { type, name };
};

// 确认删除
const confirmDelete = () => {
  if (!state.deleteConfirm) return;

  const { type, name } = state.deleteConfirm;

  if (type === 'treasure' && store.data.储物空间.法宝[name]) {
    delete store.data.储物空间.法宝[name];
  } else if (type === 'beast' && store.data.储物空间.灵兽[name]) {
    delete store.data.储物空间.灵兽[name];
  } else if (type === 'puppet' && store.data.储物空间.傀儡[name]) {
    delete store.data.储物空间.傀儡[name];
  } else if (type === 'item' && store.data.储物空间.物品[name]) {
    delete store.data.储物空间.物品[name];
  } else if (type === 'npc' && store.data.关系列表[name]) {
    delete store.data.关系列表[name];
    state.selectedNPC = null;
  }

  state.selectedItem = null;
  state.deleteConfirm = null;
};

// 取消删除
const cancelDelete = () => {
  state.deleteConfirm = null;
};
</script>

<style lang="scss" scoped>
.cultivation-status-bar {
  width: 100%;
  max-width: 1000px;
  background: linear-gradient(145deg, #f0f4f8, #e2e8f0);
  border: 2px solid #4a5568;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  font-family: 'Microsoft YaHei', sans-serif;
  color: #2d3748;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 auto;
  padding: 0;
  max-height: 90vh;
  overflow: hidden;
}

// 页面导航
.page-navigation {
  display: flex;
  gap: 0;
  background: linear-gradient(to right, #667eea, #764ba2);
  padding: 0;
  border-bottom: 2px solid #4a5568;

  .nav-button {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: all 0.3s ease;
    border-bottom: 3px solid transparent;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    &.active {
      background: rgba(255, 255, 255, 0.2);
      border-bottom-color: #ffd700;
    }
  }
}

// 页面内容
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 0;
  display: block;
  width: 100%;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #e2e8f0;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;

    &:hover {
      background: #a0aec0;
    }
  }

  &.page-1 {
    overflow-y: hidden;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

// 通用样式
.section {
  background: #edf2f7;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.section-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 12px;
  color: #2d3748;
  border-bottom: 2px solid #667eea;
  padding-bottom: 6px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;

  .label {
    font-weight: bold;
    color: #4a5568;
    margin-right: 8px;
  }

  .value {
    color: #2d3748;
    flex: 1;
    text-align: right;

    &.danger {
      color: #e53e3e;
      font-weight: bold;
    }
  }
}

// 角色基本信息
.character-info-section {
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.character-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.character-name {
  font-size: 28px;
  font-weight: bold;
}

.character-race {
  font-size: 16px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 4px;
}

.location-time-info {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .info-item {
    color: white;

    .label {
      color: rgba(255, 255, 255, 0.9);
    }

    .value {
      color: white;
    }
  }
}

// 修为进度
.progress-section {
  margin-top: 12px;

  .progress-label {
    font-weight: bold;
    margin-bottom: 6px;
    color: #2d3748;
  }

  .progress-bar {
    height: 16px;
    background: #cbd5e0;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 6px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(to right, #48bb78, #38a169);
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 12px;
    text-align: right;
    color: #4a5568;
  }
}

// 状态属性
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.status-item {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #cbd5e0;

  .status-name {
    font-weight: bold;
    margin-bottom: 6px;
    color: #2d3748;
  }

  .status-bar {
    height: 12px;
    background: #cbd5e0;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  .status-fill {
    height: 100%;
    background: linear-gradient(to right, #4299e1, #3182ce);
    transition: width 0.3s ease;
  }

  .status-value {
    font-size: 12px;
    color: #4a5568;
    text-align: right;
  }
}

// 灵根与体质
.root-constitution {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  .info-label {
    font-weight: bold;
    color: #2d3748;
    margin-bottom: 6px;
  }
}

.root-info {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #cbd5e0;
}

.root-name {
  font-weight: bold;
  margin-bottom: 6px;
  color: #2d3748;
}

.root-elements {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.element-tag {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.constitution-info {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #cbd5e0;
}

.constitution-name {
  font-weight: bold;
  margin-bottom: 4px;
  color: #2d3748;
}

.constitution-desc {
  font-size: 12px;
  color: #718096;
  margin-bottom: 8px;
}

.constitution-attributes {
  display: flex;
  justify-content: space-around;
}

.attr {
  display: flex;
  flex-direction: column;
  align-items: center;

  .attr-label {
    font-size: 12px;
    color: #4a5568;
    margin-bottom: 2px;
  }

  .attr-value {
    font-weight: bold;
    color: #2d3748;
  }
}

// 技艺
.skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.skill-category {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #cbd5e0;

  .category-title {
    font-weight: bold;
    margin-bottom: 8px;
    color: #2d3748;
    border-bottom: 1px solid #cbd5e0;
    padding-bottom: 4px;
  }
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;

  .skill-name {
    color: #4a5568;
  }

  .skill-value {
    font-weight: bold;
    color: #2d3748;
  }
}

// 状态效果
.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.effect-item {
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid;

  &.增益 {
    background: #c6f6d5;
    border-color: #38a169;
  }

  &.减益 {
    background: #fed7d7;
    border-color: #e53e3e;
  }

  &.特殊 {
    background: #e2e8f0;
    border-color: #4a5568;
  }

  .effect-name {
    font-weight: bold;
    margin-bottom: 4px;
  }

  .effect-type {
    font-size: 11px;
    margin-bottom: 2px;
  }

  .effect-layer {
    font-size: 11px;
    margin-bottom: 2px;
  }

  .effect-time {
    font-size: 11px;
    margin-bottom: 2px;
  }

  .effect-desc {
    font-size: 11px;
    margin-top: 4px;
  }
}

// 修炼功法卡片
.arts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.art-card {
  background: white;
  border: 2px solid #cbd5e0;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.3s ease;

  &.active {
    border-color: #48bb78;
    background: #f0fdf4;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .art-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .art-name {
    font-weight: bold;
    color: #2d3748;
  }

  .art-quality {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 2px;
  }

  .art-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
    font-size: 12px;

    .info-item {
      display: flex;
      justify-content: space-between;

      .label {
        color: #4a5568;
        font-weight: bold;
      }

      .value {
        color: #2d3748;
      }
    }
  }

  .art-status {
    text-align: center;
    font-size: 12px;
    padding: 4px;
    border-radius: 2px;
    background: #edf2f7;
    color: #4a5568;
  }
}

// 物品卡片
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.item-card {
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  padding: 10px;
  transition: all 0.3s ease;

  &.active {
    border-color: #f6ad55;
    background: #fffaf0;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .item-name {
    font-weight: bold;
    color: #2d3748;
  }

  .item-quality {
    font-size: 11px;
    padding: 2px 4px;
    border-radius: 2px;
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
    font-size: 12px;

    .info-item {
      display: flex;
      justify-content: space-between;

      .label {
        color: #4a5568;
        font-weight: bold;
      }

      .value {
        color: #2d3748;
      }
    }
  }

  .item-status {
    text-align: center;
    font-size: 11px;
    padding: 3px;
    border-radius: 2px;
    background: #edf2f7;
    color: #4a5568;
  }
}

// 灵石显示
.spirit-stone {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  padding: 20px;
  border-radius: 6px;
  text-align: center;
  border: 2px solid #daa520;

  .stone-count {
    font-size: 32px;
    font-weight: bold;
    color: #744210;
  }

  .stone-label {
    font-size: 14px;
    color: #744210;
    margin-top: 4px;
  }
}

// 关系列表
.relationships-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.npc-card {
  background: white;
  border: 2px solid #cbd5e0;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.3s ease;

  &.present {
    border-color: #48bb78;
    background: #f0fdf4;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .npc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 2px solid #cbd5e0;
    padding-bottom: 8px;
  }

  .npc-name {
    font-weight: bold;
    font-size: 16px;
    color: #2d3748;
  }

  .npc-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    background: #edf2f7;
    color: #4a5568;
  }

  .npc-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
    font-size: 12px;

    .info-item {
      display: flex;
      justify-content: space-between;

      .label {
        color: #4a5568;
        font-weight: bold;
      }

      .value {
        color: #2d3748;
        text-align: right;
        flex: 1;
        margin-left: 8px;

        &.positive {
          color: #38a169;
          font-weight: bold;
        }

        &.negative {
          color: #e53e3e;
          font-weight: bold;
        }
      }

      &.highlight {
        background: #fef3c7;
        padding: 4px;
        border-radius: 2px;

        .value {
          color: #d97706;
          font-weight: bold;
        }
      }
    }
  }

  .npc-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid #cbd5e0;

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 11px;

      .stat-label {
        color: #4a5568;
        margin-bottom: 2px;
      }

      .stat-value {
        font-weight: bold;
        color: #2d3748;
      }
    }
  }
}

// 品质标签
.art-quality,
.item-quality {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  font-weight: bold;

  &.quality-凡 {
    background: #cbd5e0;
    color: #4a5568;
  }

  &.quality-黄 {
    background: #ecc94b;
    color: #744210;
  }

  &.quality-玄 {
    background: #0bc5ea;
    color: #086f83;
  }

  &.quality-地 {
    background: #4299e1;
    color: #1a4a7b;
  }

  &.quality-天 {
    background: #805ad5;
    color: #3c1f70;
  }
}

// ===== 第一页紧凑布局样式 =====

// 顶部信息面板
.top-info-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
  padding: 8px;
  border-radius: 6px;
  font-size: 11px;
  flex-shrink: 0;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.character-name-large {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 1px;
}

.basic-info-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;

  .info-label {
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);

    &.danger {
      color: #ff6b6b;
    }
  }

  .info-value {
    color: white;

    &.danger {
      color: #ff6b6b;
      font-weight: bold;
    }
  }
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.realm-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;

  .info-label {
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);

    &.danger {
      color: #ff6b6b;
    }
  }

  .info-value {
    color: white;

    &.danger {
      color: #ff6b6b;
      font-weight: bold;
    }
  }
}

// 紧凑进度条
.progress-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;

  .progress-name {
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);
  }

  .progress-value {
    color: white;
    font-size: 9px;
  }
}

.progress-bar-compact {
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    background: linear-gradient(to right, #48bb78, #38a169);
    transition: width 0.3s ease;

    &.blood {
      background: linear-gradient(to right, #fc8181, #f56565);
    }

    &.spirit {
      background: linear-gradient(to right, #63b3ed, #4299e1);
    }
  }
}

// 紧凑部分
.compact-section {
  background: #edf2f7;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.section-title-compact {
  font-weight: bold;
  font-size: 13px;
  color: #2d3748;
  margin-bottom: 6px;
  border-bottom: 1px solid #cbd5e0;
  padding-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.collapsible {
    cursor: pointer;
    user-select: none;

    &:hover {
      color: #667eea;
    }
  }

  .collapse-icon {
    font-size: 10px;
    transition: transform 0.2s ease;
  }
}

// 灵根与体质紧凑
.root-constitution-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.root-info-compact,
.constitution-info-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .label {
    font-weight: bold;
    color: #4a5568;
    min-width: 40px;
  }

  .value {
    color: #2d3748;
    font-weight: bold;
  }

  .element-tag-compact {
    background: #667eea;
    color: white;
    padding: 1px 4px;
    border-radius: 8px;
    font-size: 10px;
  }

  .attr-compact {
    background: white;
    padding: 2px 4px;
    border-radius: 2px;
    color: #2d3748;
    font-size: 11px;
  }
}

// 技艺紧凑
.skills-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .skill-category-label {
    font-weight: bold;
    color: #4a5568;
    min-width: 35px;
  }

  .skill-compact {
    background: white;
    padding: 2px 4px;
    border-radius: 2px;
    color: #2d3748;
    font-size: 11px;
  }
}

// 状态效果详细显示
.effects-detailed {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.effect-detailed-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  border-radius: 3px;
  border: 1px solid;
  background: white;
  font-size: 10px;

  &.增益 {
    background: #f0fdf4;
    border-color: #38a169;
  }

  &.减益 {
    background: #fef2f2;
    border-color: #e53e3e;
  }

  &.特殊 {
    background: #f8fafc;
    border-color: #4a5568;
  }

  .effect-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 3px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding-bottom: 2px;
  }

  .effect-name {
    font-weight: bold;
    color: #2d3748;
    flex: 1;
    font-size: 10px;
  }

  .effect-type-badge {
    font-size: 8px;
    font-weight: bold;
    padding: 0px 3px;
    border-radius: 2px;
    white-space: nowrap;

    .增益 & {
      background: #38a169;
      color: white;
    }

    .减益 & {
      background: #e53e3e;
      color: white;
    }

    .特殊 & {
      background: #4a5568;
      color: white;
    }
  }

  .effect-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .effect-row {
    display: flex;
    gap: 3px;
    align-items: flex-start;
    font-size: 9px;
  }

  .effect-label {
    font-weight: bold;
    color: #4a5568;
    min-width: 35px;
    flex-shrink: 0;
  }

  .effect-value {
    color: #2d3748;
    flex: 1;
    word-break: break-word;
    line-height: 1.3;
  }
}

// 状态效果紧凑（保留以兼容）
.effects-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.effect-compact {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 10px;
  border: 1px solid;

  &.增益 {
    background: #c6f6d5;
    border-color: #38a169;
    color: #22543d;
  }

  &.减益 {
    background: #fed7d7;
    border-color: #e53e3e;
    color: #742a2a;
  }

  &.特殊 {
    background: #e2e8f0;
    border-color: #4a5568;
    color: #2d3748;
  }

  .effect-name {
    font-weight: bold;
  }

  .effect-type {
    font-size: 9px;
    opacity: 0.7;
  }

  .effect-layer {
    font-weight: bold;
  }

  .effect-time {
    font-size: 9px;
    opacity: 0.7;
  }
}

// ===== 详情切换区域 =====

.detail-section {
  background: #edf2f7;
  padding: 6px;
  border-radius: 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.detail-title {
  font-weight: bold;
  font-size: 12px;
  color: #2d3748;
  flex: 1;
  text-align: center;
}

.nav-arrow {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 3px 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: bold;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #5568d3;
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 2px;

    &:hover {
      background: #a0aec0;
    }
  }
}

.no-effects {
  text-align: center;
  color: #718096;
  font-size: 12px;
  padding: 20px 0;
}

// 状态效果简化显示（在时间下方）
.status-effects-brief {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}

.effect-brief-tag {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);

  &.增益 {
    background: rgba(76, 175, 80, 0.3);
    border-color: rgba(76, 175, 80, 0.5);
  }

  &.减益 {
    background: rgba(244, 67, 54, 0.3);
    border-color: rgba(244, 67, 54, 0.5);
  }

  &.特殊 {
    background: rgba(33, 150, 243, 0.3);
    border-color: rgba(33, 150, 243, 0.5);
  }
}

// ===== 第二页 存储空间与功法样式 =====

.page-2 {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.storage-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 8px;
  height: 100%;
  min-height: 0;
  grid-auto-rows: 1fr;
}

// 左侧：物品网格
.inventory-panel {
  background: #2d3748;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  min-height: 0;
  min-width: 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #4a5568;
    border-radius: 2px;

    &:hover {
      background: #718096;
    }
  }
}

.inventory-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 13px;
  color: white;
  padding: 4px;
  border-bottom: 1px solid #4a5568;
}

.spirit-stone-badge {
  font-size: 11px;
  background: #ecc94b;
  color: #744210;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
}

.inventory-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.inventory-category {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-label {
  font-size: 11px;
  font-weight: bold;
  color: #cbd5e0;
  padding: 2px 4px;
}

.item-icons {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  padding: 3px 4px;
  background: #4a5568;
  border: 1px solid #718096;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 9px;
  min-height: 20px;
  overflow: hidden;

  &:hover {
    background: #5a6578;
    border-color: #a0aec0;
  }

  &.selected {
    background: #667eea;
    border-color: #667eea;
    box-shadow: 0 0 6px rgba(102, 126, 234, 0.5);
  }

  &.active {
    border-color: #48bb78;
    box-shadow: 0 0 6px rgba(72, 187, 120, 0.5);
  }

  &.active.selected {
    border-color: #48bb78;
    background: #667eea;
    box-shadow: 0 0 10px rgba(72, 187, 120, 0.7);
  }
}

.icon-symbol {
  font-size: 14px;
  flex-shrink: 0;
}

.icon-label {
  color: #cbd5e0;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

// 中间和右侧：详情面板
.detail-panel {
  background: #edf2f7;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  min-width: 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 2px;

    &:hover {
      background: #a0aec0;
    }
  }
}

.item-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.detail-header {
  border-bottom: 2px solid #cbd5e0;
  padding-bottom: 6px;
}

.detail-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-title {
  font-size: 14px;
  font-weight: bold;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.2);
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.95);
  }
}

.toggle-switch-compact {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 18px;
  flex-shrink: 0;
  margin-left: auto;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider-compact {
      background-color: #48bb78;

      &:before {
        transform: translateX(16px);
      }
    }
  }
}

.slider-compact {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e0;
  transition: 0.3s;
  border-radius: 18px;

  &:before {
    position: absolute;
    content: '';
    height: 14px;
    width: 14px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
}

.tag {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 4px;
  background: white;
  border-radius: 3px;
  border: 1px solid #e2e8f0;
}

.info-row .label {
  font-weight: bold;
  color: #4a5568;
  min-width: 60px;
}

.info-row .value {
  color: #2d3748;
  text-align: right;
  flex: 1;
}

.section-label {
  font-weight: bold;
  color: #2d3748;
  font-size: 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid #cbd5e0;
  padding-bottom: 2px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.tags-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: bold;
  flex-shrink: 0;
  white-space: nowrap;
}

.effect-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: white;
  border-radius: 3px;
  border: 1px solid #e2e8f0;
  font-size: 11px;
}

.effect-name {
  font-weight: bold;
  color: #4a5568;
}

.effect-desc {
  color: #2d3748;
  word-break: break-word;
}

.toggle-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #cbd5e0;
}

.toggle-label-text {
  font-weight: bold;
  color: #2d3748;
  font-size: 12px;
}

// App开关样式
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background-color: #48bb78;

      &:before {
        transform: translateX(20px);
      }
    }
  }
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e0;
  transition: 0.3s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.no-selection-text {
  color: #a0aec0;
  font-size: 12px;
  text-align: center;
}

.rpg-equipment-layout {
  display: none;
}

// 左侧：背包
.inventory-panel {
  background: #2d3748;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #4a5568;
    border-radius: 2px;

    &:hover {
      background: #718096;
    }
  }
}

.inventory-title {
  font-weight: bold;
  font-size: 13px;
  color: white;
  padding: 4px;
  border-bottom: 1px solid #4a5568;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .spirit-stone-badge {
    font-size: 11px;
    background: rgba(255, 215, 0, 0.2);
    padding: 2px 6px;
    border-radius: 3px;
    color: #ffd700;
  }
}

.inventory-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.inventory-category {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-label {
  font-size: 11px;
  font-weight: bold;
  color: #cbd5e0;
  padding: 2px 4px;
}

.item-icons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.item-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px;
  background: #4a5568;
  border: 2px solid #718096;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #5a6578;
    border-color: #a0aec0;
    transform: scale(1.05);
  }

  &.selected {
    background: #667eea;
    border-color: #ffd700;
    box-shadow: 0 0 8px rgba(102, 126, 234, 0.6);
  }

  .icon-symbol {
    font-size: 16px;
  }

  .icon-label {
    font-size: 9px;
    color: #cbd5e0;
    text-align: center;
    word-break: break-all;
  }
}

.spirit-stone-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: #4a5568;
  border: 2px solid #718096;
  border-radius: 4px;

  .stone-icon {
    font-size: 20px;
  }

  .stone-count {
    font-size: 12px;
    font-weight: bold;
    color: #ffd700;
  }
}

// 中间：物品详情
.detail-panel {
  background: #edf2f7;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 2px;

    &:hover {
      background: #a0aec0;
    }
  }
}

.item-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-header {
  padding: 6px;
  background: #667eea;
  color: white;
  border-radius: 4px;
}

.detail-title {
  font-weight: bold;
  font-size: 12px;
}

.detail-content-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: white;
  border-radius: 3px;
  font-size: 11px;

  .label {
    font-weight: bold;
    color: #4a5568;
    min-width: 50px;
  }

  .value {
    color: #2d3748;
    text-align: right;
    flex: 1;
  }
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #718096;
  font-size: 12px;
}

.no-selection-text {
  text-align: center;
}

// 右侧：装备栏
.equipment-panel {
  background: #2d3748;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.equipment-title {
  font-weight: bold;
  font-size: 13px;
  color: white;
  text-align: center;
  padding: 4px;
  border-bottom: 1px solid #4a5568;
}

// 装备栏主体
.equipment-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipment-top,
.equipment-middle,
.equipment-bottom {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.slot-label {
  font-size: 10px;
  font-weight: bold;
  color: #cbd5e0;
  min-width: 25px;
  text-align: center;
}

.slot-box {
  flex: 1;
  height: 32px;
  background: #4a5568;
  border: 2px solid #718096;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: #cbd5e0;

  &:hover {
    background: #5a6578;
    border-color: #a0aec0;
  }

  &.equipped {
    background: #667eea;
    border-color: #ffd700;
    color: #ffd700;
    box-shadow: 0 0 6px rgba(102, 126, 234, 0.4);
  }

  .slot-content {
    color: #ffd700;
    font-weight: bold;
  }

  .slot-empty {
    color: #718096;
    opacity: 0.6;
  }
}

// 删除确认对话框
.delete-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.delete-confirm-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 400px;
  overflow: hidden;
}

.confirm-header {
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
  padding: 16px;
  font-weight: bold;
  font-size: 16px;
}

.confirm-body {
  padding: 20px;
  color: #2d3748;
  font-size: 14px;

  p {
    margin: 0 0 8px 0;
    line-height: 1.5;

    strong {
      color: #e53e3e;
      font-weight: bold;
    }

    &.confirm-warning {
      color: #e53e3e;
      font-size: 12px;
      margin-top: 12px;
    }
  }
}

.confirm-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #cbd5e0;
  color: #2d3748;

  &:hover {
    background: #a0aec0;
  }

  &:active {
    transform: scale(0.98);
  }
}

.btn-confirm {
  background: #e53e3e;
  color: white;

  &:hover {
    background: #c53030;
  }

  &:active {
    transform: scale(0.98);
  }
}

// 第三页：关系列表
.page-3 {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.relationships-container {
  display: flex;
  gap: 12px;
  height: 100%;
  overflow: hidden;
}

// 左侧：人物列表
.npc-list-panel {
  width: 200px;
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.list-header {
  padding: 12px;
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;

  h3 {
    margin: 0;
    font-size: 14px;
  }

  .count {
    background: rgba(255, 255, 255, 0.3);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
  }
}

.npc-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f4f8;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;

    &:hover {
      background: #a0aec0;
    }
  }
}

.npc-list-item {
  padding: 10px;
  margin-bottom: 6px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  &.active {
    background: linear-gradient(to right, #667eea, #764ba2);
    color: white;
    border-color: #667eea;
    font-weight: bold;

    .npc-list-status {
      background: rgba(255, 255, 255, 0.3);
      color: white;
    }
  }

  &.present {
    border-left: 3px solid #48bb78;
  }
}

.npc-list-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.npc-list-status {
  font-size: 11px;
  background: #e2e8f0;
  color: #4a5568;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

// 右侧：人物详情
.npc-detail-panel {
  flex: 1;
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.detail-header {
  padding: 12px;
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-weight: bold;
    font-size: 16px;
  }
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.delete-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f4f8;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;

    &:hover {
      background: #a0aec0;
    }
  }
}

.info-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
}

.section-title {
  font-weight: bold;
  font-size: 14px;
  color: #2d3748;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid #667eea;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-weight: bold;
    color: #4a5568;
    font-size: 12px;
  }

  .value {
    color: #2d3748;
    font-size: 13px;
    word-break: break-word;
  }
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.effect-item {
  padding: 10px;
  background: #f7fafc;
  border-left: 3px solid #cbd5e0;
  border-radius: 4px;

  &.增益 {
    border-left-color: #48bb78;
    background: rgba(72, 187, 120, 0.05);
  }

  &.减益 {
    border-left-color: #e53e3e;
    background: rgba(229, 62, 62, 0.05);
  }

  &.特殊 {
    border-left-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }
}

.effect-name {
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 4px;
}

.effect-type {
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  margin-bottom: 4px;

  .增益 & {
    background: #c6f6d5;
    color: #22543d;
  }

  .减益 & {
    background: #fed7d7;
    color: #742a2a;
  }

  .特殊 & {
    background: #dbeafe;
    color: #1e3a8a;
  }
}

.effect-info {
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 6px;
}

.effect-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #718096;

  span {
    display: flex;
    gap: 4px;
  }
}

.arts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.art-item {
  padding: 12px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.art-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.art-name {
  font-weight: bold;
  color: #2d3748;
  flex: 1;
}

.art-type {
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;

  &.心法 {
    background: #dbeafe;
    color: #1e3a8a;
  }

  &.攻击 {
    background: #fed7d7;
    color: #742a2a;
  }

  &.咒法 {
    background: #fce7f3;
    color: #831843;
  }

  &.身法 {
    background: #ddd6fe;
    color: #3730a3;
  }

  &.护体 {
    background: #c6f6d5;
    color: #22543d;
  }

  &.其他 {
    background: #f3e8ff;
    color: #581c87;
  }
}

.art-quality {
  font-size: 12px;
  color: #718096;
  background: #edf2f7;
  padding: 2px 6px;
  border-radius: 3px;
}

.art-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  gap: 8px;
  font-size: 13px;

  .label {
    font-weight: bold;
    color: #4a5568;
    min-width: 60px;
  }

  .value {
    color: #2d3748;
    flex: 1;
    word-break: break-word;

    &.positive {
      color: #48bb78;
      font-weight: bold;
    }

    &.negative {
      color: #e53e3e;
      font-weight: bold;
    }
  }

  &.full-width {
    flex-direction: column;
  }

  &.highlight {
    background: rgba(102, 126, 234, 0.1);
    padding: 4px 8px;
    border-radius: 3px;
  }
}

// 紧凑布局样式
.info-section.compact {
  margin-bottom: 12px;
  padding-bottom: 12px;
}

.subsection-title {
  font-weight: bold;
  font-size: 12px;
  color: #4a5568;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #cbd5e0;
}

.compact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;

  .info-row {
    font-size: 12px;
    gap: 4px;

    .label {
      min-width: 50px;
      font-size: 11px;
    }

    .value {
      font-size: 12px;
    }

    &.full-width {
      grid-column: 1 / -1;
      flex-direction: row;
      gap: 6px;
      align-items: center;
      padding: 4px 0;
      min-height: auto;

      .label {
        font-weight: bold;
        min-width: auto;
        flex-shrink: 0;
      }

      .value {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
      }
    }
  }
}

// 状态效果紧凑显示
.effects-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.effect-compact {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  background: #f7fafc;
  border-left: 2px solid #cbd5e0;
  border-radius: 3px;
  font-size: 12px;

  &.增益 {
    border-left-color: #48bb78;
    background: rgba(72, 187, 120, 0.08);
  }

  &.减益 {
    border-left-color: #e53e3e;
    background: rgba(229, 62, 62, 0.08);
  }

  &.特殊 {
    border-left-color: #667eea;
    background: rgba(102, 126, 234, 0.08);
  }

  .effect-name {
    font-weight: bold;
    color: #2d3748;
    min-width: 60px;
  }

  .effect-type {
    font-size: 10px;
    font-weight: bold;
    padding: 1px 4px;
    border-radius: 2px;
    white-space: nowrap;

    .增益 & {
      background: #c6f6d5;
      color: #22543d;
    }

    .减益 & {
      background: #fed7d7;
      color: #742a2a;
    }

    .特殊 & {
      background: #dbeafe;
      color: #1e3a8a;
    }
  }

  .effect-info {
    flex: 1;
    color: #4a5568;
  }

  .effect-meta {
    color: #718096;
    font-size: 11px;
    white-space: nowrap;
  }
}

// 功法紧凑显示
.arts-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.art-compact {
  padding: 8px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
}

.art-compact-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.art-name {
  font-weight: bold;
  color: #2d3748;
  font-size: 12px;
}

.art-type {
  font-size: 10px;
  font-weight: bold;
  padding: 1px 4px;
  border-radius: 2px;
  white-space: nowrap;

  &.心法 {
    background: #dbeafe;
    color: #1e3a8a;
  }

  &.攻击 {
    background: #fed7d7;
    color: #742a2a;
  }

  &.咒法 {
    background: #fce7f3;
    color: #831843;
  }

  &.身法 {
    background: #ddd6fe;
    color: #3730a3;
  }

  &.护体 {
    background: #c6f6d5;
    color: #22543d;
  }

  &.其他 {
    background: #f3e8ff;
    color: #581c87;
  }
}

.art-quality {
  font-size: 10px;
  color: #718096;
  background: #edf2f7;
  padding: 1px 4px;
  border-radius: 2px;
}

.art-compact-info {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #4a5568;
  flex-wrap: wrap;

  span {
    background: #edf2f7;
    padding: 2px 4px;
    border-radius: 2px;
  }
}

.art-compact-desc {
  font-size: 11px;
  color: #718096;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #e2e8f0;
}

// 储物空间子分类
.storage-subsection {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.storage-subsection-title {
  font-size: 12px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 8px;
}

// 物品紧凑显示
.items-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-compact {
  padding: 6px;
  background: #fffaf0;
  border: 1px solid #fed7d7;
  border-radius: 3px;
}

.item-compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.item-name {
  font-weight: bold;
  color: #2d3748;
  font-size: 12px;
}

.item-quantity {
  font-size: 10px;
  color: #718096;
  background: #edf2f7;
  padding: 1px 4px;
  border-radius: 2px;
}

.item-compact-info {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: #4a5568;
  flex-wrap: wrap;

  span {
    background: #edf2f7;
    padding: 1px 3px;
    border-radius: 2px;
  }
}

.item-compact-desc {
  font-size: 10px;
  color: #718096;
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px solid #fed7d7;
}

// 法宝紧凑显示
.treasures-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.treasure-compact {
  padding: 6px;
  background: #f0fdf4;
  border: 1px solid #c6f6d5;
  border-radius: 3px;
}

.treasure-compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.treasure-name {
  font-weight: bold;
  color: #2d3748;
  font-size: 12px;
}

.treasure-quality {
  font-size: 10px;
  color: #718096;
  background: #edf2f7;
  padding: 1px 4px;
  border-radius: 2px;
}

.treasure-compact-info {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: #4a5568;
  flex-wrap: wrap;

  span {
    background: #edf2f7;
    padding: 1px 3px;
    border-radius: 2px;
  }
}

.treasure-compact-desc {
  font-size: 10px;
  color: #718096;
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px solid #c6f6d5;
}

// 傀儡紧凑显示
.puppets-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.puppet-compact {
  padding: 6px;
  background: #f3e8ff;
  border: 1px solid #e9d5ff;
  border-radius: 3px;
}

.puppet-compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.puppet-name {
  font-weight: bold;
  color: #2d3748;
  font-size: 12px;
}

.puppet-quality {
  font-size: 10px;
  color: #718096;
  background: #edf2f7;
  padding: 1px 4px;
  border-radius: 2px;
}

.puppet-compact-info {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: #4a5568;
  flex-wrap: wrap;

  span {
    background: #edf2f7;
    padding: 1px 3px;
    border-radius: 2px;
  }
}

.puppet-compact-desc {
  font-size: 10px;
  color: #718096;
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px solid #e9d5ff;
}

// 灵兽紧凑显示
.beasts-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.beast-compact {
  padding: 6px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 3px;
}

.beast-compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.beast-name {
  font-weight: bold;
  color: #2d3748;
  font-size: 12px;
}

.beast-quality {
  font-size: 10px;
  color: #718096;
  background: #edf2f7;
  padding: 1px 4px;
  border-radius: 2px;
}

.beast-compact-info {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: #4a5568;
  flex-wrap: wrap;

  span {
    background: #edf2f7;
    padding: 1px 3px;
    border-radius: 2px;
  }
}

.beast-compact-desc {
  font-size: 10px;
  color: #718096;
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px solid #fcd34d;
}
</style>
