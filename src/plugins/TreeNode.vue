<!-- src/plugins/TreeNode.vue v6-->
<template>
  <div class="tree-node">
    <div
      class="tree-node-header"
      @click="toggleExpanded"
    >
      <span class="tree-node-toggle" v-if="isExpandable">
        {{ isNodeExpanded ? '▼' : '►' }}
      </span>
      <span class="tree-node-key">{{ name }}:</span>

      <span class="tree-node-value" v-if="!isExpandable">
        <span :class="'value-' + valueType">{{ formattedValue }}</span>
      </span>
      <span class="tree-node-preview" v-else>
        {{ objectPreview }}
      </span>
    </div>

    <div class="tree-node-children" v-if="isNodeExpanded && isExpandable">
      <TreeNode
        v-for="(value, key) in data"
        :key="key"
        :data="value"
        :name="key"
        :path="getChildPath(key)"
        :tab="tab"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, inject } from 'vue'
import { inspectorState } from './vueInspector'

export default {
  name: 'TreeNode',
  props: {
    data: {
      type: [Object, Array, String, Number, Boolean, Function, Date, Set, Map, null],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    path: {
      type: String,
      default: ''
    },
    tab: {
      type: String,
      default: 'props'
    }
  },
  setup(props) {
    // Создаем полный путь для текущего узла
    const nodePath = computed(() => {
      return props.path || props.name;
    });

    // Проверяем, открыт ли узел, на основе состояния в inspectorState
    const isNodeExpanded = computed(() => {
      return inspectorState.expandedPaths[props.tab].has(nodePath.value);
    });

    // Определяем, можно ли разворачивать узел
    const isExpandable = computed(() => {
      const type = typeof props.data;
      return (
        (type === 'object' && props.data !== null) ||
        (Array.isArray(props.data) && props.data.length > 0)
      );
    });

    // Получаем тип значения для стилизации
    const valueType = computed(() => {
      if (props.data === null) return 'null';
      if (props.data === undefined) return 'undefined';
      if (Array.isArray(props.data)) return 'array';
      return typeof props.data;
    });

    // Форматируем значение для отображения
    const formattedValue = computed(() => {
      if (props.data === null) return 'null';
      if (props.data === undefined) return 'undefined';

      const type = typeof props.data;

      if (type === 'string') return `"${props.data}"`;
      if (type === 'function') return 'ƒ()';
      if (props.data instanceof Date) return props.data.toISOString();
      if (props.data instanceof Set) return `Set(${props.data.size})`;
      if (props.data instanceof Map) return `Map(${props.data.size})`;

      return String(props.data);
    });

    // Создаем предпросмотр для объектов и массивов
    const objectPreview = computed(() => {
      if (Array.isArray(props.data)) {
        if (props.data.length === 0) return '[]';
        return `Array(${props.data.length})`;
      }

      if (props.data instanceof Date) {
        return props.data.toISOString();
      }

      if (props.data instanceof Set) {
        return `Set(${props.data.size})`;
      }

      if (props.data instanceof Map) {
        return `Map(${props.data.size})`;
      }

      if (typeof props.data === 'object' && props.data !== null) {
        const keys = Object.keys(props.data);
        if (keys.length === 0) return '{}';
        if (keys.length <= 3) {
          return `{ ${keys.join(', ')} }`;
        }
        return `{ ${keys.slice(0, 3).join(', ')}, ... }`;
      }

      return '{...}';
    });

    // Функция для генерации пути дочернего элемента
    const getChildPath = (key) => {
      return `${nodePath.value}.${key}`;
    };

    // Функция для переключения состояния развернутости
    const toggleExpanded = () => {
      if (isExpandable.value) {
        if (isNodeExpanded.value) {
          inspectorState.expandedPaths[props.tab].delete(nodePath.value);
        } else {
          inspectorState.expandedPaths[props.tab].add(nodePath.value);
        }
      }
    };

    return {
      isNodeExpanded,
      isExpandable,
      valueType,
      formattedValue,
      objectPreview,
      toggleExpanded,
      getChildPath
    };
  }
}
</script>

<style scoped>
.tree-node {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  margin-left: 2px;
}

.tree-node-header {
  cursor: pointer;
  padding: 2px 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.tree-node-header:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.tree-node-toggle {
  display: inline-block;
  width: 14px;
  color: #888;
}

.tree-node-key {
  color: #881391;
  margin-right: 4px;
}

.tree-node-value {
  color: #1a1a1a;
}

.tree-node-preview {
  color: #888;
  font-style: italic;
}

.tree-node-children {
  padding-left: 12px;
  border-left: 1px dotted #ddd;
}

.value-string {
  color: #c41a16;
}

.value-number {
  color: #1c00cf;
}

.value-boolean {
  color: #aa0d91;
}

.value-null, .value-undefined {
  color: #808080;
  font-style: italic;
}

.value-function {
  color: #4b5cc4;
  font-style: italic;
}

.value-object, .value-array {
  color: #888;
}
</style>