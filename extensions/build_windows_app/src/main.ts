import { BrowserWindow } from "electron";

const fs = require('fs');
// 执行cmd命令
const exec = require('child_process').exec;


var path = require('path')
const os = require('os');

const {dialog} = require('electron').remote;


const $ = null;


/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {

    a () {

    },

    // 打开发布面板
    open_build_panel () {
        console.log("打开了发布面板");
        Editor.Panel.open("build_windows_app.build");
    },

    // 开始构建
    startBuild (value: any) {
        BrowserWindow.getFocusedWindow()!.on('close', e => {
            console.log("成功接到了回调");
            e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下
        });
        exec()

    },


    // 预览
    preview () {
        console.log("开始预览");
        let a = path.resolve(__dirname, '..')
        let b = path.resolve(a, '..');
        // 项目路径
        let c = path.resolve(b, '..');

        // 指令
        const cmd = 'electron preview';
        // 创建cmd的位置
        const cwd = `${c}/main`;
        exec(cmd, { cwd }, function (error:any, stdout:any, stderr:any) {
            if (error) {
                console.log("预览失败");
                console.log("失败log:", stderr);
                return;
            }
            console.log("输出内容：", stdout);
            console.log("预览成功了！");
        });
    }


};


/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() { }

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() { }

export async function close () {
    console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww");
    // e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下

};
