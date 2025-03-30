<!-- src/plugins/VueInspector.vue v6-->
<template>
  <div
    v-if="inspectorState.enabled"
    class="vue-inspector"
    :class="{ 'collapsed': inspectorState.collapsed }"
    :style="inspectorStyle"
    @mousedown="startDrag"
    @mouseup="handleResizeEnd"
  >
    <div class="vue-inspector-header">
      <div class="vue-inspector-title">
        {{ inspectorState.activeComponentName || 'Vue Inspector' }}
      </div>
      <div class="vue-inspector-actions">
        <button @click="toggleCollapsed" class="vue-inspector-button" :title="inspectorState.collapsed ? 'Развернуть' : 'Свернуть'">
          {{ inspectorState.collapsed ? '▼' : '▲' }}
        </button>
        <button @click="toggleInspector" class="vue-inspector-button" title="Включить/выключить инспектор">
          {{ inspectorState.enabled ? 'Disable' : 'Enable' }}
        </button>
      </div>
    </div>

    <template v-if="!inspectorState.collapsed">
      <div class="vue-inspector-tabs">
        <button
          class="vue-inspector-tab"
          :class="{ active: activeTab === 'props' }"
          @click="activeTab = 'props'"
        >
          Props
        </button>
        <button
          class="vue-inspector-tab"
          :class="{ active: activeTab === 'data' }"
          @click="activeTab = 'data'"
        >
          Data
        </button>
      </div>

      <div class="vue-inspector-content">
        <div v-if="activeTab === 'props'">
          <TreeNode
            v-if="inspectorState.activeComponentProps"
            :data="inspectorState.activeComponentProps"
            :name="'props'"
            :tab="'props'"
          />
          <div v-else class="vue-inspector-empty">
            No props available
          </div>
        </div>

        <div v-if="activeTab === 'data'">
          <TreeNode
            v-if="inspectorState.activeComponentData"
            :data="inspectorState.activeComponentData"
            :name="'data'"
            :tab="'data'"
          />
          <div v-else class="vue-inspector-empty">
            No data available
          </div>
        </div>
      </div>

      <div class="vue-inspector-footer">
        <div class="vue-inspector-help">
          Press Alt+Shift+I to toggle inspector
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { inspectorState } from './vueInspector'
import TreeNode from './TreeNode.vue'

export default {
  name: 'VueInspector',
  components: {
    TreeNode
  },
  setup() {
    const activeTab = ref('props')
    const isDragging = ref(false)
    const isResizing = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })

    const inspectorStyle = computed(() => {
      const styles = {
        top: `${inspectorState.position.top}px`,
        left: `${inspectorState.position.left}px`,
        width: `${inspectorState.size.width}px`,
      };

      // Если инспектор не в свернутом виде, добавляем высоту
      if (!inspectorState.collapsed) {
        styles.height = `${inspectorState.size.height}px`;
      }

      return styles;
    })

    // Функция для начала перетаскивания
    const startDrag = (event) => {
      // Пропускаем, если клик был на кнопку
      if (event.target.tagName === 'BUTTON') return

      // Определяем, является ли это попыткой изменения размера
      // Проверяем, близко ли мышь к правому нижнему углу
      const rect = event.currentTarget.getBoundingClientRect()
      const isNearRightBottom =
        event.clientX > rect.right - 20 &&
        event.clientY > rect.bottom - 20

      if (isNearRightBottom) {
        // Это попытка изменения размера, не начинаем перетаскивание
        isResizing.value = true
        return
      }

      isDragging.value = true
      dragOffset.value = {
        x: event.clientX - inspectorState.position.left,
        y: event.clientY - inspectorState.position.top
      }

      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', stopDrag)
    }

    // Обработчик перемещения мыши
    const onDrag = (event) => {
      if (!isDragging.value) return

      const newLeft = event.clientX - dragOffset.value.x
      const newTop = event.clientY - dragOffset.value.y

      // Ограничиваем перемещение в пределах окна
      inspectorState.position.left = Math.max(10, Math.min(window.innerWidth - inspectorState.size.width - 10, newLeft))
      inspectorState.position.top = Math.max(10, Math.min(window.innerHeight - inspectorState.size.height - 10, newTop))
    }

    // Функция для остановки перетаскивания
    const stopDrag = () => {
      isDragging.value = false
      isResizing.value = false
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    // Функция для включения/выключения инспектора
    const toggleInspector = () => {
      window.$vueInspector.toggle()
    }

    // Функция для сворачивания/разворачивания инспектора
    const toggleCollapsed = () => {
      if (!inspectorState.collapsed) {
        // Если сворачиваем, сохраняем текущую высоту
        inspectorState.previousHeight = inspectorState.size.height;
      } else {
        // Если разворачиваем, восстанавливаем предыдущую высоту
        inspectorState.size.height = inspectorState.previousHeight;
      }

      inspectorState.collapsed = !inspectorState.collapsed;
      localStorage.setItem('vue-inspector-collapsed', inspectorState.collapsed.toString());

      // Сохраняем предыдущую высоту в localStorage
      localStorage.setItem('vue-inspector-previous-height', String(inspectorState.previousHeight));
    }

    // Отслеживаем изменения размера
    const handleResize = (event) => {
      if (isResizing.value) {
        // Обработка изменения размера здесь, если требуется дополнительная логика
      }
    }

    // Обработчик окончания изменения размера
    const handleResizeEnd = (event) => {
      // Сохраняем новый размер независимо от флага isResizing,
      // так как resize может произойти через CSS resize
      const rect = event.currentTarget.getBoundingClientRect()

      inspectorState.size = {
        width: rect.width,
        height: rect.height
      }

      // Если окно не свернуто, обновляем также previousHeight
      if (!inspectorState.collapsed) {
        inspectorState.previousHeight = rect.height;
      }

      // Сохраняем в localStorage для персистентности
      localStorage.setItem('vue-inspector-size', JSON.stringify(inspectorState.size))
      localStorage.setItem('vue-inspector-previous-height', String(inspectorState.previousHeight))
      isResizing.value = false
    }

    // Добавляем горячую клавишу для включения/выключения инспектора
    const handleKeyDown = (event) => {
      // Alt+Shift+I
      if (event.altKey && event.shiftKey && event.key === 'I') {
        toggleInspector()
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    })

    return {
      inspectorState,
      activeTab,
      inspectorStyle,
      startDrag,
      toggleInspector,
      toggleCollapsed,
      isResizing,
      handleResizeEnd
    }
  }
}
</script>

<style scoped>
.vue-inspector {
  position: fixed;
  min-width: 200px;
  min-height: 32px; /* Высота заголовка для свернутого режима */
  max-height: 80vh;
  background-color: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 9999;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  overflow: hidden;
  resize: both;
}

.vue-inspector.collapsed {
  resize: none; /* Отключаем resize для свернутого режима */
  min-height: auto;
  height: auto !important; /* Принудительно устанавливаем высоту по контенту */
}

.vue-inspector-header {
  padding: 8px 10px;
  background-color: #41b883;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}

.vue-inspector-title {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vue-inspector-actions {
  display: flex;
  gap: 4px;
}

.vue-inspector-button {
  padding: 2px 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 3px;
  color: white;
  cursor: pointer;
  font-size: 11px;
}

.vue-inspector-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.vue-inspector-tabs {
  display: flex;
  background-color: #f3f3f3;
  border-bottom: 1px solid #dddddd;
}

.vue-inspector-tab {
  padding: 6px 12px;
  border: none;
  background: none;
  cursor: pointer;
}

.vue-inspector-tab.active {
  background-color: #ffffff;
  border-bottom: 2px solid #41b883;
  font-weight: bold;
}

.vue-inspector-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background-color: #ffffff;
}

.vue-inspector-empty {
  padding: 20px;
  text-align: center;
  color: #999999;
  font-style: italic;
}

.vue-inspector-footer {
  border-top: 1px solid #dddddd;
  padding: 4px 8px;
  font-size: 10px;
  color: #888888;
  background-color: #f9f9f9;
}

/* Добавляем стиль для индикатора изменения размера, показываем только когда не свернут */
.vue-inspector:not(.collapsed):after {
  content: '';
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 10px;
  height: 10px;
  cursor: nwse-resize; /* Курсор изменения размера */
  background: linear-gradient(
    135deg,
    transparent 50%,
    rgba(65, 184, 131, 0.5) 50%,
    rgba(65, 184, 131, 0.8) 75%,
    #41b883 100%
  );
  border-bottom-right-radius: 3px;
  pointer-events: none; /* Чтобы не мешало обработке событий мыши */
}
</style>