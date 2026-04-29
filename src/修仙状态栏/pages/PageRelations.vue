<template>
  <section class="xy-page xy-page-relations">
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
              <span
                v-if="npc.在场 || state.editMode"
                class="xy-npc-online"
                :class="{ 'xy-bool-toggle': state.editMode, 'xy-bool-off': state.editMode && !npc.在场 }"
                :title="state.editMode ? '点击切换 在场' : ''"
                @click.stop="state.editMode && (npc.在场 = !npc.在场)"
              >在场</span>
            </div>
            <div class="xy-npc-line2">
              <span class="xy-npc-race">{{ npc.种族 }}</span>
              <span v-if="npc.身份 && npc.身份.length">·</span>
              <span v-for="id in npc.身份" :key="id" class="xy-npc-id">{{ id }}</span>
              <span
                v-if="npc.元阳 || state.editMode"
                class="xy-npc-yang"
                :class="{ 'xy-bool-toggle': state.editMode, 'xy-bool-off': state.editMode && !npc.元阳 }"
                :title="state.editMode ? '点击切换 元阳' : ''"
                @click.stop="state.editMode && (npc.元阳 = !npc.元阳)"
              >元阳</span>
              <span
                v-if="npc.元阴 || state.editMode"
                class="xy-npc-yin"
                :class="{ 'xy-bool-toggle': state.editMode, 'xy-bool-off': state.editMode && !npc.元阴 }"
                :title="state.editMode ? '点击切换 元阴' : ''"
                @click.stop="state.editMode && (npc.元阴 = !npc.元阴)"
              >元阴</span>
              <span
                v-if="npc.道侣 || state.editMode"
                class="xy-npc-couple"
                :class="{ 'xy-bool-toggle': state.editMode, 'xy-bool-off': state.editMode && !npc.道侣 }"
                :title="state.editMode ? '点击切换 道侣' : ''"
                @click.stop="state.editMode && (npc.道侣 = !npc.道侣)"
              >道侣</span>
            </div>
          </div>
          <div class="xy-favor" :class="favorClass(npc.好感度)">
            <div class="xy-favor-num">
              <EditableValue v-model.number="npc.好感度" type="number" label="好感度" :min="-100" :max="100" />
            </div>
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
              <p>
                <EditableValue v-if="npc.寿元" v-model.number="npc.寿元.年龄" type="number" label="年龄" :min="0" /> /
                <EditableValue v-if="npc.寿元" v-model.number="npc.寿元.寿命" type="number" label="寿命" :min="1" />
                <small v-if="npc.寿元">貌 <EditableValue v-model.number="npc.寿元.外观年龄" type="number" label="外观年龄" :min="0" /></small>
              </p>
            </div>
            <div class="xy-mini">
              <h4>灵根</h4>
              <p>
                <span><EditableValue v-if="npc.灵根" v-model="npc.灵根.名称" label="灵根名称" :format="(v) => v || '未检测'" /></span>
                <span v-for="el in npc.灵根?.五行 || []" :key="el" class="xy-element xy-element-mini" :style="{ '--el': elColor(el) }">{{ el === '未知' ? '未' : el }}</span>
              </p>
            </div>
            <div class="xy-mini">
              <h4>体质</h4>
              <p>
                <EditableValue v-if="npc.体质" v-model="npc.体质.名称" label="体质名称" />
                <small v-if="npc.体质">
                  悟<EditableValue v-model.number="npc.体质.悟性" type="number" label="悟性" :min="0" />/骨<EditableValue v-model.number="npc.体质.根骨" type="number" label="根骨" :min="0" />/感<EditableValue v-model.number="npc.体质.气感" type="number" label="气感" :min="0" />
                </small>
              </p>
            </div>
            <div class="xy-mini">
              <h4>境界</h4>
              <p>
                <EditableValue v-if="npc.修炼进度" v-model="npc.修炼进度.境界" label="境界" />
                <small v-if="npc.修炼进度">
                  <EditableValue v-model.number="npc.修炼进度.当前进度" type="number" label="当前进度" :min="0" />/<EditableValue v-model.number="npc.修炼进度.进度上限" type="number" label="进度上限" :min="1" />
                </small>
              </p>
            </div>
          </div>

          <!-- 体质效果 -->
          <div v-if="(npc.体质 && (!_.isEmpty(npc.体质.效果) || state.editMode))" class="xy-effect-list xy-npc-effects">
            <EffectList v-model="npc.体质.效果" />
          </div>

          <!-- 资源池 -->
          <div v-if="npc.资源池" class="xy-mini-block">
            <h4>资源池</h4>
            <div class="xy-npc-bars">
              <div v-if="npc.资源池.气血" class="xy-unit-bar">
                <span class="xy-unit-bar-label">气血</span>
                <span class="xy-unit-bar-track">
                  <span class="xy-unit-bar-fill blood" :style="{ width: npcBarPct(npc.资源池.气血) + '%' }" />
                </span>
                <span class="xy-unit-bar-num">
                  <EditableValue v-model.number="npc.资源池.气血.现值" type="number" label="气血现值" :min="0" />/<EditableValue v-model.number="npc.资源池.气血.上限" type="number" label="气血上限" :min="1" />
                </span>
              </div>
              <div v-if="npc.资源池.灵力" class="xy-unit-bar">
                <span class="xy-unit-bar-label">灵力</span>
                <span class="xy-unit-bar-track">
                  <span class="xy-unit-bar-fill spirit" :style="{ width: npcBarPct(npc.资源池.灵力) + '%' }" />
                </span>
                <span class="xy-unit-bar-num">
                  <EditableValue v-model.number="npc.资源池.灵力.现值" type="number" label="灵力现值" :min="0" />/<EditableValue v-model.number="npc.资源池.灵力.上限" type="number" label="灵力上限" :min="1" />
                </span>
              </div>
              <div class="xy-unit-bar">
                <span class="xy-unit-bar-label">遁速</span>
                <span class="xy-unit-bar-num xy-bar-solo">
                  <EditableValue v-model.number="npc.资源池.遁速" type="number" label="遁速" :min="0" /> m/s
                </span>
              </div>
            </div>
          </div>

          <!-- 技艺 -->
          <div v-if="hasSkills(npc)" class="xy-mini-block">
            <h4>技艺</h4>
            <div class="xy-npc-skills">
              <div v-if="!_.isEmpty(npc.技艺?.生产类)" class="xy-npc-skills-row">
                <span class="xy-npc-skills-tag xy-pill-soft">生产</span>
                <span v-for="(v, n) in npc.技艺?.生产类" :key="'p-'+n" class="xy-npc-skill" :class="{ dim: !v }" :title="`${n}：${v} / ${formatSkillNum(skillCap(npc.修炼进度?.境界 || ''))}`">
                  {{ n }}<em>
                    <EditableValue
                      :model-value="v"
                      type="number"
                      :label="String(n)"
                      :min="0"
                      :format="formatSkillNum"
                      @update:model-value="npc.技艺.生产类[n] = Number($event)"
                    />
                  </em>
                </span>
              </div>
              <div v-if="!_.isEmpty(npc.技艺?.战斗类)" class="xy-npc-skills-row">
                <span class="xy-npc-skills-tag xy-pill-cost">战斗</span>
                <span v-for="(v, n) in npc.技艺?.战斗类" :key="'c-'+n" class="xy-npc-skill" :class="{ dim: !v }" :title="`${n}：${v} / ${formatSkillNum(skillCap(npc.修炼进度?.境界 || ''))}`">
                  {{ n }}<em>
                    <EditableValue
                      :model-value="v"
                      type="number"
                      :label="String(n)"
                      :min="0"
                      :format="formatSkillNum"
                      @update:model-value="npc.技艺.战斗类[n] = Number($event)"
                    />
                  </em>
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
                <button
                  type="button"
                  class="xy-trash"
                  title="删除此状态"
                  @click.stop="requestDelete('npc-buff', `${name}::${ename}`, String(ename))"
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                    <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                  </svg>
                </button>
                <div class="xy-buff-head">
                  <span class="xy-buff-name">{{ ename }}</span>
                  <span class="xy-buff-tag">{{ eff.类型 }}</span>
                  <span v-if="eff.层数 > 1" class="xy-buff-stack">x{{ eff.层数 }}</span>
                  <span class="xy-buff-time">{{ eff.剩余时间 }}</span>
                </div>
                <div v-if="!_.isEmpty(eff.效果) || state.editMode" class="xy-buff-effects">
                  <EffectList v-model="eff.效果" line-class="xy-buff-effect" />
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
                <button
                  type="button"
                  class="xy-trash"
                  title="删除此功法"
                  @click.stop="requestDelete('npc-art', `${name}::${aname}`, String(aname))"
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                    <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                  </svg>
                </button>
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
                  <span v-if="art.消耗 || state.editMode" class="xy-pill xy-pill-cost">耗 <EditableValue v-model="art.消耗" label="消耗" /></span>
                </div>
                <div v-if="art.描述 || state.editMode" class="xy-art-desc"><EditableValue v-model="art.描述" label="描述" multiline /></div>
                <div v-if="!_.isEmpty(art.效果) || state.editMode" class="xy-effect-list">
                  <EffectList v-model="art.效果" />
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
                <span class="xy-npc-stone-value">
                  <EditableValue
                    v-if="npc.储物空间"
                    :model-value="npc.储物空间.灵石 || 0"
                    type="number"
                    label="灵石"
                    :min="0"
                    :format="(v) => Number(v ?? 0).toLocaleString()"
                    @update:model-value="npc.储物空间.灵石 = Number($event)"
                  />
                  <template v-else>{{ (npc.储物空间?.灵石 || 0).toLocaleString() }}</template>
                </span>
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
                    <button
                      type="button"
                      class="xy-trash"
                      title="删除此物品"
                      @click.stop="requestDelete('npc-item', `${name}::${iname}`, String(iname))"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                        <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                      </svg>
                    </button>
                    <div class="xy-item-head">
                      <span class="xy-item-name">{{ iname }}</span>
                      <span class="xy-item-qty">×<EditableValue v-model.number="it.数量" type="number" label="数量" :min="0" /></span>
                    </div>
                    <div class="xy-item-meta">
                      <span :class="['xy-quality', 'xy-q-' + it.品质]">{{ it.品质 }}</span>
                      <span class="xy-pill">{{ it.类型 }}</span>
                      <span v-if="it.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(it.五行) }">{{ it.五行 }}</span>
                    </div>
                    <div v-if="it.描述 || state.editMode" class="xy-item-desc"><EditableValue v-model="it.描述" label="描述" multiline /></div>
                    <div v-if="!_.isEmpty(it.效果) || state.editMode" class="xy-effect-list">
                      <EffectList v-model="it.效果" />
                    </div>
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
                    <button
                      type="button"
                      class="xy-trash"
                      title="删除此装备"
                      @click.stop="requestDelete('npc-equip', `${name}::${ename2}`, String(ename2))"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                        <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                      </svg>
                    </button>
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
                      <span v-if="eq.攻击力 != null" class="xy-eq-stat xy-stat-atk">攻 <EditableValue v-model.number="eq.攻击力" type="number" label="攻击力" :min="0" /></span>
                      <span v-if="eq.防御力 != null" class="xy-eq-stat xy-stat-def">防 <EditableValue v-model.number="eq.防御力" type="number" label="防御力" :min="0" /></span>
                    </div>
                    <div v-if="eq.描述 || state.editMode" class="xy-item-desc"><EditableValue v-model="eq.描述" label="描述" multiline /></div>
                    <div v-if="!_.isEmpty(eq.效果) || state.editMode" class="xy-effect-list">
                      <EffectList v-model="eq.效果" />
                    </div>
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
                  <CombatUnit
                    v-for="(u, uname) in npc.储物空间.傀儡"
                    :key="uname"
                    :unit="u"
                    :name="String(uname)"
                    compact
                    deletable
                    @delete="requestDelete('npc-puppet', `${name}::${uname}`, String(uname))"
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
                  <CombatUnit
                    v-for="(u, uname) in npc.储物空间.灵兽"
                    :key="uname"
                    :unit="u"
                    :name="String(uname)"
                    compact
                    deletable
                    @delete="requestDelete('npc-beast', `${name}::${uname}`, String(uname))"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="npc.性格 || state.editMode" class="xy-mini-block">
            <h4>性格</h4>
            <p><EditableValue v-model="npc.性格" label="性格" multiline :rows="3" /></p>
          </div>
          <div v-if="npc.外貌 || state.editMode" class="xy-mini-block">
            <h4>外貌</h4>
            <p><EditableValue v-model="npc.外貌" label="外貌" multiline :rows="3" /></p>
          </div>
          <div v-if="npc.着装 || state.editMode" class="xy-mini-block">
            <h4>着装</h4>
            <p><EditableValue v-model="npc.着装" label="着装" multiline :rows="3" /></p>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { useDataStore } from '../store';
import CombatUnit from './CombatUnit.vue';
import EditableValue from './EditableValue.vue';
import EffectList from './EffectList.vue';
import {
  state,
  sortedRelations,
  getNpcAvatar,
  onAvatarClick,
  avatarChar,
  triggerAvatarUpload,
  clearNpcAvatar,
  favorClass,
  favorLabel,
  requestDelete,
  isSectionOpen,
  toggleSection,
  hasSkills,
  hasStorage,
  canControlNpc,
  isArtEffectivelyActive,
  toggleNpcArt,
  npcBarPct,
  skillCap,
  formatSkillNum,
  elColor,
} from '../composables';

const store = useDataStore();
</script>
