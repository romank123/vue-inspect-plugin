// src/plugins/vueInspector.js v6
import { reactive, markRaw, createApp } from 'vue'
import VueInspector from './VueInspector.vue'

const STORAGE_KEY = 'vue-inspector-enabled'

export const inspectorState = reactive({
  enabled: localStorage.getItem(STORAGE_KEY) === 'true',
  activeComponentData: null,
  activeComponentProps: null,
  activeComponentName: '',
  position: {
    left: 10,
    top: 10
  },
  size: {
    width: 300,
    height: 400
  },
  // Сохраняем предыдущую высоту перед сворачиванием
  previousHeight: 400,
  // Добавляем хранение состояний для открытых элементов
  expandedPaths: {
    props: new Set(),
    data: new Set()
  },
  // Добавляем флаг свернутого состояния
  collapsed: localStorage.getItem('vue-inspector-collapsed') === 'true'
})

// Сохраняем позицию, размер и состояние инспектора при закрытии страницы
window.addEventListener('beforeunload', () => {
  localStorage.setItem('vue-inspector-position', JSON.stringify(inspectorState.position))
  localStorage.setItem('vue-inspector-size', JSON.stringify(inspectorState.size))
  localStorage.setItem('vue-inspector-previous-height', String(inspectorState.previousHeight))
  localStorage.setItem('vue-inspector-collapsed', inspectorState.collapsed.toString())

  // Сохраняем состояние развернутых элементов
  const expandedState = {
    props: Array.from(inspectorState.expandedPaths.props),
    data: Array.from(inspectorState.expandedPaths.data)
  }
  localStorage.setItem('vue-inspector-expanded', JSON.stringify(expandedState))
})

// Восстанавливаем позицию, размер и состояние при инициализации, если они были сохранены
try {
  const savedPosition = JSON.parse(localStorage.getItem('vue-inspector-position'))
  if (savedPosition) {
    // Проверяем, используются ли старые ключи (x, y) и преобразуем их
    if ('x' in savedPosition && 'y' in savedPosition) {
      inspectorState.position = {
        left: window.innerWidth - savedPosition.x - 300, // Примерная конвертация
        top: savedPosition.y
      }
    } else {
      inspectorState.position = savedPosition
    }
  }

  const savedSize = JSON.parse(localStorage.getItem('vue-inspector-size'))
  if (savedSize) {
    inspectorState.size = savedSize
  }

  // Восстанавливаем предыдущую высоту
  const previousHeight = localStorage.getItem('vue-inspector-previous-height')
  if (previousHeight) {
    inspectorState.previousHeight = parseInt(previousHeight, 10)
  } else {
    inspectorState.previousHeight = inspectorState.size.height
  }

  // Восстанавливаем состояние развернутых элементов
  const savedExpandedState = JSON.parse(localStorage.getItem('vue-inspector-expanded'))
  if (savedExpandedState) {
    if (savedExpandedState.props) {
      inspectorState.expandedPaths.props = new Set(savedExpandedState.props)
    }
    if (savedExpandedState.data) {
      inspectorState.expandedPaths.data = new Set(savedExpandedState.data)
    }
  }
} catch (e) {
  console.warn('Failed to parse saved inspector settings', e)
}

export const VueInspectorPlugin = {
  install(app, options = {}) {
    // Сбрасываем состояние при смене компонента
    const resetComponentData = () => {
      // Сохраняем текущее состояние развернутых элементов, не сбрасываем его
      inspectorState.activeComponentData = null
      inspectorState.activeComponentProps = null
      inspectorState.activeComponentName = ''
    }

    // Добавляем хук для сбора данных компонентов
    app.mixin({
      mounted() {
        if (!this.$parent) {
          // Это корневой компонент, добавляем инспектор
          addInspectorToDOM()
        }

        // Добавляем метод для выбора этого компонента в инспекторе
        this.$inspectComponent = () => {
          inspectorState.activeComponentName = this.$options.name || 'Anonymous Component'
          inspectorState.activeComponentProps = markRaw(this.$props || {})
          inspectorState.activeComponentData = markRaw(this.$data || {})
        }
      }
    })

    // Добавляем глобальную переменную для управления инспектором
    window.$vueInspector = {
      enable() {
        inspectorState.enabled = true
        localStorage.setItem(STORAGE_KEY, 'true')
      },
      disable() {
        inspectorState.enabled = false
        localStorage.setItem(STORAGE_KEY, 'false')
      },
      toggle() {
        inspectorState.enabled = !inspectorState.enabled
        localStorage.setItem(STORAGE_KEY, inspectorState.enabled.toString())
      },
      collapse() {
        // Сохраняем текущую высоту перед сворачиванием
        if (!inspectorState.collapsed) {
          inspectorState.previousHeight = inspectorState.size.height;
        }
        inspectorState.collapsed = true
        localStorage.setItem('vue-inspector-collapsed', 'true')
      },
      expand() {
        // Восстанавливаем высоту при разворачивании
        inspectorState.size.height = inspectorState.previousHeight;
        inspectorState.collapsed = false
        localStorage.setItem('vue-inspector-collapsed', 'false')
      },
      toggleCollapsed() {
        if (!inspectorState.collapsed) {
          // Если сворачиваем, сохраняем текущую высоту
          inspectorState.previousHeight = inspectorState.size.height;
        } else {
          // Если разворачиваем, восстанавливаем предыдущую высоту
          inspectorState.size.height = inspectorState.previousHeight;
        }

        inspectorState.collapsed = !inspectorState.collapsed
        localStorage.setItem('vue-inspector-collapsed', inspectorState.collapsed.toString())
      }
    }
  }
}

// Добавляем инспектор в DOM
function addInspectorToDOM() {
  const inspectorContainer = document.createElement('div')
  inspectorContainer.id = 'vue-inspector-container'
  document.body.appendChild(inspectorContainer)

  const inspectorApp = createApp(VueInspector)
  inspectorApp.mount('#vue-inspector-container')
}

export default VueInspectorPlugin