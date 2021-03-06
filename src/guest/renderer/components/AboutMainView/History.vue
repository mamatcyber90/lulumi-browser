<template lang="pug">
  div
    el-row(type="flex", align="middle")
      el-col(:span="4")
        h1 {{ $t('about.historyPage.title') }}
      el-col(:span="4")
        div {{ `${$t('about.historyPage.sync')} ${syncStatus()}` }}
        el-switch(@change="toggleSync", v-model="sync", on-color="#13ce66", off-color="#ff4949")
      el-col(:span="12")
        el-input#history-filter(@focus="toggleSync(false)", @blur="toggleSync(true)", :placeholder="$t('about.historyPage.placeholder')", v-model="filterText")
      el-col(:span="2")
        el-button(:disabled="sync", type="info", @click="setHistory") {{ $t('about.historyPage.clear') }}
    el-row
      el-col(:span="24")
        el-tree(ref="tree", :empty-text="$t('about.historyPage.noData')", :data="data", :show-checkbox="true", :default-expand-all="true", :render-content="customRender", :filter-node-method="filterNode")
</template>

<script lang="ts">
  import { Component, Watch, Vue } from 'vue-property-decorator';
  import VueI18n from 'vue-i18n';

  import { Button, Col, Input, Row, Tree } from 'element-ui';

  import '../../css/el-tree';

  interface HistoryItem {
    id: number;
    title: string;
    label: string;
    favicon: string;
    url: string;
    time: string;
    flag: boolean;
    children: Array<HistoryItem>;
  }

  declare const ipcRenderer: Electron.IpcRenderer;

  @Component({
    components: {
      'el-button': Button,
      'el-col': Col,
      'el-input': Input,
      'el-row': Row,
      'el-tree': Tree,
    },
  })
  export default class History extends Vue {
    history: Array<HistoryItem> = [];
    data: Array<HistoryItem> = [];
    handler: any = null;
    filterText: string = '';
    sync: boolean = true;
  
    @Watch('filterText')
    onFilterText(val: string): void {
      (this.$refs.tree as any).filter(val);
    }

    fetch(): void {
      this.handler = setInterval(() => {
        ipcRenderer.send('guest-want-data', 'history');
      }, 1000);
    }
    clear(): void {
      clearInterval(this.handler);
    }
    toggleSync(val: boolean): void {
      if (val) {
        if (!this.handler) {
          this.fetch();
        } else {
          this.clear();
          this.fetch();
        }
      } else {
        this.clear();
      }
    }
    syncStatus(): VueI18n.TranslateResult {
      if (this.sync) {
        return this.$t('about.historyPage.syncStatus.syncing');
      }
      return this.$t('about.historyPage.syncStatus.notSyncing');
    }
    setHistory(): void {
      const checkedNodes = (this.$refs.tree as any).getCheckedNodes();
      if (checkedNodes.length) {
        checkedNodes.forEach((element) => {
          this.history[element.id].flag = true;
        });
        this.history = this.history.filter(element => element.flag === undefined);
        // this.$message.error('Not implemented...');
      } else {
        this.history = [];
      }
      ipcRenderer.send('set-history', this.history);
    }
    filterNode(value: string, data: HistoryItem): boolean {
      if (!value) {
        return true;
      }
      if (data.children) {
        return data.label.toLowerCase().indexOf(value.toLowerCase()) !== -1;
      }
      return data.title.toLowerCase().indexOf(value.toLowerCase()) !== -1;
    }
    transformArr(history: Array<HistoryItem>): Array<HistoryItem> {
      const newArr: Array<HistoryItem> = [];
      const labels: object = {};
      let i: number;
      let j: number;
      let cur: HistoryItem;
      let curLabel: string;
      for (i = 0, j = history.length; i < j; i++) {
        cur = history[i];
        curLabel = cur.label;
        if (!(curLabel in labels)) {
          labels[curLabel] = { label: curLabel, time: cur.time, children: [], id: i };
          newArr.push(labels[curLabel]);
        }
        cur.id = i;
        labels[curLabel].children.push(cur);
      }
      return newArr;
    }
    customRender(h: Vue.CreateElement, node: any): Vue.VNode {
      const history: HistoryItem = node.data;
      if (history.children) {
        return h('span', history.label);
      }
      return h('span', { attrs: { class: 'history-list__item' } },
        [
          h('span', { attrs: { class: 'history-list__item-time' } }, history.time),
          h('img', { attrs: { src: history.favicon, width: '20px' } }),
          h('span', { attrs: { class: 'history-list__item-name' } }, history.title),
          h('a', { attrs: { href: history.url, class: 'history-list__item-link' } }, history.url),
        ],
      );
    }

    mounted() {
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.history = ret;
        this.data = this.transformArr(this.history);
      });
      this.fetch();
    }
    beforeDestroy() {
      this.clear();
      ipcRenderer.removeAllListeners('guest-here-your-data');
    }
  };
</script>

<style>
  .history-list__item {
    display: inline-flex;
    align-items: center;
    width: 100vw;
  }
  a.history-list__item-link {
    flex: 5;
    background-size: 0;
    padding-right: 100px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  a.history-list__item-link:hover {
    color: green;
  }
  .history-list__item-time {
    width: 50px;
    color: gray;
    padding-right: 30px;
  }
  .history-list__item-name {
    width: 400px;
    color: #48576a;
    padding: 0 4px;
    transition: color .3s;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
