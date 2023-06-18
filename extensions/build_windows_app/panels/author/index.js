'use strict';

const fs = require("fs");
const exec = require('child_process').exec;


// 注释掉所有log
console.log = function() {}


// HTML 文本
exports.template = fs.readFileSync(__dirname + "/index.html", "utf8");

exports.style = fs.readFileSync(__dirname + "/index.css", "utf8");

// 渲染后 HTML 选择器
exports.$ = {
    open_BV1: ".open_BV1",
    open_BV2: ".open_BV2",
    reward: ".reward",
    dashang: ".dashang",
    aaa: ".AAA"
};

// 面板上的方法
exports.methods = {};

// 面板上触发的事件
exports.listeners = {};

// 当面板渲染成功后触发
exports.ready = async function() {
    this.$.aaa.src = `${__dirname}\\afdian-property.jpg`;
    this.$.aaa.width = 400;
    this.$.aaa.height = 600;

    this.$.open_BV1.addEventListener('confirm', ()=>{
        console.log("打开了BV");
        exec('start https://www.bilibili.com/video/BV1vd4y127co');
    });

    /* this.$.open_BV2.addEventListener('confirm', ()=>{
        console.log("打开了BV");
        // window.open("https://afdian.net/@property"); //在另外新建窗口中打开窗口
        exec('start https://www.bilibili.com/video/BV1vd4y127co');
    }); */

    this.$.reward.addEventListener('confirm', ()=>{
        console.log("打开了BV");
        exec('start https://afdian.net/@property');
    });
};

// 尝试关闭面板的时候触发
exports.beforeClose = async function() {};

// 当面板实际关闭后触发
exports.close = async function() {};
