'use strict';
const fs = require("fs");
var path = require('path');
const child_process = require("child_process");

// 预览端口
let port = "";


// 注释掉所有log
console.log = function() {}


// HTML 文本
exports.template = fs.readFileSync(__dirname + "/index.html", "utf8");

// 样式文本
// exports.style = fs.readFileSync(__dirname + "/index.css", "utf8");
exports.style = `
.div_title {
    margin: 10px;
    text-align:center;
    font-size: 20px
}
.div_port {
    margin:7px;
    margin-left: 15px;
}
.div_describe0 {
    margin:7px;
    margin-left: 15px;
}
.div_describe1 {
    margin:7px;
    margin-left: 15px;
}
.div_btn {
    margin:7px;
    text-align:center;
}
`;

// 渲染后 HTML 选择器
exports.$ = {
    port: ".port",
    btn: ".green",
};

// 面板上的方法
exports.methods = {};

// 面板上触发的事件
exports.listeners = {};

// 当面板渲染成功后触发
exports.ready = async function() {

    // 检查之前是否设置过预览端口
    Editor.Profile.getProject("build_windows_app", "port", "project").then((result) => {
        console.log("配置系统的port", result);
        if (result != undefined) {
            this.$.port.value = result;
            console.log("之前设置过端口");
        } else {
            console.log("之前从来没设置过端口");
        }
    });
    // let port_data = Editor.Profile.setProject("build_windows_app", "port", "value", "project");

    // 给确定按钮绑定事件
    this.$.btn.addEventListener('confirm', ()=>{
        Editor.Profile.setProject("build_windows_app", "port", this.$.port.value, "project");
        Editor.Message.send('build_windows_app', 'setPreviewPort', this.$.port.value);
        console.log("设置了预览服务器端口", this.$.port.value);
    });

    
};

// 尝试关闭面板的时候触发
exports.beforeClose = async function() {};

// 当面板实际关闭后触发
exports.close = async function() {};
