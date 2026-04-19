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
          <div v-if="!_.isEmpty(store.data.基本信息.状态效果)" class="effects-compact">
            <div
              v-for="(effect, name) in store.data.基本信息.状态效果"
              :key="name"
              class="effect-compact"
              :class="effect.类型.toLowerCase()"
            >
              <span class="effect-name">{{ name }}</span>
              <span class="effect-type">{{ effect.类型 }}</span>
              <span v-if="effect.层数 > 1" class="effect-layer">x{{ effect.层数 }}</span>
              <span class="effect-time">{{ effect.剩余时间 }}</span>
            </div>
          </div>
          <div v-else class="no-effects">暂无状态效果</div>
        </div>
      </div>
    </div>

    <!-- 第二页：RPG装备栏 -->
    <div v-if="state.currentPage === 1" class="page-content page-2">
      <div class="rpg-equipment-layout">
        <!-- 左侧：背包 -->
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
                  v-for="name in Object.keys(store.data.储物空间?.法宝 || {})"
                  :key="`treasure-${name}`"
                  class="item-icon"
                  :class="{ selected: state.selectedItem?.type === 'treasure' && state.selectedItem?.name === name }"
                  :title="name"
                  @click="state.selectedItem = { type: 'treasure', name }"
                >
                  <div class="icon-symbol">⚔️</div>
                  <div class="icon-label">{{ name.substring(0, 2) }}</div>
                </div>
              </div>
            </div>

            <!-- 灵兽 -->
            <div class="inventory-category">
              <div class="category-label">🐉 灵兽</div>
              <div class="item-icons">
                <div
                  v-for="name in Object.keys(store.data.储物空间?.灵兽 || {})"
                  :key="`beast-${name}`"
                  class="item-icon"
                  :class="{ selected: state.selectedItem?.type === 'beast' && state.selectedItem?.name === name }"
                  :title="name"
                  @click="state.selectedItem = { type: 'beast', name }"
                >
                  <div class="icon-symbol">🐉</div>
                  <div class="icon-label">{{ name.substring(0, 2) }}</div>
                </div>
              </div>
            </div>

            <!-- 傀儡 -->
            <div class="inventory-category">
              <div class="category-label">🤖 傀儡</div>
              <div class="item-icons">
                <div
                  v-for="name in Object.keys(store.data.储物空间?.傀儡 || {})"
                  :key="`puppet-${name}`"
                  class="item-icon"
                  :class="{ selected: state.selectedItem?.type === 'puppet' && state.selectedItem?.name === name }"
                  :title="name"
                  @click="state.selectedItem = { type: 'puppet', name }"
                >
                  <div class="icon-symbol">🤖</div>
                  <div class="icon-label">{{ name.substring(0, 2) }}</div>
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
                  <div class="icon-label">{{ name.substring(0, 2) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：物品详情 -->
        <div class="detail-panel">
          <div v-if="state.selectedItem" class="item-detail">
            <div class="detail-header">
              <div class="detail-title">
                {{
                  state.selectedItem.type === 'treasure'
                    ? store.data.储物空间.法宝[state.selectedItem.name]?.品质
                    : state.selectedItem.type === 'beast'
                      ? store.data.储物空间.灵兽[state.selectedItem.name]?.品质
                      : state.selectedItem.type === 'puppet'
                        ? store.data.储物空间.傀儡[state.selectedItem.name]?.品质
                        : store.data.储物空间.物品[state.selectedItem.name]?.品质
                }}品
                {{ state.selectedItem.name }}
              </div>
            </div>
            <div class="detail-content-info">
              <!-- 法宝详情 -->
              <template
                v-if="state.selectedItem.type === 'treasure' && store.data.储物空间.法宝[state.selectedItem.name]"
              >
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
              </template>

              <!-- 灵兽详情 -->
              <template v-if="state.selectedItem.type === 'beast' && store.data.储物空间.灵兽[state.selectedItem.name]">
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
              </template>

              <!-- 傀儡详情 -->
              <template
                v-if="state.selectedItem.type === 'puppet' && store.data.储物空间.傀儡[state.selectedItem.name]"
              >
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
              </template>

              <!-- 物品详情 -->
              <template v-if="state.selectedItem.type === 'item' && store.data.储物空间.物品[state.selectedItem.name]">
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
              </template>
            </div>
          </div>
          <div v-else class="no-selection">
            <div class="no-selection-text">点击左侧物品查看详情</div>
          </div>
        </div>

        <!-- 右侧：装备栏（暗黑破坏神2风格） -->
        <div class="equipment-panel">
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
    <div v-if="state.currentPage === 2" class="page-content">
      <div class="section">
        <div class="section-title">
          关系列表 ({{ store.data.关系列表 ? Object.keys(store.data.关系列表).length : 0 }})
        </div>
        <div class="relationships-grid">
          <div v-for="(npc, name) in store.data.关系列表" :key="name" class="npc-card" :class="{ present: npc.在场 }">
            <div class="npc-header">
              <div class="npc-name">{{ name }}</div>
              <div class="npc-status">{{ npc.在场 ? '在场' : '不在场' }}</div>
            </div>
            <div class="npc-info">
              <div class="info-item">
                <span class="label">身份:</span>
                <span class="value">{{ npc.身份?.join(', ') || '未知' }}</span>
              </div>
              <div class="info-item">
                <span class="label">境界:</span>
                <span class="value">{{ npc.境界 }}</span>
              </div>
              <div class="info-item">
                <span class="label">寿元:</span>
                <span class="value">{{ npc.寿元?.年龄 ?? 0 }}/{{ npc.寿元?.寿命 ?? 0 }}岁</span>
              </div>
              <div class="info-item">
                <span class="label">灵根:</span>
                <span class="value">{{ npc.灵根 }}</span>
              </div>
              <div class="info-item">
                <span class="label">体质:</span>
                <span class="value">{{ npc.体质 }}</span>
              </div>
              <div class="info-item">
                <span class="label">性格:</span>
                <span class="value">{{ npc.性格 }}</span>
              </div>
              <div class="info-item">
                <span class="label">外貌:</span>
                <span class="value">{{ npc.外貌 }}</span>
              </div>
              <div class="info-item">
                <span class="label">着装:</span>
                <span class="value">{{ npc.着装 }}</span>
              </div>
              <div class="info-item">
                <span class="label">好感度:</span>
                <span class="value" :class="{ positive: npc.好感度 > 0, negative: npc.好感度 < 0 }"
                  >{{ npc.好感度 > 0 ? '+' : '' }}{{ npc.好感度 }}</span
                >
              </div>
              <div v-if="npc.道侣" class="info-item highlight">
                <span class="label">道侣:</span>
                <span class="value">是</span>
              </div>
            </div>
            <div class="npc-stats">
              <div class="stat">
                <span class="stat-label">气血:</span>
                <span class="stat-value">{{ npc.状态?.气血?.现值 ?? 0 }}/{{ npc.状态?.气血?.上限 ?? 0 }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">灵力:</span>
                <span class="stat-value">{{ npc.状态?.灵力?.现值 ?? 0 }}/{{ npc.状态?.灵力?.上限 ?? 0 }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">遁速:</span>
                <span class="stat-value">{{ npc.状态?.遁速 ?? 0 }} m/s</span>
              </div>
            </div>
          </div>
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
  gap: 12px;
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.character-name-large {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 2px;
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
  gap: 4px;
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
  gap: 2px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;

  .progress-name {
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);
  }

  .progress-value {
    color: white;
    font-size: 10px;
  }
}

.progress-bar-compact {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
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

// 状态效果紧凑
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
  padding: 8px;
  border-radius: 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.detail-title {
  font-weight: bold;
  font-size: 13px;
  color: #2d3748;
  flex: 1;
  text-align: center;
}

.nav-arrow {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
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
  gap: 6px;

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

// ===== 第二页 RPG 装备栏样式 =====

.page-2 {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.rpg-equipment-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 8px;
  height: 100%;
  min-height: 0;
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
</style>
