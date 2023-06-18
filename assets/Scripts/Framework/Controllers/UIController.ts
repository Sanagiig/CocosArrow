import { _decorator, Button, Component, Node } from "cc";
const { ccclass } = _decorator;

@ccclass("UIController")
export class UIController extends Component {
  protected view: { [k: string]: Node } = {};

  protected onLoad(): void {
    this.loadAllNodeView(this.node, "/");
  }

  private loadAllNodeView(root: Node, path: string) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      this.view[path + child.name] = child;
      this.loadAllNodeView(child, `${path}${child.name}/`);
    }
  }

  getViewNode(name: string) {
    return this.view[name];
  }

  addListener(name: string, eventName: string, cb: Function, caller?: any) {
    const node = this.getViewNode(name);
    if (node) {
      node.on(eventName, cb, caller);
    }
  }

  addButtonListener(name: string, cb: Function, caller?: any) {
    const node = this.getViewNode(name);
    if (!node) {
      return;
    }

    const btn = node.getComponent(Button);
    if (btn) {
      node.on("click", cb, caller);
    }
  }

  display() {
    this.node.active = true;
  }

  hide() {
    this.node.active = false;
  }

  remove() {
    this.node.destroy();
    this.node.removeFromParent();
  }
}
